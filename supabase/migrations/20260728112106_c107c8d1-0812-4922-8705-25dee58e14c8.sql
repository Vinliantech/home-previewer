
DROP POLICY IF EXISTS "public read properties" ON public.tokenized_properties;
CREATE POLICY "public read properties"
  ON public.tokenized_properties
  FOR SELECT
  TO anon, authenticated
  USING (
    public.is_admin(auth.uid())
    OR status IN ('approved','open','partially_funded','fully_funded','acquisition_in_progress','operating','exited')
  );

CREATE OR REPLACE FUNCTION public.prevent_group_pool_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN RETURN NEW; END IF;
  NEW.status := OLD.status;
  NEW.admin_notes := OLD.admin_notes;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_group_pool_privileged_updates ON public.group_pools;
CREATE TRIGGER trg_prevent_group_pool_privileged_updates
  BEFORE UPDATE ON public.group_pools
  FOR EACH ROW EXECUTE FUNCTION public.prevent_group_pool_privileged_updates();

CREATE OR REPLACE FUNCTION public.prevent_pool_member_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN RETURN NEW; END IF;
  NEW.status := OLD.status;
  NEW.is_founder := OLD.is_founder;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_pool_member_privileged_updates ON public.pool_members;
CREATE TRIGGER trg_prevent_pool_member_privileged_updates
  BEFORE UPDATE ON public.pool_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_pool_member_privileged_updates();
