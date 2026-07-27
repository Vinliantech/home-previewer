-- Kay-Steph CRM workspace expansion.
-- Extends the existing sales CRM without creating a second lead database.

ALTER TYPE public.investment_type ADD VALUE IF NOT EXISTS 'land_purchase';
ALTER TYPE public.investment_type ADD VALUE IF NOT EXISTS 'residential_property';
ALTER TYPE public.investment_type ADD VALUE IF NOT EXISTS 'commercial_property';
ALTER TYPE public.investment_type ADD VALUE IF NOT EXISTS 'rental_income';
ALTER TYPE public.investment_type ADD VALUE IF NOT EXISTS 'not_decided';

ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'auto_response_sent';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'assigned_to_adviser';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'contact_attempted';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'property_information_sent';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'investment_pack_sent';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'kyc_pending';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'payment_submitted';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'payment_approved';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'lost';

ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'email_followup';
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'event_reminder';
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'document_request';
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'kyc_reminder';
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'adviser_meeting';

ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'event_registration';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'task';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'document';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'grade_change';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'automation';

-- One person remains one lead. Each new enquiry is retained in lead_interests.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS country_of_residence text,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS lead_source text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS lead_grade text NOT NULL DEFAULT 'C' CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
  ADD COLUMN IF NOT EXISTS recommended_grade text NOT NULL DEFAULT 'C' CHECK (recommended_grade IN ('A', 'B', 'C', 'D')),
  ADD COLUMN IF NOT EXISTS grade_score integer NOT NULL DEFAULT 40 CHECK (grade_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS grade_reason text,
  ADD COLUMN IF NOT EXISTS preferred_contact_method text,
  ADD COLUMN IF NOT EXISTS expected_timeline text,
  ADD COLUMN IF NOT EXISTS facebook_adset_id text,
  ADD COLUMN IF NOT EXISTS facebook_adset_name text,
  ADD COLUMN IF NOT EXISTS cost_per_lead numeric(12,2),
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_source text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

UPDATE public.leads
SET lead_source = 'facebook_lead_ads'
WHERE fb_lead_id IS NOT NULL AND lead_source = 'other';

UPDATE public.leads
SET lead_source = COALESCE(raw_payload->>'source', lead_source)
WHERE raw_payload ? 'source' AND lead_source = 'other';

CREATE INDEX IF NOT EXISTS leads_email_lookup_idx
  ON public.leads (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_phone_lookup_idx
  ON public.leads ((regexp_replace(phone, '[^0-9]', '', 'g'))) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_grade_idx ON public.leads(lead_grade);
CREATE INDEX IF NOT EXISTS leads_source_idx ON public.leads(lead_source);

ALTER TABLE public.follow_up_tasks
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

CREATE TABLE public.lead_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_reference text,
  property_id uuid,
  property_name text,
  investment_type investment_type,
  budget_min numeric(14,2),
  budget_max numeric(14,2),
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_interests_lead_idx ON public.lead_interests(lead_id, captured_at DESC);

CREATE TABLE public.crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL DEFAULT 'property_presentation',
  property_id uuid,
  property_name text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  venue text,
  meeting_url text,
  capacity integer,
  description text,
  owner_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_events_start_idx ON public.crm_events(starts_at);

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.crm_events(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered' CHECK (
    status IN ('registered', 'confirmed', 'reminder_sent', 'attended', 'did_not_attend', 'cancelled', 'follow_up_required')
  ),
  preferred_contact_method text,
  consent_given boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  registered_at timestamptz NOT NULL DEFAULT now(),
  checked_in_at timestamptz,
  notes text,
  UNIQUE(event_id, lead_id)
);
CREATE INDEX event_registrations_lead_idx ON public.event_registrations(lead_id);
CREATE INDEX event_registrations_event_idx ON public.event_registrations(event_id, status);

CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'follow_up',
  subject text NOT NULL,
  preview_text text,
  html_body text NOT NULL,
  text_body text,
  available_fields text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  trigger_source text,
  trigger_investment_type investment_type,
  stop_statuses text[] NOT NULL DEFAULT ARRAY['converted', 'not_interested', 'lost'],
  stop_on_reply boolean NOT NULL DEFAULT true,
  stop_on_unsubscribe boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  step_order integer NOT NULL,
  delay_minutes integer NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),
  action_type text NOT NULL DEFAULT 'send_email' CHECK (action_type IN ('send_email', 'create_task', 'notify_adviser')),
  task_title text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

CREATE TABLE public.automation_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 0,
  next_run_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'stopped')),
  stop_reason text,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, lead_id)
);
CREATE INDEX automation_enrollments_due_idx
  ON public.automation_enrollments(status, next_run_at) WHERE status = 'active';

