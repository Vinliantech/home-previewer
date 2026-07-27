-- Connect admin controls to the client and affiliate portals.
-- Adds reservation plot holds, flexible payment-plan terms, and affiliate supervisors.

-- =========================== RESERVATION HOLDS ===========================
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS estate_id uuid REFERENCES public.estates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plot_id uuid REFERENCES public.plots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_until date;

CREATE INDEX IF NOT EXISTS reservations_plot_idx ON public.reservations(plot_id);
CREATE INDEX IF NOT EXISTS reservations_client_idx ON public.reservations(client_user_id);

DROP POLICY IF EXISTS reservations_client_read ON public.reservations;
CREATE POLICY reservations_client_read ON public.reservations FOR SELECT TO authenticated
USING (client_user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS client_applications_own_read ON public.client_applications;
CREATE POLICY client_applications_own_read ON public.client_applications FOR SELECT TO authenticated
USING (assigned_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_assign_reservation_plot(
  _reservation_id uuid,
  _plot_id uuid,
  _client_user_id uuid,
  _reserved_until date,
  _notes text,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_plot uuid;
  v_estate uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only an administrator can manage reservation holds';
  END IF;

  SELECT plot_id INTO v_old_plot
  FROM public.reservations
  WHERE id = _reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;

  IF v_old_plot IS NOT NULL AND v_old_plot IS DISTINCT FROM _plot_id THEN
    UPDATE public.plots SET status = 'available'
    WHERE id = v_old_plot AND status = 'on_hold';
  END IF;

  IF _plot_id IS NOT NULL THEN
    UPDATE public.plots
    SET status = 'on_hold'
    WHERE id = _plot_id
      AND (status = 'available' OR (id = v_old_plot AND status = 'on_hold'))
    RETURNING estate_id INTO v_estate;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'That plot is no longer available';
    END IF;
  END IF;

  UPDATE public.reservations
  SET plot_id = _plot_id,
      estate_id = v_estate,
      client_user_id = _client_user_id,
      reserved_until = _reserved_until,
      admin_notes = NULLIF(trim(COALESCE(_notes, '')), ''),
      status = COALESCE(NULLIF(_status, ''), status)
  WHERE id = _reservation_id;
END
$$;

REVOKE ALL ON FUNCTION public.admin_assign_reservation_plot(uuid, uuid, uuid, date, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_reservation_plot(uuid, uuid, uuid, date, text, text)
  TO authenticated;

-- =========================== FLEXIBLE PAYMENT PLANS ===========================
ALTER TABLE public.payment_requirements
  ADD COLUMN IF NOT EXISTS purchase_model text NOT NULL DEFAULT 'full_purchase',
  ADD COLUMN IF NOT EXISTS term_months integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS installment_frequency_months integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS next_due_date date,
  ADD COLUMN IF NOT EXISTS catalogue_property_id uuid REFERENCES public.available_properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_pool_id uuid REFERENCES public.group_pools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.payment_requirements
    ADD CONSTRAINT payment_requirements_purchase_model_chk
    CHECK (purchase_model IN ('full_purchase', 'group_buy'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.payment_requirements
    ADD CONSTRAINT payment_requirements_term_months_chk
    CHECK (term_months BETWEEN 1 AND 60);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS payment_requirements_property_idx
  ON public.payment_requirements(catalogue_property_id);
CREATE INDEX IF NOT EXISTS payment_requirements_pool_idx
  ON public.payment_requirements(group_pool_id);

-- =========================== AFFILIATE SUPERVISION ===========================
ALTER TABLE public.affiliate_profiles
  ADD COLUMN IF NOT EXISTS supervisor_staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supervisor_assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS supervisor_assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS affiliate_profiles_supervisor_idx
  ON public.affiliate_profiles(supervisor_staff_id);

CREATE OR REPLACE FUNCTION public.protect_affiliate_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) AND (
    NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.affiliate_code IS DISTINCT FROM OLD.affiliate_code
    OR NEW.member_number IS DISTINCT FROM OLD.member_number
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.supervisor_staff_id IS DISTINCT FROM OLD.supervisor_staff_id
    OR NEW.supervisor_assigned_at IS DISTINCT FROM OLD.supervisor_assigned_at
    OR NEW.supervisor_assigned_by IS DISTINCT FROM OLD.supervisor_assigned_by
  ) THEN
    RAISE EXCEPTION 'Affiliate approval, commission and supervisor fields are admin-managed';
  END IF;
  RETURN NEW;
END
$$;

DROP POLICY IF EXISTS staff_read_assigned_affiliate_supervisor ON public.staff_members;
CREATE POLICY staff_read_assigned_affiliate_supervisor ON public.staff_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_profiles affiliate
    WHERE affiliate.user_id = auth.uid()
      AND affiliate.supervisor_staff_id = staff_members.id
  )
);

COMMENT ON COLUMN public.plots.status IS
  'Inventory state: available, on_hold, reserved, allocated, or sold.';
COMMENT ON COLUMN public.payment_requirements.term_months IS
  'Editable installment duration; admin UI offers 3, 6, 12 and 24 month presets.';
