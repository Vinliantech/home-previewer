-- Affiliate referrals enter the CRM pipeline.
--
-- Until now an affiliate referral was written to client_leads and stopped
-- there: no CRM lead, so no dedupe against an existing enquiry, no adviser
-- assignment, no follow-up task, no acknowledgement to the client. The
-- affiliate saw "submitted" and nobody was scheduled to call.
--
-- client_leads stays the affiliate's system of record — commissions reference
-- it — and now carries a link to the CRM lead the referral produced. The lead
-- carries the reverse link so the CRM shows who referred the client.

ALTER TABLE public.client_leads
  ADD COLUMN IF NOT EXISTS crm_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS referred_by_affiliate_id uuid
    REFERENCES public.affiliate_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS client_leads_crm_lead_idx
  ON public.client_leads(crm_lead_id);
CREATE INDEX IF NOT EXISTS leads_referred_by_affiliate_idx
  ON public.leads(referred_by_affiliate_id);

COMMENT ON COLUMN public.client_leads.crm_lead_id IS
  'The CRM lead this referral produced. Null for referrals submitted before '
  'this migration that had no matching lead.';
COMMENT ON COLUMN public.leads.referred_by_affiliate_id IS
  'Set when the lead originated from an affiliate referral; drives commission '
  'attribution when the sale is confirmed.';

-- Historical backfill: link only, never create.
--
-- Old referrals cannot be replayed through the capture pipeline — that would
-- send acknowledgement emails months late and assign advisers to stale
-- enquiries. So this links a past referral to a lead ONLY where the contact
-- identity matches exactly one lead, leaving genuinely ambiguous rows for a
-- human. Matching uses the same normalised keys the CRM dedupes on.
--
-- Side effect to expect: client_leads has a BEFORE UPDATE trigger on
-- updated_at, so every backfilled referral gets a fresh updated_at. Harmless
-- here — the affiliate list sorts and displays on created_at, and nothing
-- reads updated_at for business logic. created_at and submission_date, which
-- record when the referral was actually made, are untouched.
WITH matched AS (
  SELECT cl.id AS client_lead_id,
         min(l.id::text)::uuid AS lead_id,
         count(*) AS match_count
  FROM public.client_leads cl
  JOIN public.leads l
    ON (
         public.crm_email_key(l.email) IS NOT NULL
         AND public.crm_email_key(l.email) = public.crm_email_key(cl.client_email)
       )
    OR (
         public.crm_phone_key(l.phone) IS NOT NULL
         AND public.crm_phone_key(l.phone) = public.crm_phone_key(cl.client_phone)
       )
  WHERE cl.crm_lead_id IS NULL
  GROUP BY cl.id
)
UPDATE public.client_leads cl
SET crm_lead_id = m.lead_id
FROM matched m
WHERE cl.id = m.client_lead_id
  AND m.match_count = 1;

-- Mirror the attribution onto the leads that were just linked. Skip any lead
-- claimed by more than one affiliate: who earns the commission is a business
-- decision, not something this migration should guess at.
WITH sole_referrer AS (
  SELECT crm_lead_id AS lead_id,
         min(affiliate_id::text)::uuid AS affiliate_id
  FROM public.client_leads
  WHERE crm_lead_id IS NOT NULL
  GROUP BY crm_lead_id
  HAVING count(DISTINCT affiliate_id) = 1
)
UPDATE public.leads l
SET referred_by_affiliate_id = s.affiliate_id
FROM sole_referrer s
WHERE l.id = s.lead_id
  AND l.referred_by_affiliate_id IS NULL;
