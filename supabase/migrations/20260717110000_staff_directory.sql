-- Staff directory.
--
-- user_roles answers "what may this account do"; it does not answer "who is
-- this person and what is their job". This table holds the human record —
-- position, department, contact, status — and points at the auth account.
-- Permission roles stay in user_roles: position is a job title, not a grant.

-- Editorial and growth roles the directory can grant.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_author';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seo_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social_media_manager';

CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null only in the window between inviting someone and the account existing.
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  whatsapp_number text,
  position text,
  department text,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended')),
  started_on date,
  notes text,
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  invite_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One staff record per person. Matching is case-insensitive so an invite to
-- Aisha@ and a sign-up as aisha@ cannot become two records.
CREATE UNIQUE INDEX IF NOT EXISTS staff_members_email_key_idx
  ON public.staff_members (public.crm_email_key(email));
CREATE INDEX IF NOT EXISTS staff_members_status_idx ON public.staff_members(status);
CREATE INDEX IF NOT EXISTS staff_members_department_idx ON public.staff_members(department);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT ALL ON public.staff_members TO service_role;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Only platform admins manage the directory.
DROP POLICY IF EXISTS staff_admin_all ON public.staff_members;
CREATE POLICY staff_admin_all ON public.staff_members FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
-- A staff member may read their own record (name, position, department).
DROP POLICY IF EXISTS staff_read_own ON public.staff_members;
CREATE POLICY staff_read_own ON public.staff_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS staff_members_updated ON public.staff_members;
CREATE TRIGGER staff_members_updated BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- When an invited person completes sign-up, bind their new auth account to the
-- staff record and mark it active. Matching on the normalised email is what
-- makes the invite -> sign-up handoff work without a separate token table.
CREATE OR REPLACE FUNCTION public.link_staff_member_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.staff_members
  SET user_id = NEW.id,
      status = CASE WHEN status = 'invited' THEN 'active' ELSE status END,
      invite_accepted_at = COALESCE(invite_accepted_at, now())
  WHERE user_id IS NULL
    AND public.crm_email_key(email) = public.crm_email_key(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_staff_member_on_signup ON auth.users;
CREATE TRIGGER link_staff_member_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_staff_member_on_signup();

-- Backfill: everyone who already holds a staff-side role becomes a directory
-- entry, so the page is not empty on first load.
INSERT INTO public.staff_members (user_id, full_name, email, phone, status, started_on)
SELECT DISTINCT ON (ur.user_id)
  ur.user_id,
  COALESCE(NULLIF(p.full_name, ''), split_part(p.email, '@', 1)),
  p.email,
  p.phone,
  'active',
  ur.created_at::date
FROM public.user_roles ur
JOIN public.profiles p ON p.user_id = ur.user_id
-- role::text, not the enum: the labels added at the top of this migration
-- cannot be resolved as enum literals until it commits.
WHERE ur.role::text IN
    ('super_admin', 'admin', 'manager', 'crm_manager', 'sales_agent',
     'property_manager', 'finance_officer', 'compliance_officer',
     'content_manager', 'content_editor', 'content_author',
     'seo_manager', 'social_media_manager')
  AND NOT EXISTS (SELECT 1 FROM public.staff_members s WHERE s.user_id = ur.user_id)
ON CONFLICT DO NOTHING;
