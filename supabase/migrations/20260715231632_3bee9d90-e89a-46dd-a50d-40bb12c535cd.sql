
DO $$ BEGIN CREATE TYPE public.kyc_status AS ENUM ('pending','more_info','verified','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.property_status AS ENUM ('draft','under_review','approved','open','partially_funded','fully_funded','acquisition_in_progress','operating','exited','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.investment_status AS ENUM ('submitted','payment_pending','payment_received','under_review','approved','rejected','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.exit_status AS ENUM ('submitted','under_review','approved_for_listing','buyer_found','payment_pending','transfer_in_progress','completed','rejected','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.withdrawal_status AS ENUM ('pending','approved','rejected','paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payout_status AS ENUM ('pending','paid','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role);
$$;

CREATE TABLE IF NOT EXISTS public.spvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  jurisdiction text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.spvs TO anon, authenticated;
GRANT ALL ON public.spvs TO service_role;
ALTER TABLE public.spvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY spvs_read ON public.spvs FOR SELECT USING (true);
CREATE POLICY spvs_admin ON public.spvs FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.tokenized_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  description text,
  property_type text,
  images text[] NOT NULL DEFAULT '{}',
  initial_value numeric NOT NULL,
  current_value numeric NOT NULL,
  min_investors integer NOT NULL DEFAULT 1,
  max_investors integer,
  min_investment numeric NOT NULL DEFAULT 0,
  max_investment numeric,
  token_value numeric NOT NULL DEFAULT 1,
  funding_deadline date,
  expected_rental_yield numeric,
  expected_appreciation numeric,
  legal_title text,
  management_fee_pct numeric,
  exit_terms text,
  risk_disclosure text,
  spv_id uuid REFERENCES public.spvs(id) ON DELETE SET NULL,
  status public.property_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tokenized_properties TO anon, authenticated;
GRANT ALL ON public.tokenized_properties TO service_role;
ALTER TABLE public.tokenized_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY tp_read ON public.tokenized_properties FOR SELECT USING (true);
CREATE POLICY tp_admin ON public.tokenized_properties FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  category text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_documents TO anon, authenticated;
GRANT ALL ON public.property_documents TO service_role;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY pd_public_read ON public.property_documents FOR SELECT USING (is_public = true OR public.is_admin(auth.uid()));
CREATE POLICY pd_admin ON public.property_documents FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  country text,
  nationality text,
  dob date,
  id_type text,
  id_number text,
  id_doc_url text,
  photo_url text,
  next_of_kin jsonb NOT NULL DEFAULT '{}'::jsonb,
  bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investor_profiles TO authenticated;
GRANT ALL ON public.investor_profiles TO service_role;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ip_self ON public.investor_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ip_admin ON public.investor_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  proposed_amount numeric NOT NULL,
  approved_amount numeric,
  tokens_count integer,
  ownership_pct numeric,
  status public.investment_status NOT NULL DEFAULT 'submitted',
  payment_evidence_url text,
  payment_reference text,
  agreement_accepted_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv_self ON public.investments FOR ALL TO authenticated USING (investor_id = auth.uid()) WITH CHECK (investor_id = auth.uid());
CREATE POLICY inv_admin ON public.investments FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.investment_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  verification_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.investment_certificates TO anon, authenticated;
GRANT ALL ON public.investment_certificates TO service_role;
ALTER TABLE public.investment_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY ic_read ON public.investment_certificates FOR SELECT USING (true);
CREATE POLICY ic_admin ON public.investment_certificates FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.property_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  tokens_count integer NOT NULL DEFAULT 0,
  average_token_value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_tokens TO authenticated;
GRANT ALL ON public.property_tokens TO service_role;
ALTER TABLE public.property_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_self ON public.property_tokens FOR SELECT TO authenticated USING (investor_id = auth.uid());
CREATE POLICY pt_admin ON public.property_tokens FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.investor_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance numeric NOT NULL DEFAULT 0,
  total_returns numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.investor_wallets TO authenticated;
GRANT ALL ON public.investor_wallets TO service_role;
ALTER TABLE public.investor_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY iw_self ON public.investor_wallets FOR SELECT TO authenticated USING (investor_id = auth.uid());
CREATE POLICY iw_admin ON public.investor_wallets FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.tokenized_properties(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wt_self ON public.wallet_transactions FOR SELECT TO authenticated USING (investor_id = auth.uid());
CREATE POLICY wt_admin ON public.wallet_transactions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY wr_self ON public.withdrawal_requests FOR SELECT TO authenticated USING (investor_id = auth.uid());
CREATE POLICY wr_self_insert ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (investor_id = auth.uid());
CREATE POLICY wr_admin ON public.withdrawal_requests FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.exit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  tokens_to_sell integer NOT NULL,
  asking_price numeric NOT NULL,
  status public.exit_status NOT NULL DEFAULT 'submitted',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.exit_requests TO authenticated;
GRANT ALL ON public.exit_requests TO service_role;
ALTER TABLE public.exit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY er_self ON public.exit_requests FOR SELECT TO authenticated USING (investor_id = auth.uid());
CREATE POLICY er_self_insert ON public.exit_requests FOR INSERT TO authenticated WITH CHECK (investor_id = auth.uid());
CREATE POLICY er_admin ON public.exit_requests FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.rental_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  gross_income numeric NOT NULL,
  mgmt_fee numeric NOT NULL DEFAULT 0,
  maintenance numeric NOT NULL DEFAULT 0,
  taxes numeric NOT NULL DEFAULT 0,
  other_expenses numeric NOT NULL DEFAULT 0,
  net_distributable numeric NOT NULL,
  distribution_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rental_distributions TO authenticated;
GRANT ALL ON public.rental_distributions TO service_role;
ALTER TABLE public.rental_distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rd_admin ON public.rental_distributions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.rental_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.tokenized_properties(id) ON DELETE CASCADE,
  distribution_id uuid REFERENCES public.rental_distributions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  reference text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rental_payouts TO authenticated;
GRANT ALL ON public.rental_payouts TO service_role;
ALTER TABLE public.rental_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rp_self ON public.rental_payouts FOR SELECT TO authenticated USING (investor_id = auth.uid());
CREATE POLICY rp_admin ON public.rental_payouts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.investor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  link text,
  category text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.investor_notifications TO authenticated;
GRANT ALL ON public.investor_notifications TO service_role;
ALTER TABLE public.investor_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY in_self ON public.investor_notifications FOR SELECT TO authenticated USING (investor_id = auth.uid());
CREATE POLICY in_self_update ON public.investor_notifications FOR UPDATE TO authenticated USING (investor_id = auth.uid()) WITH CHECK (investor_id = auth.uid());
CREATE POLICY in_admin ON public.investor_notifications FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,10),
  member_number bigint GENERATED BY DEFAULT AS IDENTITY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  bio text,
  photo_url text,
  bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_profiles TO authenticated;
GRANT ALL ON public.affiliate_profiles TO service_role;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ap_self ON public.affiliate_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ap_admin ON public.affiliate_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  property_id uuid REFERENCES public.tokenized_properties(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.client_leads TO authenticated;
GRANT ALL ON public.client_leads TO service_role;
ALTER TABLE public.client_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY cl_owner ON public.client_leads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliate_profiles a WHERE a.id = client_leads.affiliate_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.affiliate_profiles a WHERE a.id = client_leads.affiliate_id AND a.user_id = auth.uid()));
CREATE POLICY cl_admin ON public.client_leads FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.client_leads(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_owner ON public.commissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliate_profiles a WHERE a.id = commissions.affiliate_id AND a.user_id = auth.uid()));
CREATE POLICY cm_admin ON public.commissions FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pr_owner ON public.payout_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliate_profiles a WHERE a.id = payout_requests.affiliate_id AND a.user_id = auth.uid()));
CREATE POLICY pr_owner_insert ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.affiliate_profiles a WHERE a.id = payout_requests.affiliate_id AND a.user_id = auth.uid()));
CREATE POLICY pr_admin ON public.payout_requests FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.training_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.training_videos TO anon, authenticated;
GRANT ALL ON public.training_videos TO service_role;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY tv_read ON public.training_videos FOR SELECT USING (true);
CREATE POLICY tv_admin ON public.training_videos FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE VIEW public.available_properties AS
  SELECT id, name, location, description, property_type, images,
         initial_value, current_value, min_investment, max_investment,
         token_value, expected_rental_yield, expected_appreciation,
         funding_deadline, status, created_at
  FROM public.tokenized_properties
  WHERE status IN ('open','partially_funded','approved');
