-- CRM lead matching hardening.
--
-- The same person reaches Kay-Steph from several places: the website forms,
-- Meta Lead Ads, event registrations and manual entry. Each source formats the
-- contact details differently, so matching on the raw column values either
-- missed real duplicates (phone) or merged unrelated people (email via ILIKE,
-- where "_" is a wildcard). These helpers give every capture path one
-- normalised definition of "same contact", backed by matching indexes.

-- Case- and whitespace-insensitive email identity.
CREATE OR REPLACE FUNCTION public.crm_email_key(_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT nullif(lower(btrim(coalesce(_email, ''))), '');
$$;

-- Phone identity: digits only, last ten kept. Meta delivers +234 803 123 4567
-- while the website form collects 08031234567; the trailing ten digits are the
-- stable part across both.
CREATE OR REPLACE FUNCTION public.crm_phone_key(_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT nullif(right(regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g'), 10), '');
$$;

CREATE INDEX IF NOT EXISTS leads_email_key_idx
  ON public.leads (public.crm_email_key(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_phone_key_idx
  ON public.leads (public.crm_phone_key(phone)) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_whatsapp_key_idx
  ON public.leads (public.crm_phone_key(whatsapp_number)) WHERE whatsapp_number IS NOT NULL;

-- Superseded by the key indexes above: lower(email) is no longer the matching
-- expression, and the full-digit phone index never matched across formats.
DROP INDEX IF EXISTS public.leads_email_lookup_idx;
DROP INDEX IF EXISTS public.leads_phone_lookup_idx;

-- Resolves the existing lead for a captured contact.
-- Email is authoritative; phone (then WhatsApp) is the fallback so a Meta lead
-- and a website enquiry from the same person land on one record. Returns the
-- oldest match so history stays on the original profile.
CREATE OR REPLACE FUNCTION public.find_lead_by_contact(
  _email text DEFAULT NULL,
  _phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := public.crm_email_key(_email);
  v_phone text := public.crm_phone_key(_phone);
  v_id uuid;
BEGIN
  -- This runs as definer and so sees every lead. The capture pipeline calls it
  -- as service_role (auth.uid() is null); any signed-in caller must be CRM
  -- staff, otherwise a portal user could probe whether an email is on file.
  IF auth.uid() IS NOT NULL
     AND NOT (public.is_crm_admin(auth.uid()) OR public.is_sales_agent(auth.uid())) THEN
    RETURN NULL;
  END IF;

  IF v_email IS NOT NULL THEN
    SELECT id INTO v_id
    FROM public.leads
    WHERE public.crm_email_key(email) = v_email
    ORDER BY captured_at ASC
    LIMIT 1;
    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  -- A partial phone number is not an identity; require the full ten digits.
  IF v_phone IS NOT NULL AND length(v_phone) = 10 THEN
    SELECT id INTO v_id
    FROM public.leads
    WHERE public.crm_phone_key(phone) = v_phone
       OR public.crm_phone_key(whatsapp_number) = v_phone
    ORDER BY captured_at ASC
    LIMIT 1;
    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Never reachable with the anon key: only the capture pipeline (service_role)
-- and signed-in CRM staff, who are additionally gated inside the function.
REVOKE ALL ON FUNCTION public.find_lead_by_contact(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_lead_by_contact(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_lead_by_contact(text, text) TO authenticated;
