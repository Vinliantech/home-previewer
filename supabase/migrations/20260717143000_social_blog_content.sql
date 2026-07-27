-- Kay-Steph Social Blog and Content Publishing System
-- Shared publishing, media, SEO, newsletter, social and analytics data.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_author';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seo_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social_media_manager';

DO $$ BEGIN
  CREATE TYPE public.content_post_status AS ENUM (
    'draft', 'pending_review', 'scheduled', 'published', 'unpublished', 'archived', 'trashed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_post_format AS ENUM (
    'standard', 'image_led', 'video', 'embedded_video', 'market_report',
    'property_guide', 'investment_guide', 'company_announcement', 'event_recap',
    'interview', 'press_release'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_media_status AS ENUM ('active', 'archived', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_media_visibility AS ENUM ('public', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_social_status AS ENUM (
    'draft', 'ready', 'scheduled', 'published', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_comment_status AS ENUM ('pending', 'approved', 'spam', 'trashed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.is_content_member(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_uid) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN (
        'content_manager', 'content_editor', 'content_author',
        'seo_manager', 'social_media_manager'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.content_can_publish(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_uid) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN ('content_manager', 'content_editor')
  )
$$;

CREATE OR REPLACE FUNCTION public.content_can_manage_seo(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_uid) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN ('content_manager', 'content_editor', 'seo_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.content_can_manage_social(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_uid) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role::text IN ('content_manager', 'social_media_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.content_can_manage_team(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_uid) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role::text = 'content_manager'
  )
$$;

CREATE TABLE IF NOT EXISTS public.content_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  profile_image_url text,
  job_title text,
  biography text,
  email text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  featured_image_url text,
  seo_title text,
  seo_description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'blog-media',
  storage_path text,
  public_url text,
  original_file_name text,
  file_name text NOT NULL,
  title text,
  alt_text text,
  caption text,
  description text,
  mime_type text,
  file_type text NOT NULL DEFAULT 'image',
  file_size_bytes bigint,
  width integer,
  height integer,
  duration_seconds integer,
  source_type text NOT NULL DEFAULT 'upload',
  source_url text,
  embed_url text,
  poster_image_url text,
  transcript text,
  subtitle_path text,
  responsive_variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  optimization_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility public.content_media_visibility NOT NULL DEFAULT 'public',
  status public.content_media_status NOT NULL DEFAULT 'active',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  rendered_html text,
  featured_image_url text,
  featured_media_id uuid REFERENCES public.blog_media(id) ON DELETE SET NULL,
  featured_video_url text,
  video_caption text,
  video_transcript text,
  poster_image_url text,
  format public.content_post_format NOT NULL DEFAULT 'standard',
  author_id uuid REFERENCES public.content_authors(id) ON DELETE SET NULL,
  primary_category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status public.content_post_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_at timestamptz,
  last_reviewed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reading_time_minutes integer NOT NULL DEFAULT 1 CHECK (reading_time_minutes > 0),
  related_property_id uuid,
  related_investment_id uuid,
  cta_label text,
  cta_url text,
  cta_style text NOT NULL DEFAULT 'primary',
  seo_title text,
  meta_description text,
  focus_keyword text,
  secondary_keywords text[] NOT NULL DEFAULT '{}',
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  twitter_title text,
  twitter_description text,
  twitter_image_url text,
  robots_index boolean NOT NULL DEFAULT true,
  robots_follow boolean NOT NULL DEFAULT true,
  include_in_sitemap boolean NOT NULL DEFAULT true,
  facebook_caption text,
  instagram_caption text,
  linkedin_caption text,
  twitter_caption text,
  whatsapp_share_text text,
  social_image_url text,
  social_video_url text,
  social_scheduled_at timestamptz,
  comments_enabled boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  view_count bigint NOT NULL DEFAULT 0,
  unique_visitor_count bigint NOT NULL DEFAULT 0,
  average_read_seconds integer NOT NULL DEFAULT 0,
  video_play_count bigint NOT NULL DEFAULT 0,
  social_share_count bigint NOT NULL DEFAULT 0,
  lead_count bigint NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(focus_keyword, ''))
  ) STORED
);

CREATE TABLE IF NOT EXISTS public.blog_post_categories (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.blog_post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  title text NOT NULL,
  excerpt text,
  content_blocks jsonb NOT NULL,
  seo_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  change_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, revision_number)
);

CREATE TABLE IF NOT EXISTS public.blog_media_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.blog_media(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  usage_type text NOT NULL DEFAULT 'content',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, post_id, usage_type)
);

CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  body text NOT NULL,
  status public.content_comment_status NOT NULL DEFAULT 'pending',
  consent_given boolean NOT NULL DEFAULT false,
  ip_hash text,
  user_agent text,
  moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text NOT NULL,
  interests text[] NOT NULL DEFAULT '{}',
  consent_given boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  consent_source text,
  source_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  source_category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  campaign_source text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key
  ON public.newsletter_subscribers (lower(email));

CREATE TABLE IF NOT EXISTS public.blog_engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'view', 'read_progress', 'video_play', 'social_share', 'newsletter_signup',
    'report_download', 'investment_pack_request', 'consultation_booking',
    'event_registration', 'property_enquiry', 'cta_click'
  )),
  visitor_id text,
  session_id text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  source_url text,
  referrer text,
  campaign_source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'whatsapp')),
  caption text NOT NULL,
  media_url text,
  publish_url text,
  provider_reference text,
  status public.content_social_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  last_error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

CREATE TABLE IF NOT EXISTS public.content_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON public.blog_posts(author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts(primary_category_id, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_search_idx ON public.blog_posts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS blog_media_type_idx ON public.blog_media(file_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS blog_engagement_post_idx ON public.blog_engagement_events(post_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS blog_engagement_type_idx ON public.blog_engagement_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON public.blog_comments(post_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS social_publications_schedule_idx ON public.social_publications(status, scheduled_at);

CREATE OR REPLACE FUNCTION public.content_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.content_enforce_post_workflow() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF NEW.status::text IN ('scheduled', 'published')
      AND NOT public.content_can_publish(auth.uid()) THEN
      RAISE EXCEPTION 'Only content editors or managers may schedule or publish posts';
    END IF;
    IF jsonb_path_exists(NEW.content_blocks, '$[*] ? (@.type == "custom_html")')
      AND NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Custom HTML blocks require a platform administrator';
    END IF;
  END IF;
  IF NEW.status::text = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  IF NEW.status::text = 'scheduled' AND NEW.scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Scheduled posts require a scheduled date and time';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.content_capture_post_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_revision integer;
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title
    OR OLD.excerpt IS DISTINCT FROM NEW.excerpt
    OR OLD.content_blocks IS DISTINCT FROM NEW.content_blocks
    OR OLD.seo_title IS DISTINCT FROM NEW.seo_title
    OR OLD.meta_description IS DISTINCT FROM NEW.meta_description THEN
    SELECT coalesce(max(revision_number), 0) + 1 INTO next_revision
    FROM public.blog_post_revisions WHERE post_id = OLD.id;
    INSERT INTO public.blog_post_revisions (
      post_id, revision_number, title, excerpt, content_blocks, seo_snapshot, changed_by
    ) VALUES (
      OLD.id, next_revision, OLD.title, OLD.excerpt, OLD.content_blocks,
      jsonb_build_object(
        'seo_title', OLD.seo_title,
        'meta_description', OLD.meta_description,
        'focus_keyword', OLD.focus_keyword,
        'canonical_url', OLD.canonical_url
      ), auth.uid()
    );
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.content_audit_post_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.content_audit_logs(actor_id, action, entity_type, entity_id, old_values)
    VALUES (auth.uid(), lower(TG_OP), 'blog_post', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  INSERT INTO public.content_audit_logs(actor_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(), lower(TG_OP), 'blog_post', NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.publish_scheduled_content() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE published_count integer;
BEGIN
  UPDATE public.blog_posts
  SET status = 'published', published_at = coalesce(published_at, scheduled_at, now()), updated_at = now()
  WHERE status = 'scheduled' AND scheduled_at <= now();
  GET DIAGNOSTICS published_count = ROW_COUNT;
  RETURN published_count;
END $$;

CREATE OR REPLACE FUNCTION public.increment_blog_post_view(_post_id uuid, _unique boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1,
      unique_visitor_count = unique_visitor_count + CASE WHEN _unique THEN 1 ELSE 0 END
  WHERE id = _post_id AND status = 'published';
END $$;

DROP TRIGGER IF EXISTS content_authors_touch ON public.content_authors;
CREATE TRIGGER content_authors_touch BEFORE UPDATE ON public.content_authors
FOR EACH ROW EXECUTE FUNCTION public.content_touch_updated_at();
DROP TRIGGER IF EXISTS blog_categories_touch ON public.blog_categories;
CREATE TRIGGER blog_categories_touch BEFORE UPDATE ON public.blog_categories
FOR EACH ROW EXECUTE FUNCTION public.content_touch_updated_at();
DROP TRIGGER IF EXISTS blog_tags_touch ON public.blog_tags;
CREATE TRIGGER blog_tags_touch BEFORE UPDATE ON public.blog_tags
FOR EACH ROW EXECUTE FUNCTION public.content_touch_updated_at();
DROP TRIGGER IF EXISTS blog_media_touch ON public.blog_media;
CREATE TRIGGER blog_media_touch BEFORE UPDATE ON public.blog_media
FOR EACH ROW EXECUTE FUNCTION public.content_touch_updated_at();
DROP TRIGGER IF EXISTS blog_posts_workflow ON public.blog_posts;
CREATE TRIGGER blog_posts_workflow BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.content_enforce_post_workflow();
DROP TRIGGER IF EXISTS blog_posts_revision ON public.blog_posts;
CREATE TRIGGER blog_posts_revision AFTER UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.content_capture_post_revision();
DROP TRIGGER IF EXISTS blog_posts_audit ON public.blog_posts;
CREATE TRIGGER blog_posts_audit AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.content_audit_post_change();
DROP TRIGGER IF EXISTS newsletter_subscribers_touch ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_touch BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.content_touch_updated_at();
DROP TRIGGER IF EXISTS social_publications_touch ON public.social_publications;
CREATE TRIGGER social_publications_touch BEFORE UPDATE ON public.social_publications
FOR EACH ROW EXECUTE FUNCTION public.content_touch_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-media', 'blog-media', true, 262144000,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-private', 'content-private', false, 262144000,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.content_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_authors_public_read ON public.content_authors FOR SELECT TO anon, authenticated
USING (is_active OR public.is_content_member(auth.uid()));
CREATE POLICY content_authors_member_manage ON public.content_authors FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY blog_categories_public_read ON public.blog_categories FOR SELECT TO anon, authenticated
USING (is_active OR public.is_content_member(auth.uid()));
CREATE POLICY blog_categories_member_manage ON public.blog_categories FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY blog_tags_public_read ON public.blog_tags FOR SELECT TO anon, authenticated
USING (is_active OR public.is_content_member(auth.uid()));
CREATE POLICY blog_tags_member_manage ON public.blog_tags FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY blog_media_public_read ON public.blog_media FOR SELECT TO anon, authenticated
USING ((visibility = 'public' AND status = 'active') OR public.is_content_member(auth.uid()));
CREATE POLICY blog_media_member_manage ON public.blog_media FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY blog_posts_public_read ON public.blog_posts FOR SELECT TO anon, authenticated
USING (
  (status = 'published' AND published_at <= now())
  OR public.is_content_member(auth.uid())
);
CREATE POLICY blog_posts_member_insert ON public.blog_posts FOR INSERT TO authenticated
WITH CHECK (public.is_content_member(auth.uid()) AND (created_by IS NULL OR created_by = auth.uid()));
CREATE POLICY blog_posts_member_update ON public.blog_posts FOR UPDATE TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));
CREATE POLICY blog_posts_manager_delete ON public.blog_posts FOR DELETE TO authenticated
USING (public.content_can_manage_team(auth.uid()));

CREATE POLICY blog_post_categories_public_read ON public.blog_post_categories FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.blog_posts p WHERE p.id = post_id
    AND (p.status = 'published' OR public.is_content_member(auth.uid()))
));
CREATE POLICY blog_post_categories_member_manage ON public.blog_post_categories FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY blog_post_tags_public_read ON public.blog_post_tags FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.blog_posts p WHERE p.id = post_id
    AND (p.status = 'published' OR public.is_content_member(auth.uid()))
));
CREATE POLICY blog_post_tags_member_manage ON public.blog_post_tags FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY blog_revisions_member_read ON public.blog_post_revisions FOR SELECT TO authenticated
USING (public.is_content_member(auth.uid()));
CREATE POLICY blog_media_usage_public_read ON public.blog_media_usage FOR SELECT TO anon, authenticated
USING (post_id IS NULL OR EXISTS (
  SELECT 1 FROM public.blog_posts p WHERE p.id = post_id
    AND (p.status = 'published' OR public.is_content_member(auth.uid()))
));
CREATE POLICY blog_media_usage_member_manage ON public.blog_media_usage FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY blog_comments_public_read ON public.blog_comments FOR SELECT TO anon, authenticated
USING (status = 'approved' OR public.is_content_member(auth.uid()));
CREATE POLICY blog_comments_public_insert ON public.blog_comments FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending' AND consent_given = true
  AND length(trim(author_name)) BETWEEN 2 AND 120
  AND length(trim(body)) BETWEEN 2 AND 5000
);
CREATE POLICY blog_comments_member_manage ON public.blog_comments FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));

