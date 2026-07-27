-- Workshop registrations, with their own reference and delivery tracking.
--
-- The Youth Network form previously produced a CRM lead and nothing else, so
-- there was no record to hand a participant a reference for, no way to tell a
-- repeat submission from a new one, and nowhere to record that a confirmation
-- email had failed.
--
-- The CRM lead is still the follow-up record; this table is the registration
-- itself, linked to it.

CREATE SEQUENCE IF NOT EXISTS public.workshop_reference_seq;

CREATE TABLE IF NOT EXISTS public.workshop_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stable, human-quotable reference printed on the confirmation email.
  reference text NOT NULL UNIQUE
    DEFAULT 'KSYN-' || lpad(nextval('public.workshop_reference_seq')::text, 5, '0'),
  -- Which workshop. A plain key rather than a crm_events FK: these landing
  -- pages exist before anyone creates the event row, and the reference must
  -- not wait on that.
  event_key text NOT NULL,
  event_name text NOT NULL,

  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  location text NOT NULL,
  gender text NOT NULL,
  occupation text,
  interest text NOT NULL,
  expectation text,
  consent_given boolean NOT NULL DEFAULT false,
  consent_at timestamptz,

  -- The CRM lead this registration produced, for follow-up.
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,

  -- Delivery state. A failed email must never lose the registration, so each
  -- side effect records its own outcome and can be retried independently.
  brevo_contact_status text NOT NULL DEFAULT 'pending'
    CHECK (brevo_contact_status IN ('pending', 'synced', 'failed')),
  confirmation_email_status text NOT NULL DEFAULT 'pending'
    CHECK (confirmation_email_status IN ('pending', 'sent', 'failed')),
  admin_email_status text NOT NULL DEFAULT 'pending'
    CHECK (admin_email_status IN ('pending', 'sent', 'failed')),
  last_error text,
  last_attempt_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One registration per person per workshop. Case-insensitive, because a
-- participant re-submitting with Aisha@ after Aisha@ is the same person.
CREATE UNIQUE INDEX IF NOT EXISTS workshop_registrations_event_email_uidx
  ON public.workshop_registrations (event_key, lower(btrim(email)));

CREATE INDEX IF NOT EXISTS workshop_registrations_event_idx
  ON public.workshop_registrations (event_key, created_at DESC);
-- Partial index: the retry sweep only ever looks for undelivered mail.
CREATE INDEX IF NOT EXISTS workshop_registrations_undelivered_idx
  ON public.workshop_registrations (confirmation_email_status)
  WHERE confirmation_email_status <> 'sent';

DROP TRIGGER IF EXISTS workshop_registrations_updated ON public.workshop_registrations;
CREATE TRIGGER workshop_registrations_updated
BEFORE UPDATE ON public.workshop_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Registrations arrive from a public form handled by a server function using
-- the service role, so no anon or authenticated write path is granted. Staff
-- read them through the CRM.
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.workshop_registrations TO authenticated;
GRANT ALL ON public.workshop_registrations TO service_role;

DROP POLICY IF EXISTS workshop_registrations_staff_read ON public.workshop_registrations;
CREATE POLICY workshop_registrations_staff_read ON public.workshop_registrations
  FOR SELECT TO authenticated
  USING (public.is_crm_admin(auth.uid()));

COMMENT ON TABLE public.workshop_registrations IS
  'Youth Network and other workshop sign-ups. The row is the registration; '
  'the linked lead is the CRM follow-up. Email delivery state is tracked per '
  'message so a Brevo outage never costs a registration.';
COMMENT ON COLUMN public.workshop_registrations.reference IS
  'KSYN-00001 style reference quoted to the participant. Never reissued.';
