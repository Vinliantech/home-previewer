-- Security hardening: audited, tiered role management.
--
-- Until now any admin could write user_roles directly from the browser: grant
-- anyone (including themselves) super_admin, or delete their own admin row and
-- lock themselves out — with no record of who did what. Role changes now go
-- through two definer RPCs that enforce tiers, refuse self-lockout and write
-- to the existing audit_logs table. Direct client writes are revoked; the
-- signup trigger (handle_new_user) and service-role paths are unaffected.

-- ============ AUDIT HELPER ============
-- Reuses public.audit_logs (actor_id, action, entity_type, entity_id,
-- previous_value, new_value, notes) — already admin-read via RLS.
--
-- Actor resolution: a signed-in caller is always recorded as themselves; the
-- _actor parameter is honoured only when there is no session (service role),
-- so a browser caller cannot spoof another actor.
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _entity_type text,
  _entity_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb,
  _actor uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := COALESCE(auth.uid(), _actor);
BEGIN
  -- Signed-in callers must hold a staff role; anonymous callers are impossible
  -- (no grant to anon) and a null uid means the service role.
  IF auth.uid() IS NOT NULL
     AND NOT (public.is_admin(auth.uid()) OR public.is_crm_admin(auth.uid())
              OR public.is_sales_agent(auth.uid())) THEN
    RAISE EXCEPTION 'Not permitted.';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
  VALUES (v_actor, _action, _entity_type, _entity_id, _details);
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, text, uuid, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, uuid, jsonb, uuid) TO service_role;

-- ============ TIERED ROLE MANAGEMENT ============
-- Tiers:
--   super_admin        may grant/revoke anything
--   admin              anything except the admin tier (super_admin, admin)
--   crm_manager        sales_agent only (CRM settings adds advisers)
-- Nobody may revoke their own admin-tier role: that is how lockouts happen.

CREATE OR REPLACE FUNCTION public.assert_role_change_allowed(_caller uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Sign in to manage roles.';
  END IF;

  IF _role IN ('super_admin', 'admin') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _caller AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Only a super admin can change administrator roles.';
    END IF;
  ELSIF public.is_admin(_caller) THEN
    RETURN;
  ELSIF public.is_crm_admin(_caller) AND _role = 'sales_agent' THEN
    RETURN;
  ELSE
    RAISE EXCEPTION 'You do not have permission to change this role.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_user_role(_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  BEGIN
    v_role := _role::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Unknown role: %', _role;
  END;

  PERFORM public.assert_role_change_allowed(auth.uid(), v_role);

  -- Staff standing replaces the default client role.
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'client';
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
  VALUES (auth.uid(), 'role_granted', 'user', _user_id, jsonb_build_object('role', _role));
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_role(_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  BEGIN
    v_role := _role::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Unknown role: %', _role;
  END;

  PERFORM public.assert_role_change_allowed(auth.uid(), v_role);

  IF _user_id = auth.uid() AND v_role IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION
      'You cannot remove your own administrator access — ask another administrator.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = v_role;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
  VALUES (auth.uid(), 'role_revoked', 'user', _user_id, jsonb_build_object('role', _role));
END;
$$;

REVOKE ALL ON FUNCTION public.grant_user_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_role(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) TO service_role;

-- ============ CLOSE THE DIRECT WRITE PATH ============
-- The RPCs are now the only way a browser session changes roles. The signup
-- trigger and service-role code run as owner/service and are unaffected.
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- ============ AUDIT THE STAFF APPROVAL GATE ============
-- Same body as 20260717120000, plus the audit record.
CREATE OR REPLACE FUNCTION public.approve_staff_member(_staff_id uuid, _role text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role app_role;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only an administrator may approve staff.';
  END IF;

  SELECT user_id, COALESCE(NULLIF(_role, '')::app_role, intended_role)
    INTO v_user_id, v_role
  FROM public.staff_members
  WHERE id = _staff_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'This person has not signed in yet, so there is no account to approve.';
  END IF;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Choose the access role to grant before approving.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = v_user_id AND role = 'client';
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.staff_members
  SET status = 'active',
      intended_role = v_role,
      approved_by = auth.uid(),
      approved_at = now(),
      rejected_reason = NULL
  WHERE id = _staff_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
  VALUES (auth.uid(), 'staff_approved', 'staff_member', _staff_id,
          jsonb_build_object('role', v_role::text, 'user_id', v_user_id));
END;
$$;
