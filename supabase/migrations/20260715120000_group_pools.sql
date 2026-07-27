-- ===========================================================================
-- Group Buy pool engine (Phase 2)
-- Forward-only migration. Adds coordinated buyer pools with member-level
-- records, contribution milestones and admin approval.
--
-- Design notes:
--   * A pool targets one property (optionally a listed tokenized_property).
--   * The founder is a member row with is_founder = true.
--   * Cross-member visibility is intentional — group buyers see each other's
--     contribution status (the product's transparency promise).
--   * SECURITY DEFINER helpers (is_pool_member / is_pool_founder) are used in
--     RLS policies to avoid recursive policy evaluation on pool_members.
-- ===========================================================================

-- ---------- Enums (idempotent) ----------
DO $$ BEGIN
  CREATE TYPE public.pool_visibility AS ENUM ('private', 'open');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pool_status AS ENUM (
    'pending_approval', 'open', 'threshold_met', 'closing', 'completed', 'cancelled', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pool_member_status AS ENUM (
    'invited', 'pending', 'committed', 'approved', 'declined', 'removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Tables ----------
CREATE TABLE IF NOT EXISTS public.group_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  property_id uuid REFERENCES public.tokenized_properties(id) ON DELETE SET NULL,
  property_name text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility public.pool_visibility NOT NULL DEFAULT 'private',
  target_amount numeric(14,2) NOT NULL CHECK (target_amount > 0),
  min_contribution numeric(14,2) NOT NULL DEFAULT 0 CHECK (min_contribution >= 0),
  member_cap integer CHECK (member_cap IS NULL OR member_cap > 0),
  closing_date date,
  status public.pool_status NOT NULL DEFAULT 'pending_approval',
  description text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS group_pools_created_by_idx ON public.group_pools(created_by);
CREATE INDEX IF NOT EXISTS group_pools_status_idx ON public.group_pools(status);
CREATE INDEX IF NOT EXISTS group_pools_property_idx ON public.group_pools(property_id);

CREATE TABLE IF NOT EXISTS public.pool_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.group_pools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text,
  committed_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
  status public.pool_member_status NOT NULL DEFAULT 'pending',
  is_founder boolean NOT NULL DEFAULT false,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pool_members_pool_user_uidx
  ON public.pool_members(pool_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pool_members_pool_idx ON public.pool_members(pool_id);
CREATE INDEX IF NOT EXISTS pool_members_user_idx ON public.pool_members(user_id);

-- ---------- updated_at triggers ----------
DROP TRIGGER IF EXISTS group_pools_updated ON public.group_pools;
CREATE TRIGGER group_pools_updated BEFORE UPDATE ON public.group_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS pool_members_updated ON public.pool_members;
CREATE TRIGGER pool_members_updated BEFORE UPDATE ON public.pool_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- SECURITY DEFINER membership helpers (avoid RLS recursion) ----------
CREATE OR REPLACE FUNCTION public.is_pool_member(_pool_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_members
    WHERE pool_id = _pool_id AND user_id = _user_id
      AND status <> 'removed'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pool_founder(_pool_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_pools WHERE id = _pool_id AND created_by = _user_id
  );
$$;

-- ---------- Row-level security ----------
ALTER TABLE public.group_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.group_pools TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pool_members TO authenticated;
GRANT ALL ON public.group_pools TO service_role;
GRANT ALL ON public.pool_members TO service_role;

-- group_pools policies
DROP POLICY IF EXISTS gp_select ON public.group_pools;
CREATE POLICY gp_select ON public.group_pools FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_pool_member(id, auth.uid())
  OR (visibility = 'open' AND status IN ('open', 'threshold_met'))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS gp_admin_all ON public.group_pools;
CREATE POLICY gp_admin_all ON public.group_pools FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS gp_founder_update ON public.group_pools;
CREATE POLICY gp_founder_update ON public.group_pools FOR UPDATE TO authenticated
USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- pool_members policies
DROP POLICY IF EXISTS pm_select ON public.pool_members;
CREATE POLICY pm_select ON public.pool_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_pool_member(pool_id, auth.uid())
  OR public.is_pool_founder(pool_id, auth.uid())
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS pm_admin_all ON public.pool_members;
CREATE POLICY pm_admin_all ON public.pool_members FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Direct writes go through SECURITY DEFINER RPCs below; members may update
-- only their own row (e.g. adjust their committed amount while pending).
DROP POLICY IF EXISTS pm_self_update ON public.pool_members;
CREATE POLICY pm_self_update ON public.pool_members FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- Safe aggregate for progress bars ----------
CREATE OR REPLACE FUNCTION public.get_pool_summaries(_pool_ids uuid[])
RETURNS TABLE (
  pool_id uuid,
  committed numeric,
  approved numeric,
  members bigint,
  approved_members bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id AS pool_id,
    COALESCE(SUM(m.committed_amount) FILTER (WHERE m.status IN ('committed','approved')), 0) AS committed,
    COALESCE(SUM(m.committed_amount) FILTER (WHERE m.status = 'approved'), 0) AS approved,
    COUNT(m.id) FILTER (WHERE m.status <> 'removed') AS members,
    COUNT(m.id) FILTER (WHERE m.status = 'approved') AS approved_members
  FROM public.group_pools p
  LEFT JOIN public.pool_members m ON m.pool_id = p.id
  WHERE p.id = ANY(_pool_ids)
  GROUP BY p.id;
$$;
GRANT EXECUTE ON FUNCTION public.get_pool_summaries(uuid[]) TO authenticated;

-- ---------- Create pool (pool + founder membership, atomic) ----------
CREATE OR REPLACE FUNCTION public.create_group_pool(
  _name text,
  _property_id uuid,
  _property_name text,
  _visibility public.pool_visibility,
  _target_amount numeric,
  _min_contribution numeric,
  _member_cap integer,
  _closing_date date,
  _description text,
  _founder_commitment numeric
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _pool_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _target_amount IS NULL OR _target_amount <= 0 THEN
    RAISE EXCEPTION 'Target amount must be greater than zero';
  END IF;

  INSERT INTO public.group_pools (
    name, property_id, property_name, created_by, visibility,
    target_amount, min_contribution, member_cap, closing_date, description, status
  ) VALUES (
    _name, _property_id, _property_name, _uid, COALESCE(_visibility, 'private'),
    _target_amount, COALESCE(_min_contribution, 0), _member_cap, _closing_date, _description,
    'pending_approval'
  ) RETURNING id INTO _pool_id;

  INSERT INTO public.pool_members (pool_id, user_id, committed_amount, status, is_founder, joined_at)
  VALUES (_pool_id, _uid, COALESCE(_founder_commitment, 0), 'committed', true, now());

  RETURN _pool_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_group_pool(text, uuid, text, public.pool_visibility, numeric, numeric, integer, date, text, numeric) TO authenticated;

-- ---------- Join an open pool ----------
CREATE OR REPLACE FUNCTION public.join_group_pool(_pool_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _pool public.group_pools;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _pool FROM public.group_pools WHERE id = _pool_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pool not found'; END IF;
  IF _pool.status NOT IN ('open', 'threshold_met') THEN
    RAISE EXCEPTION 'This pool is not open to new members';
  END IF;
  IF _pool.min_contribution > 0 AND _amount < _pool.min_contribution THEN
    RAISE EXCEPTION 'Contribution is below the pool minimum';
  END IF;

  INSERT INTO public.pool_members (pool_id, user_id, committed_amount, status, joined_at)
  VALUES (_pool_id, _uid, COALESCE(_amount, 0), 'pending', now())
  ON CONFLICT (pool_id, user_id) WHERE user_id IS NOT NULL
  DO UPDATE SET committed_amount = EXCLUDED.committed_amount,
               status = 'pending',
               joined_at = COALESCE(public.pool_members.joined_at, now());
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_group_pool(uuid, numeric) TO authenticated;

-- ---------- Invite a member (founder only) ----------
CREATE OR REPLACE FUNCTION public.invite_pool_member(_pool_id uuid, _email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_pool_founder(_pool_id, _uid) THEN
    RAISE EXCEPTION 'Only the pool founder can invite members';
  END IF;
  INSERT INTO public.pool_members (pool_id, invited_email, status)
  VALUES (_pool_id, lower(trim(_email)), 'invited');
END;
$$;
GRANT EXECUTE ON FUNCTION public.invite_pool_member(uuid, text) TO authenticated;

-- ---------- Admin: approve/reject a pool ----------
CREATE OR REPLACE FUNCTION public.admin_review_pool(_pool_id uuid, _approve boolean, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.group_pools
  SET status = CASE WHEN _approve THEN 'open'::public.pool_status ELSE 'rejected'::public.pool_status END,
      admin_notes = _notes,
      updated_at = now()
  WHERE id = _pool_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_review_pool(uuid, boolean, text) TO authenticated;

-- ---------- Admin: set a member's status (approve contributions) ----------
CREATE OR REPLACE FUNCTION public.admin_set_pool_member_status(_member_id uuid, _status public.pool_member_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.pool_members SET status = _status, updated_at = now() WHERE id = _member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_pool_member_status(uuid, public.pool_member_status) TO authenticated;