CREATE TABLE public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  enrollment_id uuid REFERENCES public.automation_enrollments(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_message_id text,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced', 'skipped')
  ),
  error_message text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_deliveries_lead_idx ON public.email_deliveries(lead_id, created_at DESC);
CREATE INDEX email_deliveries_status_idx ON public.email_deliveries(status, created_at DESC);

CREATE TABLE public.crm_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured', 'connected', 'attention')),
  non_secret_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at timestamptz,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_settings (
  id text PRIMARY KEY DEFAULT 'default',
  response_sla_minutes integer NOT NULL DEFAULT 30 CHECK (response_sla_minutes BETWEEN 5 AND 1440),
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  default_country text NOT NULL DEFAULT 'Nigeria',
  consent_copy text NOT NULL,
  business_hours jsonb NOT NULL DEFAULT '{"monday":["08:00","17:00"],"tuesday":["08:00","17:00"],"wednesday":["08:00","17:00"],"thursday":["08:00","17:00"],"friday":["08:00","17:00"],"saturday":["10:00","14:00"]}'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_audit_logs_entity_idx ON public.crm_audit_logs(entity_type, entity_id, created_at DESC);

INSERT INTO public.crm_integrations(provider, display_name)
VALUES
  ('meta', 'Meta Lead Ads'),
  ('resend', 'Transactional email'),
  ('whatsapp', 'WhatsApp Business')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO public.crm_settings(id, consent_copy)
VALUES (
  'default',
  'I agree that Kay-Steph may use the information provided to contact me about properties, events and investment opportunities. I understand that I can unsubscribe at any time.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.email_templates(name, category, subject, preview_text, html_body, text_body, available_fields)
VALUES
  (
    'Property enquiry acknowledgement',
    'transactional',
    'We received your Kay-Steph property enquiry',
    'Your Kay-Steph adviser will contact you shortly.',
    '<p>Hello {{first_name}},</p><p>Thank you for your interest in {{property_name}}. A Kay-Steph property adviser will contact you shortly.</p><p><a href="{{property_details_link}}">View property details</a></p>',
    'Hello {{first_name}}, thank you for your interest in {{property_name}}. A Kay-Steph adviser will contact you shortly.',
    ARRAY['first_name','property_name','property_details_link','adviser_name','adviser_phone']
  ),
  (
    'Event registration confirmation',
    'transactional',
    'Your Kay-Steph registration is confirmed',
    'We have received your event registration.',
    '<p>Hello {{first_name}},</p><p>Your registration for {{event_name}} has been received.</p><p>{{event_date}} at {{event_venue}}</p>',
    'Hello {{first_name}}, your registration for {{event_name}} has been received. {{event_date}} at {{event_venue}}.',
    ARRAY['first_name','event_name','event_date','event_venue','registration_link']
  ),
  (
    'Investment enquiry acknowledgement',
    'transactional',
    'Your Kay-Steph investment enquiry',
    'We have received your investment enquiry.',
    '<p>Hello {{first_name}},</p><p>Thank you for your interest in {{investment_model}}. A Kay-Steph adviser will contact you to explain the opportunity, eligibility, documents and next steps.</p>',
    'Hello {{first_name}}, thank you for your interest in {{investment_model}}. A Kay-Steph adviser will contact you shortly.',
    ARRAY['first_name','investment_model','property_name','adviser_name','adviser_phone']
  )
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.automation_sequences(name, description, trigger_source, active)
VALUES
  ('Website property enquiry', 'Immediate acknowledgement followed by a 1, 3, 7 and 14 day adviser sequence.', 'website_property_enquiry', false),
  ('Meta property lead', 'Immediate response and adviser task for new Facebook Lead Ads prospects.', 'facebook_lead_ads', false),
  ('Event registration', 'Confirmation, reminder and post-event follow-up.', 'event_registration', false)
ON CONFLICT (name) DO NOTHING;

-- Automatically recommend a grade. Staff can keep the manual grade or adopt the recommendation.
CREATE OR REPLACE FUNCTION public.recommend_crm_lead_grade() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  score integer := 0;
BEGIN
  IF NEW.email IS NOT NULL OR NEW.phone IS NOT NULL THEN score := score + 15; END IF;
  IF NEW.budget_min IS NOT NULL OR NEW.budget_max IS NOT NULL THEN score := score + 25; END IF;
  IF NEW.property_name IS NOT NULL THEN score := score + 20; END IF;
  IF NEW.expected_timeline IN ('immediately', 'within_30_days', '1_3_months') THEN score := score + 15; END IF;
  IF NEW.status::text IN ('qualified', 'property_information_sent', 'investment_pack_sent', 'inspection_booked', 'inspection_completed') THEN score := score + 15; END IF;
  IF NEW.status::text IN ('kyc_pending', 'payment_pending', 'payment_submitted', 'payment_approved', 'converted') THEN score := score + 25; END IF;
  IF NEW.status::text IN ('not_interested', 'lost') OR NEW.do_not_contact THEN score := 0; END IF;

  NEW.grade_score := LEAST(score, 100);
  NEW.recommended_grade := CASE
    WHEN score >= 75 THEN 'A'
    WHEN score >= 55 THEN 'B'
    WHEN score >= 25 THEN 'C'
    ELSE 'D'
  END;
  NEW.grade_reason := CASE
    WHEN score >= 75 THEN 'Budget, property intent and buying activity indicate a hot lead.'
    WHEN score >= 55 THEN 'Clear interest and qualification signals are present.'
    WHEN score >= 25 THEN 'Interest is present but the lead needs further nurturing.'
    ELSE 'Key contact, budget or property details are incomplete.'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_lead_grade_trg ON public.leads;
CREATE TRIGGER crm_lead_grade_trg
  BEFORE INSERT OR UPDATE OF email, phone, budget_min, budget_max, property_name, expected_timeline, status, do_not_contact
  ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.recommend_crm_lead_grade();

CREATE OR REPLACE FUNCTION public.log_crm_lead_audit() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.crm_audit_logs(actor_id, entity_type, entity_id, action, before_data, after_data)
  VALUES (
    auth.uid(),
    'lead',
    COALESCE(NEW.id, OLD.id)::text,
    lower(TG_OP),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS crm_lead_audit_trg ON public.leads;
CREATE TRIGGER crm_lead_audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_crm_lead_audit();

CREATE TRIGGER crm_events_updated BEFORE UPDATE ON public.crm_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER email_templates_updated BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER automation_sequences_updated BEFORE UPDATE ON public.automation_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER automation_enrollments_updated BEFORE UPDATE ON public.automation_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER crm_integrations_updated BEFORE UPDATE ON public.crm_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.lead_interests,
  public.crm_events,
  public.event_registrations,
  public.email_templates,
  public.automation_sequences,
  public.automation_steps,
  public.automation_enrollments,
  public.email_deliveries,
  public.crm_integrations,
  public.crm_settings
TO authenticated;
GRANT SELECT ON public.crm_audit_logs TO authenticated;
GRANT ALL ON
  public.lead_interests,
  public.crm_events,
  public.event_registrations,
  public.email_templates,
  public.automation_sequences,
  public.automation_steps,
  public.automation_enrollments,
  public.email_deliveries,
  public.crm_integrations,
  public.crm_settings,
  public.crm_audit_logs
TO service_role;

ALTER TABLE public.lead_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_interests_admin_all ON public.lead_interests FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY lead_interests_agent ON public.lead_interests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));

CREATE POLICY crm_events_admin_all ON public.crm_events FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY crm_events_agent_read ON public.crm_events FOR SELECT TO authenticated
  USING (public.is_sales_agent(auth.uid()));

CREATE POLICY event_registrations_admin_all ON public.event_registrations FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY event_registrations_agent ON public.event_registrations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));