GRANT SELECT ON public.available_properties TO anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'spvs','tokenized_properties','property_documents','investor_profiles','investments',
    'property_tokens','investor_wallets','withdrawal_requests','exit_requests','rental_payouts',
    'affiliate_profiles','client_leads','commissions','payout_requests','training_videos'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_property_funding(_property_ids uuid[])
RETURNS TABLE(property_id uuid, approved numeric, pending numeric, investors bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id AS property_id,
    COALESCE(SUM(i.approved_amount) FILTER (WHERE i.status = 'approved'), 0) AS approved,
    COALESCE(SUM(i.proposed_amount) FILTER (WHERE i.status IN ('submitted','payment_pending','payment_received','under_review')), 0) AS pending,
    COUNT(DISTINCT i.investor_id) FILTER (WHERE i.status = 'approved') AS investors
  FROM public.tokenized_properties p
  LEFT JOIN public.investments i ON i.property_id = p.id
  WHERE p.id = ANY(_property_ids)
  GROUP BY p.id;
$$;

CREATE OR REPLACE FUNCTION public.verify_investment_certificate(_token text)
RETURNS TABLE(
  certificate_number text, issued_at timestamptz, ownership_pct numeric,
  tokens_count integer, approved_amount numeric, property_name text, property_location text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.certificate_number, c.issued_at, i.ownership_pct, i.tokens_count,
         i.approved_amount, p.name AS property_name, p.location AS property_location
  FROM public.investment_certificates c
  JOIN public.investments i ON i.id = c.investment_id
  JOIN public.tokenized_properties p ON p.id = i.property_id
  WHERE c.verification_token = _token;
$$;

CREATE OR REPLACE FUNCTION public.submit_investor_kyc(_profile jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.investor_profiles(
    user_id, full_name, email, phone, address, country, nationality, dob,
    id_type, id_number, id_doc_url, photo_url, next_of_kin, bank_details, kyc_status
  ) VALUES (
    _uid,
    _profile->>'full_name', _profile->>'email', _profile->>'phone',
    _profile->>'address', _profile->>'country', _profile->>'nationality',
    NULLIF(_profile->>'dob','')::date,
    _profile->>'id_type', _profile->>'id_number', _profile->>'id_doc_url', _profile->>'photo_url',
    COALESCE(_profile->'next_of_kin', '{}'::jsonb),
    COALESCE(_profile->'bank_details', '{}'::jsonb),
    'pending'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone,
    address = EXCLUDED.address, country = EXCLUDED.country, nationality = EXCLUDED.nationality,
    dob = EXCLUDED.dob, id_type = EXCLUDED.id_type, id_number = EXCLUDED.id_number,
    id_doc_url = EXCLUDED.id_doc_url, photo_url = EXCLUDED.photo_url,
    next_of_kin = EXCLUDED.next_of_kin, bank_details = EXCLUDED.bank_details,
    kyc_status = 'pending', updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.submit_investment_payment_evidence(_investment_id uuid, _evidence_url text, _reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.investments
     SET payment_evidence_url = _evidence_url,
         payment_reference = _reference,
         status = 'payment_received', updated_at = now()
   WHERE id = _investment_id AND investor_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.request_property_token_exit(_property_id uuid, _tokens_to_sell integer, _asking_price numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.exit_requests(investor_id, property_id, tokens_to_sell, asking_price)
  VALUES (auth.uid(), _property_id, _tokens_to_sell, _asking_price)
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_investor_kyc(_profile_id uuid, _status public.kyc_status, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.investor_profiles SET kyc_status = _status, admin_notes = _notes, updated_at = now() WHERE id = _profile_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_approve_investment(_investment_id uuid, _approved_amount numeric, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.investments SET status = 'approved', approved_amount = _approved_amount, admin_notes = _notes, updated_at = now() WHERE id = _investment_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_reject_investment(_investment_id uuid, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.investments SET status = 'rejected', admin_notes = _notes, updated_at = now() WHERE id = _investment_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_record_property_valuation(
  _property_id uuid, _new_value numeric, _valuation_date date,
  _valuer text, _report_url text, _notes text
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT current_value INTO _old FROM public.tokenized_properties WHERE id = _property_id;
  UPDATE public.tokenized_properties SET current_value = _new_value, updated_at = now() WHERE id = _property_id;
  RETURN COALESCE(_new_value - _old, 0);
END $$;

CREATE OR REPLACE FUNCTION public.admin_record_rental_distribution(
  _property_id uuid, _gross_income numeric, _management_fee numeric,
  _maintenance numeric, _taxes numeric, _other_expenses numeric,
  _distribution_date date, _notes text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _net numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  _net := _gross_income - _management_fee - _maintenance - _taxes - _other_expenses;
  INSERT INTO public.rental_distributions(
    property_id, gross_income, mgmt_fee, maintenance, taxes, other_expenses,
    net_distributable, distribution_date, notes
  ) VALUES (_property_id, _gross_income, _management_fee, _maintenance, _taxes, _other_expenses, _net, _distribution_date, _notes)
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_mark_rental_payout_paid(_payout_id uuid, _reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.rental_payouts SET status = 'paid', reference = _reference, paid_at = now(), updated_at = now() WHERE id = _payout_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(_withdrawal_id uuid, _reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.withdrawal_requests SET status = 'paid', reference = _reference, updated_at = now() WHERE id = _withdrawal_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(_withdrawal_id uuid, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.withdrawal_requests SET status = 'rejected', admin_notes = _notes, updated_at = now() WHERE id = _withdrawal_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_exit_request(_exit_id uuid, _status public.exit_status, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.exit_requests SET status = _status, admin_notes = _notes, updated_at = now() WHERE id = _exit_id;
END $$;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
