-- Production hardening for investor, affiliate and finance workflows.
-- This migration is intentionally forward-only so Lovable's migration history remains intact.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'investor-kyc',
    'investor-kyc',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'payment-evidence',
    'payment-evidence',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Least-privilege profile and investment access
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "own investor profile" ON public.investor_profiles;

CREATE POLICY "investors read own profile"
ON public.investor_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "investors insert own profile"
ON public.investor_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investors update own profile"
ON public.investor_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

REVOKE INSERT, UPDATE ON public.investor_profiles FROM authenticated;

REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT INSERT (user_id, full_name, email, phone, address)
ON public.profiles TO authenticated;
GRANT UPDATE (full_name, email, phone, address)
ON public.profiles TO authenticated;

REVOKE INSERT, UPDATE ON public.investments FROM authenticated;
GRANT INSERT (investor_id, property_id, proposed_amount, agreement_accepted_at)
ON public.investments TO authenticated;

REVOKE INSERT ON public.withdrawal_requests FROM authenticated;
GRANT INSERT (investor_id, amount, bank_details)
ON public.withdrawal_requests TO authenticated;

REVOKE INSERT ON public.exit_requests FROM authenticated;

REVOKE INSERT ON public.payout_requests FROM authenticated;
GRANT INSERT (affiliate_id, requested_amount, bank_details)
ON public.payout_requests TO authenticated;

REVOKE UPDATE ON public.investor_notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.investor_notifications TO authenticated;

DROP POLICY IF EXISTS "own inv insert" ON public.investments;
DROP POLICY IF EXISTS "own inv update draft" ON public.investments;

CREATE POLICY "verified investors create valid investments"
ON public.investments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = investor_id
  AND agreement_accepted_at IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.investor_profiles ip
    WHERE ip.user_id = auth.uid() AND ip.kyc_status = 'verified'
  )
  AND EXISTS (
    SELECT 1
    FROM public.tokenized_properties tp
    WHERE tp.id = property_id
      AND tp.status IN ('open', 'partially_funded')
      AND (tp.funding_deadline IS NULL OR tp.funding_deadline >= current_date)
      AND proposed_amount >= tp.min_investment
      AND (tp.max_investment IS NULL OR proposed_amount <= tp.max_investment)
      AND MOD(proposed_amount, tp.token_value) = 0
  )
);

ALTER TABLE public.investments
  ADD CONSTRAINT investments_proposed_amount_positive
  CHECK (proposed_amount > 0) NOT VALID;

ALTER TABLE public.withdrawal_requests
  ADD CONSTRAINT withdrawal_amount_positive
  CHECK (amount > 0) NOT VALID;

ALTER TABLE public.exit_requests
  ADD CONSTRAINT exit_request_values_positive
  CHECK (tokens_to_sell > 0 AND asking_price > 0) NOT VALID;

