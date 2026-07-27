
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='app_role' AND e.enumlabel='property_manager') THEN ALTER TYPE public.app_role ADD VALUE 'property_manager'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='app_role' AND e.enumlabel='finance_officer') THEN ALTER TYPE public.app_role ADD VALUE 'finance_officer'; END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='app_role' AND e.enumlabel='compliance_officer') THEN ALTER TYPE public.app_role ADD VALUE 'compliance_officer'; END IF;
END $$;

CREATE TYPE public.kyc_status AS ENUM ('not_submitted','pending','verified','rejected','more_info');
CREATE TYPE public.property_status AS ENUM ('open','partially_funded','fully_funded','under_review','approved','acquisition_in_progress','acquired','income_generating','available_for_resale','sold','closed');
CREATE TYPE public.investment_status AS ENUM ('draft','submitted','payment_pending','payment_received','under_review','approved','rejected','refunded','cancelled');
CREATE TYPE public.token_status AS ENUM ('reserved','pending_payment','pending_approval','active','locked','listed_for_resale','transferred','redeemed','cancelled');
CREATE TYPE public.exit_status AS ENUM ('submitted','under_review','approved_for_listing','buyer_found','payment_pending','transfer_in_progress','completed','rejected','cancelled');
CREATE TYPE public.wallet_txn_type AS ENUM ('deposit','investment_payment','rental_income','sale_proceeds','withdrawal','refund','adjustment');

-- investor_profiles
CREATE TABLE public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, email TEXT, phone TEXT, address TEXT, country TEXT, nationality TEXT,
  dob DATE, id_type TEXT, id_number TEXT, id_doc_url TEXT, photo_url TEXT,
  next_of_kin JSONB DEFAULT '{}'::jsonb, bank_details JSONB DEFAULT '{}'::jsonb,
  kyc_status public.kyc_status NOT NULL DEFAULT 'not_submitted',
  kyc_notes TEXT, kyc_reviewed_by UUID REFERENCES auth.users(id), kyc_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investor_profiles TO authenticated;
GRANT ALL ON public.investor_profiles TO service_role;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;

-- spvs
CREATE TABLE public.spvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, registration_number TEXT, incorporation_date DATE, docs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.spvs TO anon, authenticated;
GRANT ALL ON public.spvs TO service_role;
ALTER TABLE public.spvs ENABLE ROW LEVEL SECURITY;

-- tokenized_properties
CREATE TABLE public.tokenized_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, location TEXT NOT NULL, description TEXT, property_type TEXT,
  images TEXT[] DEFAULT '{}',
  initial_value NUMERIC(18,2) NOT NULL, current_value NUMERIC(18,2) NOT NULL,
  min_investors INT NOT NULL DEFAULT 2, max_investors INT,
  min_investment NUMERIC(18,2) NOT NULL DEFAULT 10000, max_investment NUMERIC(18,2),
  token_value NUMERIC(18,2) NOT NULL DEFAULT 10000,
  funding_deadline DATE, expected_rental_yield NUMERIC(6,2), expected_appreciation NUMERIC(6,2),
  status public.property_status NOT NULL DEFAULT 'open',
  legal_title TEXT, management_fee_pct NUMERIC(6,2) DEFAULT 0, service_charge NUMERIC(18,2) DEFAULT 0,
  exit_terms TEXT, risk_disclosure TEXT,
  spv_id UUID REFERENCES public.spvs(id), created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tokenized_properties TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tokenized_properties TO authenticated;
GRANT ALL ON public.tokenized_properties TO service_role;
ALTER TABLE public.tokenized_properties ENABLE ROW LEVEL SECURITY;

-- investments (created before property_documents/valuations so their policies can reference it)
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  proposed_amount NUMERIC(18,2) NOT NULL,
  approved_amount NUMERIC(18,2),
  ownership_pct NUMERIC(8,4), tokens_count INT,
  status public.investment_status NOT NULL DEFAULT 'submitted',
  agreement_accepted_at TIMESTAMPTZ, payment_evidence_url TEXT, payment_reference TEXT,
  admin_notes TEXT, approved_by UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ,
  certificate_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- property_documents
CREATE TABLE public.property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, title TEXT, file_url TEXT NOT NULL, is_public BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_documents TO authenticated;
GRANT ALL ON public.property_documents TO service_role;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- property_tokens
CREATE TABLE public.property_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_count INT NOT NULL, unit_value NUMERIC(18,2) NOT NULL,
  status public.token_status NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_tokens TO authenticated;
GRANT ALL ON public.property_tokens TO service_role;
ALTER TABLE public.property_tokens ENABLE ROW LEVEL SECURITY;

