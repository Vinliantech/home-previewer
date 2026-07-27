
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

CREATE SEQUENCE public.affiliate_member_seq START 1;

CREATE TABLE public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  member_number INTEGER NOT NULL DEFAULT nextval('public.affiliate_member_seq') UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  sort_code TEXT,
  commission_rate NUMERIC NOT NULL DEFAULT 5.0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_profiles TO authenticated;
GRANT ALL ON public.affiliate_profiles TO service_role;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates read own or admin" ON public.affiliate_profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "affiliates update own" ON public.affiliate_profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update any affiliate" ON public.affiliate_profiles
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins insert affiliates" ON public.affiliate_profiles
FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "read leaderboard rows" ON public.affiliate_profiles
FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_affiliate_profiles_updated
BEFORE UPDATE ON public.affiliate_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_affiliate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'account_type', '') <> 'affiliate' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.affiliate_profiles (user_id, affiliate_code, full_name, email, phone)
  VALUES (
    NEW.id,
    'KS-' || upper(substr(md5(NEW.id::text || clock_timestamp()::text), 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_affiliate
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'account_type', 'client') = 'affiliate' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.profiles (user_id, email, full_name, phone)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TABLE public.available_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name TEXT NOT NULL,
  location TEXT NOT NULL,
  plot_sizes TEXT[] NOT NULL DEFAULT '{}',
  price_range_min NUMERIC NOT NULL DEFAULT 0,
  price_range_max NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.available_properties TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.available_properties TO authenticated;
GRANT ALL ON public.available_properties TO service_role;
ALTER TABLE public.available_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active properties" ON public.available_properties
FOR SELECT USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "admins manage properties" ON public.available_properties
FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_available_properties_updated
BEFORE UPDATE ON public.available_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  client_full_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  property_of_interest TEXT,
  client_budget_min NUMERIC,
  client_budget_max NUMERIC,
  client_requirements TEXT,
  contact_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.client_leads TO authenticated;
GRANT ALL ON public.client_leads TO service_role;
ALTER TABLE public.client_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliates read own leads" ON public.client_leads
FOR SELECT TO authenticated USING (
  affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "affiliates insert own leads" ON public.client_leads
FOR INSERT TO authenticated WITH CHECK (
  affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "admins update leads" ON public.client_leads
FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_client_leads_updated
BEFORE UPDATE ON public.client_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  client_lead_id UUID NOT NULL REFERENCES public.client_leads(id) ON DELETE CASCADE,
  sale_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  status public.commission_status NOT NULL DEFAULT 'pending',
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliates read own commissions" ON public.commissions
FOR SELECT TO authenticated USING (
  affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "admins manage commissions" ON public.commissions
FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_commissions_updated
BEFORE UPDATE ON public.commissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
  requested_amount NUMERIC NOT NULL,
  bank_details JSONB,
  status public.payout_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliates read own payouts" ON public.payout_requests
FOR SELECT TO authenticated USING (
  affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "affiliates request payouts" ON public.payout_requests
FOR INSERT TO authenticated WITH CHECK (
  affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "admins manage payouts" ON public.payout_requests
FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_payouts_updated
BEFORE UPDATE ON public.payout_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.training_videos TO authenticated;
GRANT ALL ON public.training_videos TO service_role;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published or admin" ON public.training_videos
FOR SELECT TO authenticated USING (is_published OR public.is_admin(auth.uid()));
CREATE POLICY "admins manage videos" ON public.training_videos
FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_training_videos_updated
BEFORE UPDATE ON public.training_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_admin_summary()
RETURNS TABLE (
  total_affiliates BIGINT,
  pending_affiliates BIGINT,
  active_affiliates BIGINT,
  total_leads BIGINT,
  pending_commissions_count BIGINT,
  pending_commissions_amount NUMERIC,
  pending_payouts_count BIGINT,
  pending_payouts_amount NUMERIC
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM affiliate_profiles),
    (SELECT count(*) FROM affiliate_profiles WHERE status = 'pending'),
    (SELECT count(*) FROM affiliate_profiles WHERE status = 'active'),
    (SELECT count(*) FROM client_leads),
    (SELECT count(*) FROM commissions WHERE status = 'pending'),
    (SELECT COALESCE(sum(commission_amount), 0) FROM commissions WHERE status = 'pending'),
    (SELECT count(*) FROM payout_requests WHERE status = 'pending'),
    (SELECT COALESCE(sum(requested_amount), 0) FROM payout_requests WHERE status = 'pending')
$$;

CREATE OR REPLACE FUNCTION public.get_affiliate_earnings(_affiliate_id UUID)
RETURNS TABLE (
  total_earned NUMERIC,
  total_paid NUMERIC,
  pending_payout NUMERIC,
  total_commissions BIGINT,
  pending_commissions BIGINT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE(sum(commission_amount) FILTER (WHERE status IN ('approved','paid')), 0),
    COALESCE(sum(commission_amount) FILTER (WHERE status = 'paid'), 0),
    COALESCE(sum(commission_amount) FILTER (WHERE status = 'approved'), 0),
    count(*),
    count(*) FILTER (WHERE status = 'pending')
  FROM commissions
  WHERE affiliate_id = _affiliate_id
$$;

CREATE OR REPLACE FUNCTION public.get_affiliate_leaderboard()
RETURNS TABLE (
  affiliate_id UUID,
  member_number INTEGER,
  full_name TEXT,
  avatar_url TEXT,
  successful_sales BIGINT,
  total_sales_amount NUMERIC,
  total_earned NUMERIC,
  rank BIGINT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH stats AS (
    SELECT
      ap.id AS affiliate_id,
      ap.member_number,
      ap.full_name,
      ap.avatar_url,
      COALESCE(count(c.id) FILTER (WHERE c.status IN ('approved','paid')), 0) AS successful_sales,
      COALESCE(sum(c.sale_amount) FILTER (WHERE c.status IN ('approved','paid')), 0) AS total_sales_amount,
      COALESCE(sum(c.commission_amount) FILTER (WHERE c.status IN ('approved','paid')), 0) AS total_earned
    FROM affiliate_profiles ap
    LEFT JOIN commissions c ON c.affiliate_id = ap.id
    GROUP BY ap.id
  )
  SELECT
    affiliate_id, member_number, full_name, avatar_url,
    successful_sales, total_sales_amount, total_earned,
    RANK() OVER (ORDER BY successful_sales DESC, total_sales_amount DESC) AS rank
  FROM stats
$$;
