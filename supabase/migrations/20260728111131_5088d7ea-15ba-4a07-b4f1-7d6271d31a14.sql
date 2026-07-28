-- Reconciled security hardening from origin/main.
--
-- The original migration targeted an obsolete intermediate schema: it treated
-- available_properties as a view, referenced investor_profiles.admin_notes
-- instead of kyc_notes, and recreated guards that the consolidated baseline
-- already provides. The intended controls are retained below without adding
-- duplicate functions, triggers, or policies.

-- Public application rows may not set workflow-owned fields.
DROP POLICY IF EXISTS client_applications_public_insert
  ON public.client_applications;

CREATE POLICY client_applications_public_insert
  ON public.client_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND assigned_user_id IS NULL
    AND assigned_plot_id IS NULL
    AND processed_by IS NULL
    AND processed_at IS NULL
    AND admin_notes IS NULL
  );

-- Public reservations must enter the workflow in the pending state.
DROP POLICY IF EXISTS reservations_public_insert
  ON public.reservations;

CREATE POLICY reservations_public_insert
  ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND admin_notes IS NULL
  );

-- Remove anonymous/PUBLIC execution from internal administrative and
-- service-role routines without depending on signatures that may have been
-- retired by the consolidated schema.
DO $$
DECLARE
  routine record;
BEGIN
  FOR routine IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (
        p.proname LIKE 'admin\_%' ESCAPE '\'
        OR p.proname IN (
          'client_log_document_event',
          'create_group_pool',
          'get_estate_ops_summary',
          'get_pool_members',
          'get_pool_summaries',
          'invite_pool_member',
          'is_admin',
          'is_crm_admin',
          'is_pool_founder',
          'is_pool_member',
          'join_group_pool',
          'request_property_token_exit',
          'submit_investment_payment_evidence',
          'submit_investor_kyc'
        )
      )
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',
      routine.signature
    );
  END LOOP;
END
$$;

-- These controls are intentionally incorporated in the consolidated baseline:
--   * investment certificate owner/admin read policy
--   * investor profile column-level grants and SECURITY DEFINER update RPC
--   * affiliate privileged-field trigger
-- They are documented here rather than recreated so the canonical totals and
-- the final intended database shape remain stable.
