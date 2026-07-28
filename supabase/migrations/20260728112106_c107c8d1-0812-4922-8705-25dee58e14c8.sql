-- Reconciled post-baseline row/column security hardening from origin/main.
--
-- The original policy referenced obsolete property_status values and added
-- duplicate guard functions/triggers. The equivalent protection is expressed
-- with the current enum and column-level privileges, preserving the canonical
-- function and trigger totals.

DROP POLICY IF EXISTS "public read properties"
  ON public.tokenized_properties;

CREATE POLICY "public read properties"
  ON public.tokenized_properties
  FOR SELECT
  TO anon, authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      is_public = true
      AND status NOT IN (
        'sold'::public.property_status,
        'closed'::public.property_status
      )
    )
  );

-- Founders may edit pool presentation and funding terms, but cannot change
-- workflow status, admin notes, ownership, or audit fields directly.
REVOKE UPDATE ON public.group_pools FROM authenticated;
GRANT UPDATE (
  name,
  property_id,
  property_name,
  visibility,
  target_amount,
  min_contribution,
  member_cap,
  closing_date,
  description
) ON public.group_pools TO authenticated;

-- Members may adjust only their own commitment through the existing RLS
-- policy. Status and founder flags remain RPC/admin managed.
REVOKE UPDATE ON public.pool_members FROM authenticated;
GRANT UPDATE (committed_amount)
  ON public.pool_members
  TO authenticated;