-- property_valuations
CREATE TABLE public.property_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  previous_value NUMERIC(18,2) NOT NULL, new_value NUMERIC(18,2) NOT NULL,
  change_pct NUMERIC(8,4), valuation_date DATE NOT NULL, report_url TEXT, valuer TEXT,
  approved_by UUID REFERENCES auth.users(id), notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_valuations TO authenticated;
GRANT ALL ON public.property_valuations TO service_role;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;

-- rental_distributions
CREATE TABLE public.rental_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  gross_income NUMERIC(18,2) NOT NULL,
  mgmt_fee NUMERIC(18,2) DEFAULT 0, maintenance NUMERIC(18,2) DEFAULT 0,
  taxes NUMERIC(18,2) DEFAULT 0, other_expenses NUMERIC(18,2) DEFAULT 0,
  net_distributable NUMERIC(18,2) NOT NULL, distribution_date DATE NOT NULL, notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rental_distributions TO authenticated;
GRANT ALL ON public.rental_distributions TO service_role;
ALTER TABLE public.rental_distributions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rental_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES public.rental_distributions(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  ownership_pct_snapshot NUMERIC(8,4) NOT NULL, amount NUMERIC(18,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', paid_at TIMESTAMPTZ, reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rental_payouts TO authenticated;
GRANT ALL ON public.rental_payouts TO service_role;
ALTER TABLE public.rental_payouts ENABLE ROW LEVEL SECURITY;

-- wallets
CREATE TABLE public.investor_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  pending_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_deposits NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_returns NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.investor_wallets TO authenticated;
GRANT ALL ON public.investor_wallets TO service_role;
ALTER TABLE public.investor_wallets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.wallet_txn_type NOT NULL, amount NUMERIC(18,2) NOT NULL,
  property_id UUID REFERENCES public.tokenized_properties(id),
  investment_id UUID REFERENCES public.investments(id),
  reference TEXT, status TEXT NOT NULL DEFAULT 'completed',
  method TEXT, evidence_url TEXT, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL, bank_details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id), approved_at TIMESTAMPTZ, reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.exit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  tokens_to_sell INT NOT NULL, asking_price NUMERIC(18,2) NOT NULL,
  status public.exit_status NOT NULL DEFAULT 'submitted', admin_notes TEXT,
  buyer_investment_id UUID REFERENCES public.investments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.exit_requests TO authenticated;
GRANT ALL ON public.exit_requests TO service_role;
ALTER TABLE public.exit_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.investment_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL UNIQUE REFERENCES public.investments(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE, qr_token TEXT NOT NULL UNIQUE,
  pdf_url TEXT, issued_at TIMESTAMPTZ NOT NULL DEFAULT now(), issued_by UUID REFERENCES auth.users(id)
);
GRANT SELECT ON public.investment_certificates TO anon, authenticated;
GRANT ALL ON public.investment_certificates TO service_role;
ALTER TABLE public.investment_certificates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.investor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, body TEXT, link TEXT,
  read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.investor_notifications TO authenticated;
GRANT ALL ON public.investor_notifications TO service_role;
ALTER TABLE public.investor_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID,
  previous_value JSONB, new_value JSONB, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies (all tables exist now) ------------------------------------------
CREATE POLICY "own investor profile" ON public.investor_profiles FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "admins read ip" ON public.investor_profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update ip" ON public.investor_profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public read spvs" ON public.spvs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage spvs" ON public.spvs FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public read properties" ON public.tokenized_properties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage properties" ON public.tokenized_properties FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own inv read" ON public.investments FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "own inv insert" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid()=investor_id);
CREATE POLICY "own inv update draft" ON public.investments FOR UPDATE TO authenticated
  USING (auth.uid()=investor_id AND status IN ('draft','submitted','payment_pending')) WITH CHECK (auth.uid()=investor_id);
