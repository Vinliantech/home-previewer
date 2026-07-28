-- Reconciled with 20260727020000_workshop_registrations.sql.
--
-- origin/main originally repeated the complete workshop table definition and
-- replaced the staff policy with an admin-only policy. The table, sequence,
-- indexes, trigger, grants, and constraints are already part of the
-- consolidated baseline. Keep this post-baseline migration as an idempotent
-- policy reconciliation so existing migration history remains forward-only.

ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.workshop_registrations TO authenticated;
GRANT ALL ON public.workshop_registrations TO service_role;

DROP POLICY IF EXISTS workshop_registrations_staff_read
  ON public.workshop_registrations;

CREATE POLICY workshop_registrations_staff_read
  ON public.workshop_registrations
  FOR SELECT
  TO authenticated
  USING (public.is_crm_admin(auth.uid()));