CREATE INDEX IF NOT EXISTS investments_investor_status_idx
  ON public.investments (investor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS investments_property_status_idx
  ON public.investments (property_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS property_tokens_investment_uidx
  ON public.property_tokens (investment_id);
CREATE INDEX IF NOT EXISTS withdrawals_investor_status_idx
  ON public.withdrawal_requests (investor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS exits_investor_status_idx
  ON public.exit_requests (investor_id, status, created_at DESC);

REVOKE ALL ON FUNCTION public.recalc_property_funding(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_certificate_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_investment_approved() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.after_investment_approved() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_investor_wallet() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Safe public aggregates and certificate verification
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_property_funding(_property_ids UUID[])
RETURNS TABLE (
  property_id UUID,
  approved NUMERIC,
  pending NUMERIC,
  investors BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.property_id,
    COALESCE(SUM(i.approved_amount) FILTER (WHERE i.status = 'approved'), 0) AS approved,
    COALESCE(
      SUM(COALESCE(i.approved_amount, i.proposed_amount))
        FILTER (WHERE i.status IN ('submitted', 'payment_pending', 'payment_received', 'under_review')),
      0
    ) AS pending,
    COUNT(DISTINCT i.investor_id) FILTER (WHERE i.status = 'approved') AS investors
  FROM public.investments i
  WHERE i.property_id = ANY(_property_ids)
  GROUP BY i.property_id
$$;

REVOKE ALL ON FUNCTION public.get_public_property_funding(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_property_funding(UUID[]) TO anon, authenticated;

DROP POLICY IF EXISTS "public verify cert" ON public.investment_certificates;
REVOKE SELECT ON public.investment_certificates FROM anon;

CREATE POLICY "investors read own certificates"
ON public.investment_certificates FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.investments i
    WHERE i.id = investment_id AND i.investor_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.verify_investment_certificate(_token TEXT)
RETURNS TABLE (
  certificate_number TEXT,
  issued_at TIMESTAMPTZ,
  ownership_pct NUMERIC,
  tokens_count INT,
  approved_amount NUMERIC,
  property_name TEXT,
  property_location TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.certificate_number,
    c.issued_at,
    i.ownership_pct,
    i.tokens_count,
    i.approved_amount,
    tp.name,
    tp.location
  FROM public.investment_certificates c
  JOIN public.investments i ON i.id = c.investment_id
  JOIN public.tokenized_properties tp ON tp.id = i.property_id
  WHERE c.qr_token = _token AND i.status = 'approved'
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.verify_investment_certificate(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_investment_certificate(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Investor-controlled operations with protected status fields
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_investor_kyc(_profile JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_id_doc TEXT := NULLIF(_profile->>'id_doc_url', '');
  v_photo TEXT := NULLIF(_profile->>'photo_url', '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF length(trim(COALESCE(_profile->>'full_name', ''))) < 2
    OR length(trim(COALESCE(_profile->>'phone', ''))) < 6
    OR length(trim(COALESCE(_profile->>'address', ''))) < 3
    OR length(trim(COALESCE(_profile->>'id_number', ''))) < 3 THEN
    RAISE EXCEPTION 'Complete all required KYC fields';
  END IF;
  IF v_id_doc IS NULL OR v_id_doc NOT LIKE v_user_id::TEXT || '/%' THEN
    RAISE EXCEPTION 'A valid identity document is required';
  END IF;
  IF v_photo IS NULL OR v_photo NOT LIKE v_user_id::TEXT || '/%' THEN
    RAISE EXCEPTION 'A valid passport photograph is required';
  END IF;

  INSERT INTO public.investor_profiles (
    user_id, full_name, email, phone, address, country, nationality, dob,
    id_type, id_number, id_doc_url, photo_url, next_of_kin, bank_details,
    kyc_status, kyc_notes, kyc_reviewed_by, kyc_reviewed_at
  ) VALUES (
    v_user_id,
    _profile->>'full_name',
    _profile->>'email',
    _profile->>'phone',
    _profile->>'address',
    _profile->>'country',
    _profile->>'nationality',
    NULLIF(_profile->>'dob', '')::DATE,
    _profile->>'id_type',
    _profile->>'id_number',
    v_id_doc,
    v_photo,
    COALESCE(_profile->'next_of_kin', '{}'::JSONB),
    COALESCE(_profile->'bank_details', '{}'::JSONB),
    'pending',
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    country = EXCLUDED.country,
    nationality = EXCLUDED.nationality,
    dob = EXCLUDED.dob,
    id_type = EXCLUDED.id_type,
    id_number = EXCLUDED.id_number,
    id_doc_url = EXCLUDED.id_doc_url,
    photo_url = EXCLUDED.photo_url,
    next_of_kin = EXCLUDED.next_of_kin,
    bank_details = EXCLUDED.bank_details,
    kyc_status = 'pending',
    kyc_notes = NULL,
    kyc_reviewed_by = NULL,
    kyc_reviewed_at = NULL,
    updated_at = now();
END
$$;

REVOKE ALL ON FUNCTION public.submit_investor_kyc(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_investor_kyc(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_investment_payment_evidence(
  _investment_id UUID,
  _evidence_url TEXT,
  _reference TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_rows INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _evidence_url IS NULL OR _evidence_url NOT LIKE v_user_id::TEXT || '/%' THEN
    RAISE EXCEPTION 'Invalid payment evidence path';
  END IF;

  UPDATE public.investments
  SET payment_evidence_url = _evidence_url,
      payment_reference = NULLIF(trim(_reference), ''),
      status = 'payment_pending'
  WHERE id = _investment_id
    AND investor_id = v_user_id
    AND status IN ('submitted', 'payment_pending');

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Investment is not eligible for payment evidence';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.submit_investment_payment_evidence(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_investment_payment_evidence(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_property_token_exit(
  _property_id UUID,
  _tokens_to_sell INT,
  _asking_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_held INT;
  v_pending INT;
  v_exit_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _tokens_to_sell <= 0 OR _asking_price <= 0 THEN
    RAISE EXCEPTION 'Exit quantity and asking price must be positive';
  END IF;

  SELECT COALESCE(SUM(tokens_count), 0)::INT INTO v_held
  FROM public.property_tokens
  WHERE investor_id = v_user_id
    AND property_id = _property_id
    AND status IN ('active', 'listed_for_resale');

  SELECT COALESCE(SUM(tokens_to_sell), 0)::INT INTO v_pending
  FROM public.exit_requests
  WHERE investor_id = v_user_id
    AND property_id = _property_id
    AND status NOT IN ('completed', 'rejected', 'cancelled');

  IF _tokens_to_sell > v_held - v_pending THEN
    RAISE EXCEPTION 'Requested tokens exceed the available holding';
  END IF;

  INSERT INTO public.exit_requests (
    investor_id, property_id, tokens_to_sell, asking_price
  ) VALUES (
    v_user_id, _property_id, _tokens_to_sell, _asking_price
  )
  RETURNING id INTO v_exit_id;

  RETURN v_exit_id;
END
$$;

REVOKE ALL ON FUNCTION public.request_property_token_exit(UUID, INT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_property_token_exit(UUID, INT, NUMERIC) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin-only state transitions and atomic finance operations
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_review_investor_kyc(
  _profile_id UUID,
  _status public.kyc_status,
  _notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _status NOT IN ('pending', 'verified', 'rejected', 'more_info') THEN
    RAISE EXCEPTION 'Invalid KYC status';
  END IF;
  IF _status IN ('rejected', 'more_info') AND NULLIF(trim(_notes), '') IS NULL THEN
    RAISE EXCEPTION 'A compliance note is required for this status';
  END IF;

  UPDATE public.investor_profiles
  SET kyc_status = _status,
      kyc_notes = NULLIF(trim(_notes), ''),
      kyc_reviewed_by = auth.uid(),
      kyc_reviewed_at = now()
  WHERE id = _profile_id
  RETURNING user_id INTO v_user_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Investor profile not found';
  END IF;

  INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
  VALUES (
    v_user_id,
    'kyc_reviewed',
    'KYC review updated',
    CASE _status
      WHEN 'verified' THEN 'Your identity verification has been approved.'
      WHEN 'rejected' THEN 'Your identity verification was not approved. Review the compliance note and resubmit.'
      WHEN 'more_info' THEN 'The compliance team needs more information to complete your identity verification.'
      ELSE 'Your identity verification is under review.'
    END,
    '/portfolio/kyc'
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_review_investor_kyc(UUID, public.kyc_status, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_investor_kyc(UUID, public.kyc_status, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_approve_investment(
  _investment_id UUID,
  _approved_amount NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_investment public.investments%ROWTYPE;
  v_property public.tokenized_properties%ROWTYPE;
  v_approved_total NUMERIC;
  v_distinct_investors INT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_investment
  FROM public.investments
  WHERE id = _investment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Investment not found';
  END IF;
  IF v_investment.status NOT IN ('payment_pending', 'payment_received', 'under_review') THEN
    RAISE EXCEPTION 'Payment evidence must be reviewed before approval';
  END IF;
  IF v_investment.payment_evidence_url IS NULL THEN
    RAISE EXCEPTION 'Payment evidence is required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.investor_profiles
    WHERE user_id = v_investment.investor_id AND kyc_status = 'verified'
  ) THEN
    RAISE EXCEPTION 'Investor KYC is not verified';
  END IF;

  SELECT * INTO v_property
  FROM public.tokenized_properties
  WHERE id = v_investment.property_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  IF v_property.status NOT IN ('open', 'partially_funded') THEN
    RAISE EXCEPTION 'Property is not open for investment';
  END IF;
  IF v_property.funding_deadline IS NOT NULL AND v_property.funding_deadline < current_date THEN
    RAISE EXCEPTION 'Funding deadline has passed';
  END IF;
  IF _approved_amount <= 0 OR _approved_amount > v_investment.proposed_amount THEN
    RAISE EXCEPTION 'Approved amount must be positive and cannot exceed the proposal';
  END IF;
  IF _approved_amount < v_property.min_investment
    OR (v_property.max_investment IS NOT NULL AND _approved_amount > v_property.max_investment)
    OR MOD(_approved_amount, v_property.token_value) <> 0 THEN
    RAISE EXCEPTION 'Approved amount violates property investment limits';
  END IF;

  SELECT COALESCE(SUM(approved_amount), 0), COUNT(DISTINCT investor_id)
  INTO v_approved_total, v_distinct_investors
  FROM public.investments
  WHERE property_id = v_property.id AND status = 'approved';

  IF v_approved_total + _approved_amount > v_property.initial_value THEN
    RAISE EXCEPTION 'Approved amount exceeds remaining property capacity';
  END IF;
  IF v_property.max_investors IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.investments
      WHERE property_id = v_property.id
        AND investor_id = v_investment.investor_id
        AND status = 'approved'
    )
    AND v_distinct_investors >= v_property.max_investors THEN
    RAISE EXCEPTION 'Maximum investor count reached';
  END IF;

  UPDATE public.investments
  SET status = 'approved',
      approved_amount = _approved_amount,
      approved_by = auth.uid(),
      admin_notes = NULLIF(trim(_notes), '')
  WHERE id = _investment_id;

  SELECT * INTO v_investment FROM public.investments WHERE id = _investment_id;

  INSERT INTO public.investment_certificates (
    investment_id, certificate_number, qr_token, issued_by
  ) VALUES (
    v_investment.id,
    v_investment.certificate_number,
    replace(gen_random_uuid()::TEXT, '-', '') || replace(gen_random_uuid()::TEXT, '-', ''),
    auth.uid()
  )
  ON CONFLICT (investment_id) DO NOTHING;
END
$$;

REVOKE ALL ON FUNCTION public.admin_approve_investment(UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_investment(UUID, NUMERIC, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_investment(
  _investment_id UUID,
  _notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_investor_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.investments
  SET status = 'rejected',
      admin_notes = NULLIF(trim(_notes), ''),
      approved_by = auth.uid()
  WHERE id = _investment_id
    AND status NOT IN ('approved', 'refunded', 'cancelled')
  RETURNING investor_id INTO v_investor_id;

  IF v_investor_id IS NULL THEN
    RAISE EXCEPTION 'Investment cannot be rejected';
  END IF;

  INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
  VALUES (
    v_investor_id,
    'investment_rejected',
    'Investment not approved',
    COALESCE(NULLIF(trim(_notes), ''), 'Your investment request was not approved.'),
    '/portfolio/properties'
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_reject_investment(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_investment(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_record_property_valuation(
  _property_id UUID,
  _new_value NUMERIC,
  _valuation_date DATE,
  _valuer TEXT DEFAULT NULL,
  _report_url TEXT DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_value NUMERIC;
  v_change NUMERIC;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _new_value <= 0 THEN
    RAISE EXCEPTION 'Valuation must be positive';
  END IF;

  SELECT current_value INTO v_previous_value
  FROM public.tokenized_properties
  WHERE id = _property_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  v_change := CASE
    WHEN v_previous_value > 0 THEN round(((_new_value - v_previous_value) / v_previous_value) * 100, 4)
    ELSE 0
  END;

  INSERT INTO public.property_valuations (
    property_id, previous_value, new_value, change_pct, valuation_date,
    report_url, valuer, approved_by, notes
  ) VALUES (
    _property_id, v_previous_value, _new_value, v_change, _valuation_date,
    NULLIF(trim(_report_url), ''), NULLIF(trim(_valuer), ''), auth.uid(), NULLIF(trim(_notes), '')
  );

  UPDATE public.tokenized_properties
  SET current_value = _new_value
  WHERE id = _property_id;

  RETURN v_change;
END
$$;

REVOKE ALL ON FUNCTION public.admin_record_property_valuation(UUID, NUMERIC, DATE, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_record_property_valuation(UUID, NUMERIC, DATE, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_record_rental_distribution(
  _property_id UUID,
  _gross_income NUMERIC,
  _management_fee NUMERIC,
  _maintenance NUMERIC,
  _taxes NUMERIC,
  _other_expenses NUMERIC,
  _distribution_date DATE,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_net NUMERIC;
  v_distribution_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _gross_income < 0 OR _management_fee < 0 OR _maintenance < 0
    OR _taxes < 0 OR _other_expenses < 0 THEN
    RAISE EXCEPTION 'Income and expenses cannot be negative';
  END IF;

  v_net := _gross_income - _management_fee - _maintenance - _taxes - _other_expenses;
  IF v_net <= 0 THEN
    RAISE EXCEPTION 'Net distributable must be positive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tokenized_properties
    WHERE id = _property_id AND status IN ('acquired', 'income_generating', 'available_for_resale')
  ) THEN
    RAISE EXCEPTION 'Property is not eligible for rental distribution';
  END IF;

  INSERT INTO public.rental_distributions (
    property_id, gross_income, mgmt_fee, maintenance, taxes, other_expenses,
    net_distributable, distribution_date, notes, created_by
  ) VALUES (
    _property_id, _gross_income, _management_fee, _maintenance, _taxes, _other_expenses,
    v_net, _distribution_date, NULLIF(trim(_notes), ''), auth.uid()
  )
  RETURNING id INTO v_distribution_id;

  INSERT INTO public.rental_payouts (
    distribution_id, investor_id, property_id, ownership_pct_snapshot, amount, status
  )
  SELECT
    v_distribution_id,
    i.investor_id,
    _property_id,
    SUM(i.ownership_pct),
    round(v_net * (SUM(i.ownership_pct) / 100), 2),
    'pending'
  FROM public.investments i
  WHERE i.property_id = _property_id AND i.status = 'approved'
  GROUP BY i.investor_id
  HAVING round(v_net * (SUM(i.ownership_pct) / 100), 2) > 0;

  INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
  SELECT
    rp.investor_id,
    'rental_distributed',
    'Rental income allocated',
    'A rental distribution of ' || rp.amount::TEXT || ' is awaiting finance processing.',
    '/portfolio/returns'
  FROM public.rental_payouts rp
  WHERE rp.distribution_id = v_distribution_id;

  RETURN v_distribution_id;
END
$$;

REVOKE ALL ON FUNCTION public.admin_record_rental_distribution(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_record_rental_distribution(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, DATE, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_mark_rental_payout_paid(
  _payout_id UUID,
  _reference TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout public.rental_payouts%ROWTYPE;
  v_system_reference TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_payout
  FROM public.rental_payouts
  WHERE id = _payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;
  IF v_payout.status <> 'pending' THEN
    RAISE EXCEPTION 'Payout has already been processed';
  END IF;

  v_system_reference := 'rental-payout:' || v_payout.id::TEXT;

  UPDATE public.rental_payouts
  SET status = 'paid', paid_at = now(), reference = NULLIF(trim(_reference), '')
  WHERE id = v_payout.id;

  INSERT INTO public.investor_wallets (investor_id, available_balance, total_returns)
  VALUES (v_payout.investor_id, v_payout.amount, v_payout.amount)
  ON CONFLICT (investor_id) DO UPDATE SET
    available_balance = public.investor_wallets.available_balance + EXCLUDED.available_balance,
    total_returns = public.investor_wallets.total_returns + EXCLUDED.total_returns,
    updated_at = now();

  INSERT INTO public.wallet_transactions (
    investor_id, type, amount, property_id, reference, status, notes
  ) VALUES (
    v_payout.investor_id,
    'rental_income',
    v_payout.amount,
    v_payout.property_id,
    v_system_reference,
    'completed',
    NULLIF(trim(_reference), '')
  );

  INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
  VALUES (
    v_payout.investor_id,
    'rental_paid',
    'Rental return added to your wallet',
    'A rental return of ' || v_payout.amount::TEXT || ' is now available in your wallet.',
    '/portfolio/wallet'
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_mark_rental_payout_paid(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mark_rental_payout_paid(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(
  _withdrawal_id UUID,
  _reference TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal public.withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.withdrawal_requests
  WHERE id = _withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;
  IF v_withdrawal.status <> 'pending' THEN
    RAISE EXCEPTION 'Withdrawal has already been processed';
  END IF;
  IF NULLIF(trim(_reference), '') IS NULL THEN
    RAISE EXCEPTION 'A payment reference is required';
  END IF;

  UPDATE public.investor_wallets
  SET available_balance = available_balance - v_withdrawal.amount,
      total_withdrawn = total_withdrawn + v_withdrawal.amount,
      updated_at = now()
  WHERE investor_id = v_withdrawal.investor_id
    AND available_balance >= v_withdrawal.amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = 'approved',
      approved_by = auth.uid(),
      approved_at = now(),
      reference = NULLIF(trim(_reference), '')
  WHERE id = v_withdrawal.id;

  INSERT INTO public.wallet_transactions (
    investor_id, type, amount, reference, status, notes
  ) VALUES (
    v_withdrawal.investor_id,
    'withdrawal',
    -v_withdrawal.amount,
    'withdrawal:' || v_withdrawal.id::TEXT,
    'completed',
    NULLIF(trim(_reference), '')
  );

  INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
  VALUES (
    v_withdrawal.investor_id,
    'withdrawal_approved',
    'Withdrawal approved',
    'Your withdrawal of ' || v_withdrawal.amount::TEXT || ' has been processed.',
    '/portfolio/wallet'
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_approve_withdrawal(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_withdrawal(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(
  _withdrawal_id UUID,
  _notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_investor_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF NULLIF(trim(_notes), '') IS NULL THEN
    RAISE EXCEPTION 'A rejection reason is required';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = 'rejected',
      admin_notes = trim(_notes),
      approved_by = auth.uid(),
      approved_at = now()
  WHERE id = _withdrawal_id AND status = 'pending'
  RETURNING investor_id INTO v_investor_id;

  IF v_investor_id IS NULL THEN
    RAISE EXCEPTION 'Pending withdrawal not found';
  END IF;

  INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
  VALUES (
    v_investor_id,
    'withdrawal_rejected',
    'Withdrawal not approved',
    trim(_notes),
    '/portfolio/wallet'
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_reject_withdrawal(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_withdrawal(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_exit_request(
  _exit_id UUID,
  _status public.exit_status,
  _notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exit public.exit_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_exit
  FROM public.exit_requests
  WHERE id = _exit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exit request not found';
  END IF;
  IF _status = v_exit.status THEN
    RETURN;
  END IF;
  IF _status = 'completed' THEN
    RAISE EXCEPTION 'Use the ownership-transfer workflow to complete an exit request';
  END IF;
  IF NOT (
    (v_exit.status = 'submitted' AND _status IN ('under_review', 'rejected', 'cancelled'))
    OR (v_exit.status = 'under_review' AND _status IN ('approved_for_listing', 'rejected', 'cancelled'))
    OR (v_exit.status = 'approved_for_listing' AND _status IN ('under_review', 'buyer_found', 'cancelled'))
    OR (v_exit.status = 'buyer_found' AND _status IN ('approved_for_listing', 'payment_pending', 'cancelled'))
    OR (v_exit.status = 'payment_pending' AND _status IN ('buyer_found', 'transfer_in_progress', 'cancelled'))
    OR (v_exit.status = 'transfer_in_progress' AND _status IN ('payment_pending', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Invalid exit request status transition';
  END IF;

  UPDATE public.exit_requests
  SET status = _status, admin_notes = NULLIF(trim(_notes), '')
  WHERE id = v_exit.id;

  INSERT INTO public.investor_notifications (investor_id, type, title, body, link)
  VALUES (
    v_exit.investor_id,
    'exit_status_updated',
    'Exit request updated',
    'Your exit request status is now: ' || replace(_status::TEXT, '_', ' ') || '.',
    '/portfolio/exit-requests'
  );
END
$$;

REVOKE ALL ON FUNCTION public.admin_update_exit_request(UUID, public.exit_status, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_exit_request(UUID, public.exit_status, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Close affiliate privacy gaps and repair admin grants
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "read leaderboard rows" ON public.affiliate_profiles;

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
  ) THEN
    RAISE EXCEPTION 'Affiliate approval and commission fields are admin-managed';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS protect_affiliate_admin_fields_trg ON public.affiliate_profiles;
CREATE TRIGGER protect_affiliate_admin_fields_trg
BEFORE UPDATE ON public.affiliate_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_affiliate_admin_fields();

GRANT INSERT, UPDATE ON public.commissions TO authenticated;
GRANT UPDATE ON public.payout_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.training_videos TO authenticated;
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
GRANT INSERT ON public.property_valuations TO authenticated;
GRANT INSERT ON public.rental_distributions TO authenticated;
GRANT INSERT, UPDATE ON public.rental_payouts TO authenticated;
GRANT UPDATE ON public.exit_requests TO authenticated;
GRANT INSERT ON public.investor_notifications TO authenticated;

CREATE POLICY "admins insert rental payouts"
ON public.rental_payouts FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "admins create investor notifications"
ON public.investor_notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.affiliate_profiles),
    (SELECT count(*) FROM public.affiliate_profiles WHERE status = 'pending'),
    (SELECT count(*) FROM public.affiliate_profiles WHERE status = 'active'),
    (SELECT count(*) FROM public.client_leads),
    (SELECT count(*) FROM public.commissions WHERE status = 'pending'),
    (SELECT COALESCE(sum(commission_amount), 0) FROM public.commissions WHERE status = 'pending'),
    (SELECT count(*) FROM public.payout_requests WHERE status = 'pending'),
    (SELECT COALESCE(sum(requested_amount), 0) FROM public.payout_requests WHERE status = 'pending');
END
$$;

REVOKE ALL ON FUNCTION public.get_admin_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_affiliate_earnings(_affiliate_id UUID)
RETURNS TABLE (
  total_earned NUMERIC,
  total_paid NUMERIC,
  pending_payout NUMERIC,
  total_commissions BIGINT,
  pending_commissions BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) AND NOT EXISTS (
    SELECT 1 FROM public.affiliate_profiles
    WHERE id = _affiliate_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(sum(c.commission_amount) FILTER (WHERE c.status IN ('approved', 'paid')), 0),
    COALESCE(sum(c.commission_amount) FILTER (WHERE c.status = 'paid'), 0),
    COALESCE(sum(c.commission_amount) FILTER (WHERE c.status = 'approved'), 0),
    count(*),
    count(*) FILTER (WHERE c.status = 'pending')
  FROM public.commissions c
  WHERE c.affiliate_id = _affiliate_id;
END
$$;

REVOKE ALL ON FUNCTION public.get_affiliate_earnings(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliate_earnings(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_affiliate_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliate_leaderboard() TO authenticated;

-- ---------------------------------------------------------------------------
-- Auditing for sensitive state changes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_sensitive_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old JSONB := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_new JSONB := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_id UUID := COALESCE((v_new->>'id')::UUID, (v_old->>'id')::UUID);
BEGIN
  IF TG_TABLE_NAME = 'investor_profiles' THEN
    v_old := v_old - 'id_number' - 'id_doc_url' - 'photo_url' - 'next_of_kin' - 'bank_details';
    v_new := v_new - 'id_number' - 'id_doc_url' - 'photo_url' - 'next_of_kin' - 'bank_details';
  ELSIF TG_TABLE_NAME = 'investment_certificates' THEN
    v_old := v_old - 'qr_token';
    v_new := v_new - 'qr_token';
  END IF;

  INSERT INTO public.audit_logs (
    actor_id, action, entity_type, entity_id, previous_value, new_value
  ) VALUES (
    auth.uid(), lower(TG_OP), TG_TABLE_NAME, v_id, v_old, v_new
  );
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.protect_affiliate_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_sensitive_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_investor_profiles ON public.investor_profiles;
CREATE TRIGGER audit_investor_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.investor_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_investments ON public.investments;
CREATE TRIGGER audit_investments
AFTER INSERT OR UPDATE OR DELETE ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_property_tokens ON public.property_tokens;
CREATE TRIGGER audit_property_tokens
AFTER INSERT OR UPDATE OR DELETE ON public.property_tokens
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_property_valuations ON public.property_valuations;
CREATE TRIGGER audit_property_valuations
AFTER INSERT OR UPDATE OR DELETE ON public.property_valuations
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_rental_distributions ON public.rental_distributions;
CREATE TRIGGER audit_rental_distributions
AFTER INSERT OR UPDATE OR DELETE ON public.rental_distributions
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_rental_payouts ON public.rental_payouts;
CREATE TRIGGER audit_rental_payouts
AFTER INSERT OR UPDATE OR DELETE ON public.rental_payouts
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_investor_wallets ON public.investor_wallets;
CREATE TRIGGER audit_investor_wallets
AFTER INSERT OR UPDATE OR DELETE ON public.investor_wallets
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_wallet_transactions ON public.wallet_transactions;
CREATE TRIGGER audit_wallet_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_withdrawal_requests ON public.withdrawal_requests;
CREATE TRIGGER audit_withdrawal_requests
AFTER INSERT OR UPDATE OR DELETE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_exit_requests ON public.exit_requests;
CREATE TRIGGER audit_exit_requests
AFTER INSERT OR UPDATE OR DELETE ON public.exit_requests
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS audit_investment_certificates ON public.investment_certificates;
CREATE TRIGGER audit_investment_certificates
AFTER INSERT OR UPDATE OR DELETE ON public.investment_certificates
FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();
