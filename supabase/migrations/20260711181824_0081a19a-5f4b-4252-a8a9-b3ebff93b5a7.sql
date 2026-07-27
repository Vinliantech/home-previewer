
-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.investment_type AS ENUM ('full_purchase','group_purchase','fractional','tokenized'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.lead_status AS ENUM (
  'new','contacted','interested','qualified','brochure_sent',
  'inspection_booked','inspection_completed','payment_discussion',
  'payment_received','converted','not_interested','follow_up_later'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.opportunity_stage AS ENUM (
  'qualification','proposal','negotiation','closing','won','lost'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.task_type AS ENUM (
  'call','brochure','payment_plan','inspection','group_plan',
  'tokenized_explain','allocation','payment_followup','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.activity_type AS ENUM (
  'call','sms','email','note','brochure_sent','inspection_booked',
  'inspection_completed','status_change','assignment','payment_note',
  'fb_message_in','fb_message_out','system'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.is_crm_admin(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('admin','super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_sales_agent(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = 'sales_agent'
  )
$$;

-- ============ SALES AGENTS ============
CREATE TABLE public.sales_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  avatar_url text,
  assigned_locations text[] NOT NULL DEFAULT '{}',
  assigned_investment_types investment_type[] NOT NULL DEFAULT '{}',
  monthly_target_naira numeric(14,2) DEFAULT 0,
  round_robin_cursor int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_agents TO authenticated;
GRANT ALL ON public.sales_agents TO service_role;
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY sa_admin_all ON public.sales_agents FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY sa_own_read ON public.sales_agents FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY sa_own_update ON public.sales_agents FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER sales_agents_updated BEFORE UPDATE ON public.sales_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FB LEAD SOURCES ============
CREATE TABLE public.fb_lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  page_name text NOT NULL,
  access_token text NOT NULL,
  ad_account_id text,
  webhook_verify_token text NOT NULL,
  connected_by uuid REFERENCES auth.users(id),
  active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_lead_sources TO authenticated;
GRANT ALL ON public.fb_lead_sources TO service_role;
ALTER TABLE public.fb_lead_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY fbs_admin_all ON public.fb_lead_sources FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE TRIGGER fb_lead_sources_updated BEFORE UPDATE ON public.fb_lead_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FB CAMPAIGNS ============
CREATE TABLE public.fb_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.fb_lead_sources(id) ON DELETE CASCADE,
  campaign_id text NOT NULL UNIQUE,
  campaign_name text NOT NULL,
  objective text,
  status text,
  daily_budget numeric(12,2),
  spend numeric(14,2) DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_campaigns TO authenticated;
GRANT ALL ON public.fb_campaigns TO service_role;
ALTER TABLE public.fb_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY fbc_admin_all ON public.fb_campaigns FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY fbc_agent_read ON public.fb_campaigns FOR SELECT TO authenticated
  USING (public.is_sales_agent(auth.uid()));
CREATE TRIGGER fb_campaigns_updated BEFORE UPDATE ON public.fb_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fb_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text REFERENCES public.fb_campaigns(campaign_id) ON DELETE CASCADE,
  ad_id text NOT NULL UNIQUE,
  ad_name text NOT NULL,
  form_id text,
  form_name text,
  spend numeric(14,2) DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_ads TO authenticated;
GRANT ALL ON public.fb_ads TO service_role;
ALTER TABLE public.fb_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY fbad_admin_all ON public.fb_ads FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY fbad_agent_read ON public.fb_ads FOR SELECT TO authenticated
  USING (public.is_sales_agent(auth.uid()));
CREATE TRIGGER fb_ads_updated BEFORE UPDATE ON public.fb_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LEADS ============
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  fb_profile_url text,
  fb_lead_id text UNIQUE,
  page_id text,
  campaign_id text,
  campaign_name text,
  ad_id text,
  ad_name text,
  form_id text,
  form_name text,
  property_id uuid,
  property_name text,
  preferred_location text,
  budget_min numeric(14,2),
  budget_max numeric(14,2),
  investment_type investment_type,
  status lead_status NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES auth.users(id),
  assigned_at timestamptz,
  captured_at timestamptz NOT NULL DEFAULT now(),
  last_contacted_at timestamptz,
  notes text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_status_idx ON public.leads(status);
CREATE INDEX leads_assigned_idx ON public.leads(assigned_to);
CREATE INDEX leads_captured_idx ON public.leads(captured_at DESC);
CREATE INDEX leads_campaign_idx ON public.leads(campaign_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_admin_all ON public.leads FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY leads_agent_read ON public.leads FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
CREATE POLICY leads_agent_update ON public.leads FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid()) WITH CHECK (assigned_to = auth.uid());
CREATE TRIGGER leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LEAD STATUS HISTORY ============
CREATE TABLE public.lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status lead_status,
  to_status lead_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lsh_lead_idx ON public.lead_status_history(lead_id, created_at DESC);
GRANT SELECT, INSERT ON public.lead_status_history TO authenticated;
GRANT ALL ON public.lead_status_history TO service_role;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY lsh_admin_all ON public.lead_status_history FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY lsh_agent_read ON public.lead_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));
CREATE POLICY lsh_agent_insert ON public.lead_status_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));

-- ============ LEAD ACTIVITIES ============
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  body text,
  meta jsonb,
  actor_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX la_lead_idx ON public.lead_activities(lead_id, created_at DESC);
GRANT SELECT, INSERT ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY la_admin_all ON public.lead_activities FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY la_agent_read ON public.lead_activities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));
CREATE POLICY la_agent_insert ON public.lead_activities FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.assigned_to = auth.uid()));

