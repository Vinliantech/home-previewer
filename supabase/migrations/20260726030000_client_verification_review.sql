-- Admin review of a client account, and a guard on the fields behind it.
--
-- profiles.id_verification_status has existed since the estate-operations
-- migration but nothing ever wrote it, so every client read "pending" forever.
-- Giving admins a way to set it exposes the real problem underneath: the
-- profiles UPDATE policy is
--
--   USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
--
-- with no WITH CHECK, so a client can already write any column on their own
-- row. That includes marking their own identity verified, and — since the
-- documentation number now lives on this table — claiming a different
-- client_number. Both are closed here.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS id_rejection_reason text;

COMMENT ON COLUMN public.profiles.id_rejection_reason IS
  'Shown to the client so they know what to correct. Set with '
  'id_verification_status = rejected.';

CREATE OR REPLACE FUNCTION public.guard_profile_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- A client edits their own name, phone and address. Identity, the
  -- documentation number and the account owner are decided elsewhere.
  IF NEW.id_verification_status IS DISTINCT FROM OLD.id_verification_status
     OR NEW.id_verified_by IS DISTINCT FROM OLD.id_verified_by
     OR NEW.id_verified_at IS DISTINCT FROM OLD.id_verified_at
     OR NEW.id_rejection_reason IS DISTINCT FROM OLD.id_rejection_reason
     OR NEW.client_number IS DISTINCT FROM OLD.client_number
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Identity verification and your client number are set by Kay-Steph'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END
$$;

-- BEFORE UPDATE only: the signup trigger inserts the row, and an INSERT guard
-- would have to special-case it.
DROP TRIGGER IF EXISTS guard_profile_admin_fields_trg ON public.profiles;
CREATE TRIGGER guard_profile_admin_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_admin_fields();

-- Recorded centrally so a verification decision is auditable like the rest of
-- the sensitive admin actions.
CREATE OR REPLACE FUNCTION public.review_client_verification(
  _user_id uuid,
  _decision text,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only an administrator can review a client account';
  END IF;

  IF _decision NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Unknown verification decision: %', _decision;
  END IF;

  IF _decision = 'rejected' AND COALESCE(btrim(_reason), '') = '' THEN
    RAISE EXCEPTION 'A rejection needs a reason the client can act on';
  END IF;

  UPDATE public.profiles
  SET id_verification_status = _decision,
      id_verified_by = CASE WHEN _decision = 'pending' THEN NULL ELSE auth.uid() END,
      id_verified_at = CASE WHEN _decision = 'pending' THEN NULL ELSE now() END,
      id_rejection_reason = CASE WHEN _decision = 'rejected' THEN btrim(_reason) ELSE NULL END
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No client profile for that account';
  END IF;

  -- Reuses the existing audit helper rather than writing audit_logs directly,
  -- so this decision is recorded the same way every other admin action is.
  PERFORM public.log_admin_action(
    'client_verification_' || _decision,
    'profiles',
    _user_id,
    jsonb_build_object('reason', btrim(COALESCE(_reason, '')))
  );
END
$$;

REVOKE ALL ON FUNCTION public.review_client_verification(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_client_verification(uuid, text, text) TO authenticated;