CREATE POLICY email_templates_admin_all ON public.email_templates FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY email_templates_agent_read ON public.email_templates FOR SELECT TO authenticated
  USING (active AND public.is_sales_agent(auth.uid()));

CREATE POLICY automation_sequences_admin_all ON public.automation_sequences FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY automation_sequences_agent_read ON public.automation_sequences FOR SELECT TO authenticated
  USING (active AND public.is_sales_agent(auth.uid()));

CREATE POLICY automation_steps_admin_all ON public.automation_steps FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY automation_steps_agent_read ON public.automation_steps FOR SELECT TO authenticated
  USING (public.is_sales_agent(auth.uid()));

CREATE POLICY automation_enrollments_admin_all ON public.automation_enrollments FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY automation_enrollments_agent_read ON public.automation_enrollments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));

CREATE POLICY email_deliveries_admin_all ON public.email_deliveries FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY email_deliveries_agent_read ON public.email_deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));

CREATE POLICY crm_integrations_admin_all ON public.crm_integrations FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY crm_settings_admin_all ON public.crm_settings FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY crm_settings_agent_read ON public.crm_settings FOR SELECT TO authenticated
  USING (public.is_sales_agent(auth.uid()));
CREATE POLICY crm_audit_logs_admin_read ON public.crm_audit_logs FOR SELECT TO authenticated
  USING (public.is_crm_admin(auth.uid()));