CREATE POLICY "admins read inv" ON public.investments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update inv" ON public.investments FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public read public docs" ON public.property_documents FOR SELECT TO anon, authenticated USING (is_public=true);
CREATE POLICY "investors read own docs" ON public.property_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investments i WHERE i.property_id=property_documents.property_id AND i.investor_id=auth.uid()));
CREATE POLICY "admins manage docs" ON public.property_documents FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own tokens" ON public.property_tokens FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "admins read tokens" ON public.property_tokens FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "investors read valuations" ON public.property_valuations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investments i WHERE i.property_id=property_valuations.property_id AND i.investor_id=auth.uid()));
CREATE POLICY "admins read val" ON public.property_valuations FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins insert val" ON public.property_valuations FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "investors read dist" ON public.rental_distributions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.investments i WHERE i.property_id=rental_distributions.property_id AND i.investor_id=auth.uid()));
CREATE POLICY "admins manage dist" ON public.rental_distributions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own payouts" ON public.rental_payouts FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "admins read pay" ON public.rental_payouts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update pay" ON public.rental_payouts FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own wallet" ON public.investor_wallets FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "admins read wal" ON public.investor_wallets FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "own txns" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "admins read txns" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "own wd" ON public.withdrawal_requests FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "create own wd" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid()=investor_id);
CREATE POLICY "admins manage wd" ON public.withdrawal_requests FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own exit" ON public.exit_requests FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "create own exit" ON public.exit_requests FOR INSERT TO authenticated WITH CHECK (auth.uid()=investor_id);
CREATE POLICY "admins manage exit" ON public.exit_requests FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "public verify cert" ON public.investment_certificates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage certs" ON public.investment_certificates FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "own notif read" ON public.investor_notifications FOR SELECT TO authenticated USING (auth.uid()=investor_id);
CREATE POLICY "own notif update" ON public.investor_notifications FOR UPDATE TO authenticated USING (auth.uid()=investor_id) WITH CHECK (auth.uid()=investor_id);

CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Helper functions ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_property_funding(_property_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_initial NUMERIC; v_approved NUMERIC; v_count INT; v_min INT; v_status public.property_status;
BEGIN
  SELECT initial_value, min_investors, status INTO v_initial, v_min, v_status FROM public.tokenized_properties WHERE id=_property_id;
  SELECT COALESCE(SUM(approved_amount),0), COUNT(*) INTO v_approved, v_count FROM public.investments WHERE property_id=_property_id AND status='approved';
  IF v_status IN ('sold','closed','acquired','income_generating','available_for_resale') THEN RETURN; END IF;
  IF v_approved >= v_initial AND v_count >= v_min THEN
    UPDATE public.tokenized_properties SET status='fully_funded', updated_at=now() WHERE id=_property_id;
  ELSIF v_approved > 0 THEN
    UPDATE public.tokenized_properties SET status='partially_funded', updated_at=now() WHERE id=_property_id;
  ELSE
    UPDATE public.tokenized_properties SET status='open', updated_at=now() WHERE id=_property_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN 'KS-CERT-' || to_char(now(),'YYYYMM') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
END $$;

CREATE OR REPLACE FUNCTION public.on_investment_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_prop RECORD; v_sum NUMERIC;
BEGIN
  IF NEW.status='approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT * INTO v_prop FROM public.tokenized_properties WHERE id=NEW.property_id FOR UPDATE;
    IF v_prop IS NULL THEN RAISE EXCEPTION 'Property not found'; END IF;
    IF NEW.approved_amount IS NULL OR NEW.approved_amount<=0 THEN RAISE EXCEPTION 'Approved amount must be > 0'; END IF;
    SELECT COALESCE(SUM(approved_amount),0) INTO v_sum FROM public.investments WHERE property_id=NEW.property_id AND status='approved' AND id<>NEW.id;
    IF v_sum + NEW.approved_amount > v_prop.initial_value THEN
      RAISE EXCEPTION 'Approved contributions (%) would exceed property value (%)', v_sum+NEW.approved_amount, v_prop.initial_value;
    END IF;
    NEW.ownership_pct := ROUND((NEW.approved_amount / v_prop.initial_value) * 100, 4);
    NEW.tokens_count := FLOOR(NEW.approved_amount / v_prop.token_value);
    IF NEW.certificate_number IS NULL THEN NEW.certificate_number := public.generate_certificate_number(); END IF;
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_on_investment_approved BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.on_investment_approved();

CREATE OR REPLACE FUNCTION public.after_investment_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.property_tokens (investment_id, property_id, investor_id, tokens_count, unit_value, status)
    SELECT NEW.id, NEW.property_id, NEW.investor_id, NEW.tokens_count, tp.token_value, 'active'
    FROM public.tokenized_properties tp WHERE tp.id=NEW.property_id;
    INSERT INTO public.wallet_transactions (investor_id, type, amount, property_id, investment_id, reference, status, notes)
    VALUES (NEW.investor_id, 'investment_payment', NEW.approved_amount, NEW.property_id, NEW.id, NEW.payment_reference, 'completed', 'Investment approved');
    INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
    VALUES (NEW.investor_id, 'investment_approved', 'Investment approved', 'Your contribution has been approved. Your ownership tokens are now active.', '/portfolio/properties');
    PERFORM public.recalc_property_funding(NEW.property_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_after_investment_approved AFTER UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.after_investment_approved();

CREATE OR REPLACE FUNCTION public.ensure_investor_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.investor_wallets (investor_id) VALUES (NEW.investor_id) ON CONFLICT (investor_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_ensure_wallet BEFORE INSERT ON public.investments FOR EACH ROW EXECUTE FUNCTION public.ensure_investor_wallet();

CREATE TRIGGER t_ip_upd BEFORE UPDATE ON public.investor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_spv_upd BEFORE UPDATE ON public.spvs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_tp_upd BEFORE UPDATE ON public.tokenized_properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_inv_upd BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_tk_upd BEFORE UPDATE ON public.property_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_wal_upd BEFORE UPDATE ON public.investor_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_wd_upd BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_ex_upd BEFORE UPDATE ON public.exit_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed
INSERT INTO public.spvs (id, name, registration_number, incorporation_date)
VALUES ('11111111-1111-1111-1111-111111111111', 'KaySteph Property Holdings SPV I', 'RC-2024-KSPH', '2024-01-15');

INSERT INTO public.tokenized_properties (id, name, location, description, property_type, images, initial_value, current_value, min_investors, max_investors, min_investment, token_value, funding_deadline, expected_rental_yield, expected_appreciation, status, legal_title, management_fee_pct, exit_terms, risk_disclosure, spv_id) VALUES
('20000000-0000-4000-8000-000000000001','Dream House in Guzape','Guzape, Abuja','Five completed luxury terraces on Kenneth Minimah Crescent, Guzape.','Luxury Terrace',ARRAY['/properties/dream-house-guzape.jpg'],500000000,500000000,1,50,10000000,1000000,(now()+interval '180 days')::date,0,18,'open','Verified title pack available from Kay-Steph',0,'Terms are supplied for the selected ownership route before commitment.','Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.',NULL),
('20000000-0000-4000-8000-000000000002','Ruby''s Apartment','Jahi, Abuja','Modern two- and three-bedroom serviced apartments in Jahi.','Serviced Apartment',ARRAY['/properties/rubys-apartment-jahi.jpg'],140000000,140000000,4,140,1000000,1000000,(now()+interval '180 days')::date,0,15,'open','Verified title pack available from Kay-Steph',0,'Terms are supplied for the selected ownership route before commitment.','Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.',NULL),
('20000000-0000-4000-8000-000000000003','Lillycrest Luxury Terrace','Life Camp, Abuja','Four-bedroom luxury terraces with boys'' quarters in Life Camp.','Luxury Terrace',ARRAY['/properties/lillycrest-terrace-lifecamp.jpg'],250000000,250000000,4,50,5000000,1000000,(now()+interval '180 days')::date,0,16,'open','Verified title pack available from Kay-Steph',0,'Terms are supplied for the selected ownership route before commitment.','Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.',NULL),
('20000000-0000-4000-8000-000000000004','Lillycrest Residence','Karsana, Abuja','Detached, semi-detached, terrace and apartment homes in Karsana.','Mixed Residential Development',ARRAY['/properties/lillycrest-residence-karsana.jpg'],90000000,90000000,4,90,5000000,1000000,(now()+interval '180 days')::date,0,17,'open','Verified title pack available from Kay-Steph',0,'Terms are supplied for the selected ownership route before commitment.','Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.',NULL),
('20000000-0000-4000-8000-000000000005','Estate Plots — Phase II','Behind Abacha Barracks, Abuja','Surveyed estate plots from 350 to 1,000 square metres.','Estate Land',ARRAY['/properties/estate-plots-phase-ii.jpg'],22750000,22750000,2,65,1000000,1000000,(now()+interval '180 days')::date,0,22,'open','Verified title pack available from Kay-Steph',0,'Terms are supplied for the selected ownership route before commitment.','Land investment has no rental yield and returns depend on appreciation. Review the project disclosure before committing.',NULL),
('20000000-0000-4000-8000-000000000006','Daverek Luxury Apartments','Katampe, Abuja','Three-bedroom luxury apartments in Katampe.','Luxury Apartment',ARRAY['/properties/daverek-luxury-apartments-katampe.jpg'],130000000,130000000,1,1,130000000,1000000,(now()+interval '180 days')::date,0,15,'under_review','Verified title pack available from Kay-Steph',0,'Full-purchase terms are supplied before commitment.','Property purchase carries market and construction risks. Review the project disclosure before committing.',NULL)
ON CONFLICT (id) DO NOTHING;
