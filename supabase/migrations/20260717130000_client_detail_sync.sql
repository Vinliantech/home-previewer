-- Client detail propagation.
--
-- One person appears in up to three places: profiles (their account, shown in
-- the admin Clients tab and the client dashboard), leads (the CRM record) and
-- client_leads (the copy an affiliate submitted). The CRM and affiliate rows
-- carry their own contact columns, so a correction on the profile silently
-- diverged from them. This trigger makes profiles the source of truth for
-- name/email/phone: any update — by an admin or by the client — flows through.
--
-- Matching uses the person's identity BEFORE the change (old email/phone keys).
-- Matching on the new value would let an email correction capture some other
-- person's lead record.

CREATE OR REPLACE FUNCTION public.sync_client_details_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_email text := public.crm_email_key(OLD.email);
  v_old_phone text := public.crm_phone_key(OLD.phone);
BEGIN
  -- Only contact identity is propagated; ignore updates to anything else.
  IF NEW.full_name IS NOT DISTINCT FROM OLD.full_name
     AND public.crm_email_key(NEW.email) IS NOT DISTINCT FROM v_old_email
     AND public.crm_phone_key(NEW.phone) IS NOT DISTINCT FROM v_old_phone THEN
    RETURN NEW;
  END IF;

  IF v_old_email IS NULL AND v_old_phone IS NULL THEN
    RETURN NEW;
  END IF;

  -- CRM: update every lead that belonged to this identity, and leave a note in
  -- the activity trail so advisers can see why the record changed.
  WITH matched AS (
    UPDATE public.leads l
    SET full_name = COALESCE(NULLIF(btrim(NEW.full_name), ''), l.full_name),
        email = COALESCE(NULLIF(btrim(NEW.email), ''), l.email),
        phone = COALESCE(NULLIF(btrim(NEW.phone), ''), l.phone),
        last_activity_at = now()
    WHERE (v_old_email IS NOT NULL AND public.crm_email_key(l.email) = v_old_email)
       OR (v_old_phone IS NOT NULL AND public.crm_phone_key(l.phone) = v_old_phone)
    RETURNING l.id
  )
  INSERT INTO public.lead_activities (lead_id, activity_type, body, meta)
  SELECT id,
         'system',
         'Contact details synced from the client account profile.',
         jsonb_build_object('source', 'profile_sync')
  FROM matched;

  -- Affiliate pipeline: the submitted client record follows the same identity.
  UPDATE public.client_leads
  SET client_full_name = COALESCE(NULLIF(btrim(NEW.full_name), ''), client_full_name),
      client_email = COALESCE(NULLIF(btrim(NEW.email), ''), client_email),
      client_phone = COALESCE(NULLIF(btrim(NEW.phone), ''), client_phone)
  WHERE (v_old_email IS NOT NULL AND public.crm_email_key(client_email) = v_old_email)
     OR (v_old_phone IS NOT NULL AND public.crm_phone_key(client_phone) = v_old_phone);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_client_details ON public.profiles;
CREATE TRIGGER sync_client_details
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_client_details_from_profile();
