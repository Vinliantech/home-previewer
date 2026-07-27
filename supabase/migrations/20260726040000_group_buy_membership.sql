-- Group buy: connect invited people to their account, and let a member see
-- who else is in the pool.
--
-- Two breaks in the flow:
--
-- 1. invite_pool_member() writes a pool_members row carrying only
--    invited_email, with user_id null. Nothing ever claimed that row when the
--    invited person registered, so their account and their pool membership
--    stayed unconnected: getMyPools() filters on user_id, so the pool simply
--    never appeared in their portal.
--
-- 2. The pool detail screen renders m.display_name for each member, but
--    pool_members has no such column and RLS on profiles allows reading only
--    your own row. Every co-member therefore displayed as "Verified member",
--    so nobody could see who was in the group or what they had put in.

-- =================== CLAIM AN INVITATION ON SIGN-UP ===================

CREATE OR REPLACE FUNCTION public.claim_pool_invitations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Status stays 'invited': being linked is not the same as having committed.
  -- The member still joins with an amount, which is what moves them on.
  UPDATE public.pool_members
  SET user_id = NEW.id
  WHERE user_id IS NULL
    AND invited_email IS NOT NULL
    AND lower(btrim(invited_email)) = lower(btrim(NEW.email))
    -- Never take an invitation that already belongs to somebody in this pool.
    AND NOT EXISTS (
      SELECT 1 FROM public.pool_members existing
      WHERE existing.pool_id = pool_members.pool_id
        AND existing.user_id = NEW.id
    );

  RETURN NEW;
END
$$;

-- Separate from handle_new_user so that trigger keeps its single job; both
-- fire AFTER INSERT and the order between them does not matter.
DROP TRIGGER IF EXISTS on_auth_user_claim_pool_invitations ON auth.users;
CREATE TRIGGER on_auth_user_claim_pool_invitations
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.claim_pool_invitations();

-- Catch up anyone invited before this existed who has since registered.
UPDATE public.pool_members pm
SET user_id = u.id
FROM auth.users u
WHERE pm.user_id IS NULL
  AND pm.invited_email IS NOT NULL
  AND lower(btrim(pm.invited_email)) = lower(btrim(u.email))
  AND NOT EXISTS (
    SELECT 1 FROM public.pool_members other
    WHERE other.pool_id = pm.pool_id
      AND other.user_id = u.id
  );

-- =================== WHO ELSE IS IN THIS POOL ===================
--
-- Returns co-members with their names and contributions. SECURITY DEFINER
-- because profiles is readable only by its owner — this is the one narrow
-- window through it, and it exposes a name and an amount, never an email,
-- phone or address.
--
-- An invited person who has not registered yet shows as "Invited" to
-- co-members; only the founder and admins see which address was invited,
-- since they are the ones who need to chase it.

CREATE OR REPLACE FUNCTION public.get_pool_members(_pool_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  committed_amount numeric,
  status public.pool_member_status,
  is_founder boolean,
  is_self boolean,
  joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_privileged boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.is_pool_member(_pool_id, v_uid)
    OR public.is_pool_founder(_pool_id, v_uid)
    OR public.is_admin(v_uid)
  ) THEN
    RAISE EXCEPTION 'You are not a member of this pool';
  END IF;

  v_privileged := public.is_pool_founder(_pool_id, v_uid) OR public.is_admin(v_uid);

  RETURN QUERY
  SELECT
    pm.id,
    COALESCE(
      NULLIF(btrim(p.full_name), ''),
      CASE WHEN v_privileged THEN pm.invited_email END,
      CASE WHEN pm.user_id IS NULL THEN 'Invited' ELSE 'Member' END
    ) AS display_name,
    pm.committed_amount,
    pm.status,
    pm.is_founder,
    (pm.user_id = v_uid) AS is_self,
    pm.joined_at
  FROM public.pool_members pm
  LEFT JOIN public.profiles p ON p.user_id = pm.user_id
  WHERE pm.pool_id = _pool_id
  ORDER BY pm.is_founder DESC, pm.created_at ASC;
END
$$;

REVOKE ALL ON FUNCTION public.get_pool_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pool_members(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_pool_members(uuid) IS
  'Co-members of a pool with their names and contributions. Callable only by a '
  'member, the founder or an admin. Returns names and amounts only — never '
  'contact details, except the invited email which the founder and admins see '
  'so they can chase an outstanding invitation.';
