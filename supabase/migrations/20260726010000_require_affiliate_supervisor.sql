-- An affiliate cannot be activated without a staff supervisor.
--
-- Every approved affiliate is somebody's responsibility: the supervisor is who
-- the affiliate contacts, and who answers for the referrals and commission
-- claims that follow. Approving first and assigning later meant live affiliates
-- with nobody accountable for them.
--
-- The admin UI disables Approve until a supervisor is chosen, but the UI is not
-- the boundary — affiliate_profiles is writable by admins through PostgREST, so
-- the rule lives here.

CREATE OR REPLACE FUNCTION public.require_affiliate_supervisor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.supervisor_staff_id IS NULL THEN
    -- Reject only when this statement caused the violation. Affiliates that
    -- were already active without a supervisor before this rule existed stay
    -- editable for everything else, so an admin can still correct their rate
    -- or details on the way to assigning someone.
    IF TG_OP = 'UPDATE'
       AND OLD.status = 'active'
       AND OLD.supervisor_staff_id IS NOT NULL
    THEN
      -- The supervisor is being taken away from a live affiliate.
      RAISE EXCEPTION
        'An active affiliate must keep a staff supervisor. Assign a different '
        'one, or suspend the affiliate first.'
        USING ERRCODE = 'check_violation';
    ELSIF TG_OP = 'INSERT'
       OR OLD.status IS DISTINCT FROM NEW.status
       OR OLD.supervisor_staff_id IS DISTINCT FROM NEW.supervisor_staff_id
    THEN
      RAISE EXCEPTION
        'Assign a staff supervisor before activating this affiliate'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS require_affiliate_supervisor_trg ON public.affiliate_profiles;
CREATE TRIGGER require_affiliate_supervisor_trg
BEFORE INSERT OR UPDATE ON public.affiliate_profiles
FOR EACH ROW EXECUTE FUNCTION public.require_affiliate_supervisor();

COMMENT ON FUNCTION public.require_affiliate_supervisor() IS
  'Blocks activating an affiliate, and blocks clearing the supervisor of an '
  'active affiliate. Pre-existing unsupervised active rows are left alone so '
  'they can still be edited and fixed.';

-- To find live affiliates that predate this rule and still need someone
-- assigned, query the table directly as an admin — the affiliates tab in the
-- admin dashboard shows the same thing with a picker beside each row:
--
--   SELECT affiliate_code, full_name, email
--   FROM public.affiliate_profiles
--   WHERE status = 'active' AND supervisor_staff_id IS NULL;
--
-- Deliberately not a view: a view over affiliate_profiles would run with the
-- owner's rights and leak affiliate names and emails to every authenticated
-- user unless carefully restricted, which is not worth it for a one-off check.
