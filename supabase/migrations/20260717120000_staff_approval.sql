-- Staff approval and self-service.
--
-- Previously an invite granted its role up front and sign-in activated the
-- account. That trusted the invite link itself: whoever opened the mailbox got
-- the access. Now the role travels as an *intention* until a human admin
-- approves the person who actually signed in.

ALTER TABLE public.staff_members
  -- The role to grant on approval. Nothing is written to user_roles before then.
  ADD COLUMN IF NOT EXISTS intended_role app_role,
  ADD COLUMN IF NOT EXISTS signed_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text;

ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_status_check;
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_status_check
  CHECK (status IN ('invited', 'pending_approval', 'active', 'suspended'));

-- Signing in proves the invite reached a real person; it does not prove the
-- admin still wants them to have access. Park them for review instead.
CREATE OR REPLACE FUNCTION public.link_staff_member_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.staff_members
  SET user_id = NEW.id,
      status = CASE WHEN status = 'invited' THEN 'pending_approval' ELSE status END,
      signed_in_at = COALESCE(signed_in_at, now()),
      invite_accepted_at = COALESCE(invite_accepted_at, now())
  WHERE user_id IS NULL
    AND public.crm_email_key(email) = public.crm_email_key(NEW.email);
  RETURN NEW;
END;
$$;

-- Inviting someone creates their auth.users row immediately, so the INSERT
-- trigger above fires before the staff record exists and cannot see it. The
-- moment that matters is the first actual sign-in, which is an UPDATE.
CREATE OR REPLACE FUNCTION public.mark_staff_signed_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS NOT NULL AND OLD.last_sign_in_at IS NULL THEN
    UPDATE public.staff_members
    SET user_id = COALESCE(user_id, NEW.id),
        status = CASE WHEN status = 'invited' THEN 'pending_approval' ELSE status END,
        signed_in_at = COALESCE(signed_in_at, now()),
        invite_accepted_at = COALESCE(invite_accepted_at, now())
    WHERE user_id = NEW.id
       OR (user_id IS NULL AND public.crm_email_key(email) = public.crm_email_key(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_staff_signed_in ON auth.users;
CREATE TRIGGER mark_staff_signed_in
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.mark_staff_signed_in();

-- ============ CHANGE REQUESTS ============
-- Staff may ask for a different role or position; only an admin may grant it.
CREATE TABLE IF NOT EXISTS public.staff_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  requested_role app_role,
  requested_position text,
  requested_department text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_change_requests_status_idx
  ON public.staff_change_requests(status, created_at DESC);
-- One open request per person keeps the admin queue honest.
CREATE UNIQUE INDEX IF NOT EXISTS staff_change_requests_one_open_idx
  ON public.staff_change_requests(staff_id) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE ON public.staff_change_requests TO authenticated;
GRANT ALL ON public.staff_change_requests TO service_role;
ALTER TABLE public.staff_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_requests_admin_all ON public.staff_change_requests;
CREATE POLICY staff_requests_admin_all ON public.staff_change_requests FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS staff_requests_read_own ON public.staff_change_requests;
CREATE POLICY staff_requests_read_own ON public.staff_change_requests FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.staff_members s
    WHERE s.id = staff_id AND s.user_id = auth.uid()
  ));

-- ============ SELF-SERVICE ============
-- Definer functions rather than an UPDATE policy: RLS gates rows, not columns,
-- so a writable own-row policy would let staff set their own status or
-- intended_role. These touch only what a person may change about themselves.
CREATE OR REPLACE FUNCTION public.update_my_staff_contact(_phone text, _whatsapp text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.staff_members
  SET phone = NULLIF(btrim(COALESCE(_phone, '')), ''),
      whatsapp_number = NULLIF(btrim(COALESCE(_whatsapp, '')), '')
  WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No staff record for the current user.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_staff_change(
  _role text DEFAULT NULL,
  _position text DEFAULT NULL,
  _department text DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_id uuid;
BEGIN
  SELECT id INTO v_staff_id FROM public.staff_members WHERE user_id = auth.uid();
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'No staff record for the current user.';
  END IF;

  -- Supersede any earlier open request rather than tripping the unique index.
  UPDATE public.staff_change_requests
  SET status = 'rejected', review_note = 'Superseded by a newer request.', reviewed_at = now()
  WHERE staff_id = v_staff_id AND status = 'pending';

  INSERT INTO public.staff_change_requests
    (staff_id, requested_role, requested_position, requested_department, note)
  VALUES (
    v_staff_id,
    CASE WHEN _role IS NULL OR _role = '' THEN NULL ELSE _role::app_role END,
    NULLIF(btrim(COALESCE(_position, '')), ''),
    NULLIF(btrim(COALESCE(_department, '')), ''),
    NULLIF(btrim(COALESCE(_note, '')), '')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_staff_contact(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_staff_contact(text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.request_staff_change(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_staff_change(text, text, text, text) TO authenticated;

-- ============ APPROVAL ============
-- The single place access is granted. Admin-only, and the role comes from the
-- record rather than from the caller, so approving cannot smuggle in a role.
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
END;
$$;

REVOKE ALL ON FUNCTION public.approve_staff_member(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_staff_member(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_staff_member(uuid, text) TO service_role;

-- Existing directory rows keep working: whatever role they already hold becomes
-- their recorded intention, so the Staff page shows the truth on first load.
UPDATE public.staff_members s
SET intended_role = ur.role
FROM public.user_roles ur
WHERE ur.user_id = s.user_id
  AND s.intended_role IS NULL
  AND ur.role::text <> 'client';
