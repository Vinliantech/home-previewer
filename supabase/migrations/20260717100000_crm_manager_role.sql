-- CRM Manager: runs the CRM workspace without holding platform admin rights.
--
-- Platform admins keep CRM access through the control centre, so is_crm_admin
-- gains a third role rather than being replaced. Sales agents are unchanged and
-- still see only the leads assigned to them.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm_manager';

-- Every CRM RLS policy already calls is_crm_admin, so widening it here grants
-- the new role across leads, tasks, opportunities, automations and settings in
-- one place.
--
-- role::text is deliberate: Postgres will not resolve a newly added enum label
-- until the transaction that added it commits, so comparing as text keeps this
-- runnable as a single migration.
CREATE OR REPLACE FUNCTION public.is_crm_admin(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN ('admin', 'super_admin', 'crm_manager')
  )
$$;

-- Deliberately NOT added to public.is_admin: a CRM manager must not inherit the
-- platform admin surface (estate, finance, investors, tokenised properties).
