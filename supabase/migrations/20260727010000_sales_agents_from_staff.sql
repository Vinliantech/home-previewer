-- A sales adviser is created from the staff directory, not from a typed UUID.
--
-- Adding an adviser meant hand-typing a raw auth user id into a narrow input,
-- then retyping the name, email and phone that staff_members already holds.
-- Three consequences: a mistyped id created an adviser pointing at nobody (or
-- at the wrong person, who then silently received leads), the retyped details
-- drifted from the staff record, and there was no link back to the staff
-- member at all.
--
-- Migration 20260723030000 already established the principle for role grants:
-- "Grant elevated access from a staff-directory selection, never from the
-- general client list." This applies the same rule to CRM advisers.

ALTER TABLE public.sales_agents
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sales_agents_staff_uidx
  ON public.sales_agents(staff_id) WHERE staff_id IS NOT NULL;

COMMENT ON COLUMN public.sales_agents.staff_id IS
  'The staff directory record this adviser is. Null only for advisers created '
  'before this migration, by typed user id.';

-- Backfill the link for advisers whose user account already matches a staff
-- record. Matching on user_id, never on email, so a shared or reused address
-- cannot attach an adviser to the wrong person.
UPDATE public.sales_agents sa
SET staff_id = sm.id
FROM public.staff_members sm
WHERE sa.staff_id IS NULL
  AND sa.user_id IS NOT NULL
  AND sm.user_id = sa.user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_agents other
    WHERE other.staff_id = sm.id
  );

/**
 * Create a CRM adviser from a staff member, in one audited step.
 *
 * Takes the identity from staff_members rather than the caller, so the adviser
 * always matches the directory and the caller cannot nominate an arbitrary
 * user id. Grants sales_agent through the existing tier-checked RPC.
 */
CREATE OR REPLACE FUNCTION public.create_sales_agent_from_staff(
  _staff_id uuid,
  _assigned_locations text[] DEFAULT '{}',
  _monthly_target numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff public.staff_members%ROWTYPE;
  v_agent_id uuid;
BEGIN
  IF NOT public.is_crm_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only CRM administrators can add advisers';
  END IF;

  SELECT * INTO v_staff FROM public.staff_members WHERE id = _staff_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That staff member does not exist';
  END IF;

  -- An invited-but-not-registered staff member has no auth user, so leads
  -- assigned to them would reference nobody and never appear in a portal.
  IF v_staff.user_id IS NULL THEN
    RAISE EXCEPTION
      'That staff member has not accepted their invite yet, so they cannot receive leads';
  END IF;

  IF v_staff.status <> 'active' THEN
    RAISE EXCEPTION 'Only active staff can be made advisers';
  END IF;

  INSERT INTO public.sales_agents (
    staff_id, user_id, full_name, email, phone,
    assigned_locations, monthly_target_naira, active
  )
  VALUES (
    v_staff.id, v_staff.user_id, v_staff.full_name, v_staff.email, v_staff.phone,
    COALESCE(_assigned_locations, '{}'), COALESCE(_monthly_target, 0), true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    staff_id = EXCLUDED.staff_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    assigned_locations = EXCLUDED.assigned_locations,
    monthly_target_naira = EXCLUDED.monthly_target_naira,
    active = true,
    updated_at = now()
  RETURNING id INTO v_agent_id;

  PERFORM public.grant_user_role(v_staff.user_id, 'sales_agent');

  RETURN v_agent_id;
END
$$;

REVOKE ALL ON FUNCTION public.create_sales_agent_from_staff(uuid, text[], numeric)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sales_agent_from_staff(uuid, text[], numeric)
  TO authenticated;

-- Keep an adviser's contact details following their staff record, the same way
-- client details already follow their profile (migration 20260717130000).
CREATE OR REPLACE FUNCTION public.sync_sales_agent_from_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sales_agents
  SET full_name = COALESCE(NULLIF(btrim(NEW.full_name), ''), full_name),
      email = COALESCE(NULLIF(btrim(NEW.email), ''), email),
      phone = COALESCE(NULLIF(btrim(NEW.phone), ''), phone),
      -- A suspended staff member stops receiving newly assigned leads.
      active = (NEW.status = 'active'),
      updated_at = now()
  WHERE staff_id = NEW.id;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS sync_sales_agent_from_staff_trg ON public.staff_members;
CREATE TRIGGER sync_sales_agent_from_staff_trg
AFTER UPDATE ON public.staff_members
FOR EACH ROW EXECUTE FUNCTION public.sync_sales_agent_from_staff();

/**
 * Active staff who can be made advisers.
 *
 * staff_members is readable only by is_admin or the person themselves, and a
 * crm_manager is neither — is_crm_admin includes crm_manager, is_admin does
 * not. Without this a CRM manager would open an empty picker. Returns only
 * what the picker shows, and excludes anyone who has not accepted their invite
 * (no auth user means they cannot receive a lead) or is already an adviser.
 */
CREATE OR REPLACE FUNCTION public.list_assignable_staff()
RETURNS TABLE (
  id uuid,
  full_name text,
  position text,
  department text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sm.id, sm.full_name, sm.position, sm.department
  FROM public.staff_members sm
  WHERE public.is_crm_admin(auth.uid())
    AND sm.status = 'active'
    AND sm.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.sales_agents sa
      WHERE sa.user_id = sm.user_id AND sa.active
    )
  ORDER BY sm.full_name;
$$;

REVOKE ALL ON FUNCTION public.list_assignable_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_assignable_staff() TO authenticated;
