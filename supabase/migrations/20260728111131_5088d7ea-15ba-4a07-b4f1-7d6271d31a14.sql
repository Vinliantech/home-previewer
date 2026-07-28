
-- View: use security invoker
ALTER VIEW public.available_properties SET (security_invoker = true);

-- investment_certificates: owner/admin only
DROP POLICY IF EXISTS ic_read ON public.investment_certificates;
CREATE POLICY ic_owner_read ON public.investment_certificates
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.investments i
      WHERE i.id = investment_certificates.investment_id
        AND i.investor_id = auth.uid()
    )
  );

-- investor_profiles: split self policy and block privileged column changes
DROP POLICY IF EXISTS ip_self ON public.investor_profiles;
CREATE POLICY ip_self_select ON public.investor_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY ip_self_insert ON public.investor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND kyc_status = 'pending'::public.kyc_status
    AND admin_notes IS NULL
  );
CREATE POLICY ip_self_update ON public.investor_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_investor_profile_privileged_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.kyc_status := OLD.kyc_status;
  NEW.admin_notes := OLD.admin_notes;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ip_prevent_priv ON public.investor_profiles;
CREATE TRIGGER trg_ip_prevent_priv
  BEFORE UPDATE ON public.investor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_investor_profile_privileged_updates();

-- affiliate_profiles: same pattern for status + bank_details
DROP POLICY IF EXISTS ap_self ON public.affiliate_profiles;
CREATE POLICY ap_self_select ON public.affiliate_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY ap_self_insert ON public.affiliate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY ap_self_update ON public.affiliate_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_affiliate_profile_privileged_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.bank_details := OLD.bank_details;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ap_prevent_priv ON public.affiliate_profiles;
CREATE TRIGGER trg_ap_prevent_priv
  BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_affiliate_profile_privileged_updates();

-- client_applications: restrict privileged fields at insert
DROP POLICY IF EXISTS client_applications_public_insert ON public.client_applications;
CREATE POLICY client_applications_public_insert ON public.client_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND assigned_user_id IS NULL
    AND assigned_plot_id IS NULL
    AND processed_by IS NULL
    AND processed_at IS NULL
    AND admin_notes IS NULL
  );

-- reservations: pending only at insert
DROP POLICY IF EXISTS reservations_public_insert ON public.reservations;
CREATE POLICY reservations_public_insert ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND admin_notes IS NULL);

-- Revoke anon EXECUTE on internal SECURITY DEFINER functions.
-- Keep anon on genuinely public helpers: verify_investment_certificate, get_public_property_funding.
REVOKE EXECUTE ON FUNCTION
  public.admin_approve_investment(uuid, numeric, text),
  public.admin_approve_withdrawal(uuid, text),
  public.admin_assign_document(uuid, uuid[], boolean, boolean, boolean),
  public.admin_create_document(text, text, public.doc_category, uuid, uuid, date, date, public.doc_visibility, boolean, text, text, text, bigint),
  public.admin_delete_document(uuid),
  public.admin_edit_document(uuid, text, text, public.doc_category, uuid, uuid, date, date, boolean),
  public.admin_mark_document_notified(uuid, uuid[]),
  public.admin_mark_rental_payout_paid(uuid, text),
  public.admin_record_property_valuation(uuid, numeric, date, text, text, text),
  public.admin_record_rental_distribution(uuid, numeric, numeric, numeric, numeric, numeric, date, text),
  public.admin_reject_investment(uuid, text),
  public.admin_reject_withdrawal(uuid, text),
  public.admin_replace_document_file(uuid, text, text, text, bigint),
  public.admin_review_investor_kyc(uuid, public.kyc_status, text),
  public.admin_review_pool(uuid, boolean, text),
  public.admin_set_document_visibility(uuid, public.doc_visibility),
  public.admin_set_pool_member_status(uuid, public.pool_member_status),
  public.admin_unassign_document(uuid),
  public.admin_update_exit_request(uuid, public.exit_status, text),
  public.client_log_document_event(uuid, public.doc_audit_action),
  public.create_group_pool(text, uuid, text, public.pool_visibility, numeric, numeric, integer, date, text, numeric),
  public.get_estate_ops_summary(),
  public.get_pool_summaries(uuid[]),
  public.invite_pool_member(uuid, text),
  public.is_admin(uuid),
  public.is_pool_founder(uuid, uuid),
  public.is_pool_member(uuid, uuid),
  public.join_group_pool(uuid, numeric),
  public.request_property_token_exit(uuid, integer, numeric),
  public.submit_investment_payment_evidence(uuid, text, text),
  public.submit_investor_kyc(jsonb)