-- ============ FOLLOW-UP TASKS ============
CREATE TABLE public.follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  task_type task_type NOT NULL DEFAULT 'call',
  due_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  assigned_to uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  snoozed_until timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fut_assigned_idx ON public.follow_up_tasks(assigned_to, due_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_tasks TO authenticated;
GRANT ALL ON public.follow_up_tasks TO service_role;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY fut_admin_all ON public.follow_up_tasks FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY fut_agent_read ON public.follow_up_tasks FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
CREATE POLICY fut_agent_write ON public.follow_up_tasks FOR ALL TO authenticated
  USING (assigned_to = auth.uid()) WITH CHECK (assigned_to = auth.uid());
CREATE TRIGGER fut_updated BEFORE UPDATE ON public.follow_up_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ OPPORTUNITIES ============
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  property_id uuid,
  property_name text,
  unit_type text,
  budget numeric(14,2),
  investment_amount numeric(14,2),
  purchase_model investment_type NOT NULL DEFAULT 'full_purchase',
  expected_close_at date,
  assigned_to uuid REFERENCES auth.users(id),
  probability int NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  deal_value_naira numeric(14,2) NOT NULL DEFAULT 0,
  stage opportunity_stage NOT NULL DEFAULT 'qualification',
  won_at timestamptz,
  lost_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opp_assigned_idx ON public.opportunities(assigned_to);
CREATE INDEX opp_stage_idx ON public.opportunities(stage);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY opp_admin_all ON public.opportunities FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY opp_agent_read ON public.opportunities FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
CREATE POLICY opp_agent_write ON public.opportunities FOR ALL TO authenticated
  USING (assigned_to = auth.uid()) WITH CHECK (assigned_to = auth.uid());
CREATE TRIGGER opp_updated BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ASSIGNMENT RULES ============
CREATE TABLE public.assignment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  priority int NOT NULL DEFAULT 100,
  match_location text,
  match_investment_type investment_type,
  match_budget_min numeric(14,2),
  match_budget_max numeric(14,2),
  match_campaign_id text,
  assign_agent_id uuid REFERENCES auth.users(id),
  use_round_robin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_rules TO authenticated;
GRANT ALL ON public.assignment_rules TO service_role;
ALTER TABLE public.assignment_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY ar_admin_all ON public.assignment_rules FOR ALL TO authenticated
  USING (public.is_crm_admin(auth.uid())) WITH CHECK (public.is_crm_admin(auth.uid()));
CREATE POLICY ar_agent_read ON public.assignment_rules FOR SELECT TO authenticated
  USING (public.is_sales_agent(auth.uid()));
CREATE TRIGGER ar_updated BEFORE UPDATE ON public.assignment_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.crm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crmn_user_idx ON public.crm_notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notifications TO authenticated;
GRANT ALL ON public.crm_notifications TO service_role;
ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY crmn_own ON public.crm_notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_up_tasks;

-- ============ Auto status-history trigger ============
CREATE OR REPLACE FUNCTION public.log_lead_status_change() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_status_history (lead_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    INSERT INTO public.lead_activities (lead_id, activity_type, body, actor_id)
    VALUES (NEW.id, 'status_change', OLD.status || ' -> ' || NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER leads_status_history_trg AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();