CREATE POLICY newsletter_member_manage ON public.newsletter_subscribers FOR ALL TO authenticated
USING (public.is_content_member(auth.uid())) WITH CHECK (public.is_content_member(auth.uid()));
CREATE POLICY blog_engagement_member_read ON public.blog_engagement_events FOR SELECT TO authenticated
USING (public.is_content_member(auth.uid()));

CREATE POLICY social_publications_member_read ON public.social_publications FOR SELECT TO authenticated
USING (public.is_content_member(auth.uid()));
CREATE POLICY social_publications_manager_manage ON public.social_publications FOR ALL TO authenticated
USING (public.content_can_manage_social(auth.uid()))
WITH CHECK (public.content_can_manage_social(auth.uid()));

CREATE POLICY content_settings_member_read ON public.content_settings FOR SELECT TO authenticated
USING (public.is_content_member(auth.uid()));
CREATE POLICY content_settings_manager_manage ON public.content_settings FOR ALL TO authenticated
USING (public.content_can_manage_team(auth.uid()))
WITH CHECK (public.content_can_manage_team(auth.uid()));
CREATE POLICY content_audit_manager_read ON public.content_audit_logs FOR SELECT TO authenticated
USING (public.content_can_manage_team(auth.uid()));

CREATE POLICY storage_blog_media_public_read ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'blog-media');
CREATE POLICY storage_blog_media_member_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-media' AND public.is_content_member(auth.uid()));
CREATE POLICY storage_blog_media_member_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blog-media' AND public.is_content_member(auth.uid()))
WITH CHECK (bucket_id = 'blog-media' AND public.is_content_member(auth.uid()));
CREATE POLICY storage_blog_media_member_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-media' AND public.is_content_member(auth.uid()));
CREATE POLICY storage_content_private_member_all ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'content-private' AND public.is_content_member(auth.uid()))
WITH CHECK (bucket_id = 'content-private' AND public.is_content_member(auth.uid()));

