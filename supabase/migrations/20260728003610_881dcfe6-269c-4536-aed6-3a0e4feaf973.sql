
CREATE SEQUENCE IF NOT EXISTS public.workshop_reference_seq;

CREATE TABLE IF NOT EXISTS public.workshop_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE
    DEFAULT 'KSYN-' || lpad(nextval('public.workshop_reference_seq')::text, 5, '0'),
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
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS workshop_registrations_event_email_uidx
  ON public.workshop_registrations (event_key, lower(btrim(email)));
CREATE INDEX IF NOT EXISTS workshop_registrations_event_idx
  ON public.workshop_registrations (event_key, created_at DESC);
CREATE INDEX IF NOT EXISTS workshop_registrations_undelivered_idx
  ON public.workshop_registrations (confirmation_email_status)
  WHERE confirmation_email_status <> 'sent';

DROP TRIGGER IF EXISTS workshop_registrations_updated ON public.workshop_registrations;
CREATE TRIGGER workshop_registrations_updated
BEFORE UPDATE ON public.workshop_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.workshop_registrations TO authenticated;
GRANT ALL ON public.workshop_registrations TO service_role;

DROP POLICY IF EXISTS workshop_registrations_staff_read ON public.workshop_registrations;
CREATE POLICY workshop_registrations_staff_read ON public.workshop_registrations
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
