-- Grant elevated access from a staff-directory selection, never from the
-- general client list. The existing tier rules still decide who may grant
-- administrator-level roles.

CREATE OR REPLACE FUNCTION public.grant_registered_staff_role(
  _staff_id uuid,
  _role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_status text;
  v_role app_role;
BEGIN
  BEGIN
    v_role := _role::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Unknown role: %', _role;
  END;

  PERFORM public.assert_role_change_allowed(auth.uid(), v_role);

  SELECT user_id, status
    INTO v_user_id, v_status
  FROM public.staff_members
  WHERE id = _staff_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff record not found.';
  END IF;
  IF v_user_id IS NULL OR v_status NOT IN ('active', 'pending_approval') THEN
    RAISE EXCEPTION 'Only registered, non-suspended staff can receive this role.';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = v_user_id AND role = 'client';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.staff_members
  SET status = 'active',
      intended_role = v_role,
      approved_by = auth.uid(),
      approved_at = COALESCE(approved_at, now()),
      rejected_reason = NULL
  WHERE id = _staff_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
  VALUES (
    auth.uid(),
    'registered_staff_role_granted',
    'staff_member',
    _staff_id,
    jsonb_build_object('role', v_role::text, 'user_id', v_user_id)
  );
END
$$;

REVOKE ALL ON FUNCTION public.grant_registered_staff_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_registered_staff_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_registered_staff_role(uuid, text) TO service_role;

COMMENT ON FUNCTION public.grant_registered_staff_role(uuid, text) IS
  'Grants an audited role only to a registered staff-directory account.';