GRANT SELECT ON public.content_authors, public.blog_categories, public.blog_tags,
  public.blog_media, public.blog_posts, public.blog_post_categories, public.blog_post_tags,
  public.blog_media_usage, public.blog_comments TO anon, authenticated;
GRANT INSERT ON public.blog_comments TO anon, authenticated;
GRANT ALL ON public.content_authors, public.blog_categories, public.blog_tags,
  public.blog_media, public.blog_posts, public.blog_post_categories, public.blog_post_tags,
  public.blog_post_revisions, public.blog_media_usage, public.blog_comments,
  public.newsletter_subscribers, public.blog_engagement_events, public.social_publications,
  public.content_settings, public.content_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_post_view(uuid, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_content_member(uuid), public.content_can_publish(uuid),
  public.content_can_manage_seo(uuid), public.content_can_manage_social(uuid),
  public.content_can_manage_team(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.publish_scheduled_content() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_content() TO service_role;

INSERT INTO public.blog_categories(name, slug, description, sort_order) VALUES
  ('Property Investment', 'property-investment', 'Property acquisition, ownership and portfolio strategy.', 10),
  ('Full Purchase', 'full-purchase', 'Guides for outright property buyers.', 20),
  ('Group Buy', 'group-buy', 'Structured collective property purchase opportunities.', 30),
  ('Property Tokenization', 'property-tokenization', 'Digital participation and tokenized real-estate education.', 40),
  ('Fractional Ownership', 'fractional-ownership', 'Co-ownership structures, SPVs, returns and exits.', 50),
  ('Market Insights', 'market-insights', 'Research and analysis from Abuja, Lagos and wider Nigeria.', 60),
  ('Diaspora Investment', 'diaspora-investment', 'Remote buying, compliance and investor guidance.', 70),
  ('Investment Education', 'investment-education', 'Clear explanations for first-time and experienced investors.', 80),
  ('Company News', 'company-news', 'Kay-Steph announcements, milestones and press updates.', 90),
  ('Events and Workshops', 'events-workshops', 'Webinars, inspections, workshops and event recaps.', 100)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.content_settings(key, value, description) VALUES
  ('blog_identity', '{"publication_name":"Kay-Steph Journal","tagline":"Property intelligence for confident decisions"}', 'Public blog identity'),
  ('newsletter', '{"enabled":true,"double_opt_in":false,"default_interests":["Property opportunities","Market reports","Group Buy","Tokenized properties","Abuja property updates","Diaspora investment","Events and workshops"]}', 'Newsletter defaults'),
  ('seo', '{"title_template":"%s | Kay-Steph Journal","default_robots":"index,follow","include_schema":true,"include_sitemap":true}', 'Default SEO behavior'),
  ('comments', '{"enabled":false,"moderation_required":true}', 'Public comment defaults'),
  ('social', '{"auto_publish":false,"approval_required":true}', 'Social publishing defaults')
ON CONFLICT (key) DO NOTHING;