FROM anon, PUBLIC;

-- Admin-only functions: also revoke from authenticated. They already guard with is_admin(),
-- and callers should invoke via server-side supabaseAdmin. Authenticated admins retain access via has_role() checks.
REVOKE EXECUTE ON FUNCTION
  public.admin_approve_investment(uuid, numeric, text),
  public.admin_approve_withdrawal(uuid, text),
  public.admin_assign_document(uuid, uuid[], boolean, boolean, boolean),
  public.admin_create_document(text, text, public.doc_category, uuid, uuid, date, date, public.doc_visibility, boolean, text, text, text, bigint),
  public.admin_delete_document(uuid),
  public.admin_edit_document(uuid, text, text, public.doc_category, uuid, uuid, date, date, boolean),
  public.admin_mark_document_notified(uuid, uuid[]),
  public.admin_mark_rental_payout_paid(uuid, text),
  public.admin_record_property_valuation(uuid, numeric, date, text, text, text),
  public.admin_record_rental_distribution(uuid, numeric, numeric, numeric, numeric, numeric, date, text),
  public.admin_reject_investment(uuid, text),
  public.admin_reject_withdrawal(uuid, text),
  public.admin_replace_document_file(uuid, text, text, text, bigint),
  public.admin_review_investor_kyc(uuid, public.kyc_status, text),
  public.admin_review_pool(uuid, boolean, text),
  public.admin_set_document_visibility(uuid, public.doc_visibility),
  public.admin_set_pool_member_status(uuid, public.pool_member_status),
  public.admin_unassign_document(uuid),
  public.admin_update_exit_request(uuid, public.exit_status, text)
FROM authenticated;
-- Re-grant admin functions to authenticated - they self-guard with is_admin() and are called from client admin UI.
GRANT EXECUTE ON FUNCTION
  public.admin_approve_investment(uuid, numeric, text),
  public.admin_approve_withdrawal(uuid, text),
  public.admin_assign_document(uuid, uuid[], boolean, boolean, boolean),
  public.admin_create_document(text, text, public.doc_category, uuid, uuid, date, date, public.doc_visibility, boolean, text, text, text, bigint),
  public.admin_delete_document(uuid),
  public.admin_edit_document(uuid, text, text, public.doc_category, uuid, uuid, date, date, boolean),
  public.admin_mark_document_notified(uuid, uuid[]),
  public.admin_mark_rental_payout_paid(uuid, text),
  public.admin_record_property_valuation(uuid, numeric, date, text, text, text),
  public.admin_record_rental_distribution(uuid, numeric, numeric, numeric, numeric, numeric, date, text),
  public.admin_reject_investment(uuid, text),
  public.admin_reject_withdrawal(uuid, text),
  public.admin_replace_document_file(uuid, text, text, text, bigint),
  public.admin_review_investor_kyc(uuid, public.kyc_status, text),
  public.admin_review_pool(uuid, boolean, text),
  public.admin_set_document_visibility(uuid, public.doc_visibility),
  public.admin_set_pool_member_status(uuid, public.pool_member_status),
  public.admin_unassign_document(uuid),
  public.admin_update_exit_request(uuid, public.exit_status, text)
TO authenticated;
