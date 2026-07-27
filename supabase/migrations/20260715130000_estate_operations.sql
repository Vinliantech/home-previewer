-- ===========================================================================
-- Estate operations admin (plots, estates, allocations, applications,
-- reservations, receipts, payment requirements, company accounts, documents,
-- support tickets). Forward-only migration.
--
-- These tables back the unified super-admin's estate/land-sales modules.
-- All are admin-managed; where a row has an owning user_id, that user may
-- read (and, for some, insert) their own rows.
-- ===========================================================================

-- ---------- Extend roles with 'manager' (used by User Role Management) ----------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- ---------- Extend profiles with client-management columns ----------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verification_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_document_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_drive_folder_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nok_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nok_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nok_relationship text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nok_address text;

-- ---------- Helper: admin-only RLS shorthand applied per table below ----------

-- =========================== ESTATES ===========================
CREATE TABLE IF NOT EXISTS public.estates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  total_land_size text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================== PLOTS ===========================
CREATE TABLE IF NOT EXISTS public.plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_number text NOT NULL,
  block_number text,
  location text NOT NULL,
  size_sqm numeric(12,2) NOT NULL DEFAULT 0,
  property_type text NOT NULL DEFAULT 'residential',
  price numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  estate_id uuid REFERENCES public.estates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plots_estate_idx ON public.plots(estate_id);
CREATE INDEX IF NOT EXISTS plots_status_idx ON public.plots(status);

-- =========================== PLOT ALLOCATIONS ===========================
CREATE TABLE IF NOT EXISTS public.plot_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  allocation_type text NOT NULL DEFAULT 'new',
  approval_status text NOT NULL DEFAULT 'approved',
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  allocation_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plot_allocations_plot_idx ON public.plot_allocations(plot_id);
CREATE INDEX IF NOT EXISTS plot_allocations_user_idx ON public.plot_allocations(user_id);

-- =========================== CLIENT APPLICATIONS ===========================
CREATE TABLE IF NOT EXISTS public.client_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_ref_no text,
  status text NOT NULL DEFAULT 'pending',
  title text,
  surname text,
  first_name text,
  other_names text,
  email text,
  phone_number_1 text,
  phone_number_2 text,
  gender text,
  date_of_birth date,
  nationality text,
  state_of_origin text,
  local_government_area text,
  house_number text,
  street_name text,
  city_town text,
  contact_state text,
  building_categories text[],
  payment_mode text,
  passport_url text,
  admin_notes text,
  assigned_plot_id uuid REFERENCES public.plots(id) ON DELETE SET NULL,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nok_name text,
  nok_phone text,
  nok_relationship text,
  employment_status text,
  employer_name text,
  office_address text,
  position_held text,
  id_type text,
  id_number text,
  is_company boolean DEFAULT false,
  company_name text,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_applications_status_idx ON public.client_applications(status);

-- =========================== RESERVATIONS ===========================
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  property_type text,
  plot_size text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations(status);

-- =========================== PAYMENT RECORDS ===========================
CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_type text,
  payment_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  transaction_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_records_user_idx ON public.payment_records(user_id);
CREATE INDEX IF NOT EXISTS payment_records_status_idx ON public.payment_records(status);

-- =========================== PAYMENT REQUIREMENTS ===========================
CREATE TABLE IF NOT EXISTS public.payment_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_category text NOT NULL,
  amount_required numeric(14,2) NOT NULL DEFAULT 0,
  amount_paid numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_requirements_user_idx ON public.payment_requirements(user_id);

-- =========================== COMPANY ACCOUNTS ===========================
CREATE TABLE IF NOT EXISTS public.company_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  account_type text,
  purpose text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================== DOCUMENTS ===========================
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'receipt',
  file_name text NOT NULL,
  file_url text NOT NULL,
  payment_category text,
  approval_status text DEFAULT 'pending',
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_user_idx ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS documents_approval_idx ON public.documents(approval_status);

-- =========================== SUPPORT TICKETS ===========================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx ON public.ticket_messages(ticket_id, created_at);

-- ---------- updated_at triggers ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'estates','plots','plot_allocations','client_applications','reservations',
    'payment_requirements','company_account','support_tickets'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated ON public.%I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
      t, t
    );
  END LOOP;
END $$;

-- ---------- Grants + RLS ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'estates','plots','plot_allocations','client_applications','reservations',
    'payment_records','payment_requirements','company_account','documents',
    'support_tickets','ticket_messages'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    -- Admins manage everything
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_admin_all ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));',
      t, t
    );
  END LOOP;
END $$;

-- Owning-user read access where a user_id column exists
CREATE POLICY plot_allocations_own_read ON public.plot_allocations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY payment_records_own_read ON public.payment_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY payment_requirements_own_read ON public.payment_requirements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY documents_own ON public.documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY documents_own_insert ON public.documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Reservations & applications: public can create (website intake), admins manage
CREATE POLICY reservations_public_insert ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY client_applications_public_insert ON public.client_applications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Support: users manage their own tickets and messages
CREATE POLICY support_tickets_own ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY support_tickets_own_insert ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY ticket_messages_participant ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_messages.ticket_id AND st.user_id = auth.uid()
    )
  );
CREATE POLICY ticket_messages_participant_insert ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      sender_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.support_tickets st
        WHERE st.id = ticket_messages.ticket_id AND st.user_id = auth.uid()
      )
    )
  );

-- Company accounts and estates/plots are readable by any authenticated user
-- (needed so clients can see payment destinations and available plots).
CREATE POLICY company_account_read ON public.company_account FOR SELECT TO authenticated USING (true);
CREATE POLICY estates_read ON public.estates FOR SELECT TO authenticated USING (true);
CREATE POLICY plots_read ON public.plots FOR SELECT TO authenticated USING (true);

-- ---------- Admin dashboard summary for estate operations ----------
CREATE OR REPLACE FUNCTION public.get_estate_ops_summary()
RETURNS TABLE (
  total_estates bigint,
  total_plots bigint,
  available_plots bigint,
  allocated_plots bigint,
  total_reservations bigint,
  pending_reservations bigint,
  pending_applications bigint,
  pending_receipts bigint,
  total_revenue numeric,
  open_tickets bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.estates),
    (SELECT count(*) FROM public.plots),
    (SELECT count(*) FROM public.plots WHERE status = 'available'),
    (SELECT count(*) FROM public.plots WHERE status = 'allocated'),
    (SELECT count(*) FROM public.reservations),
    (SELECT count(*) FROM public.reservations WHERE status = 'pending'),
    (SELECT count(*) FROM public.client_applications WHERE status = 'pending'),
    (SELECT count(*) FROM public.documents WHERE approval_status = 'pending'),
    (SELECT COALESCE(SUM(amount), 0) FROM public.payment_records WHERE status = 'completed'),
    (SELECT count(*) FROM public.support_tickets WHERE status = 'open');
$$;
GRANT EXECUTE ON FUNCTION public.get_estate_ops_summary() TO authenticated;
