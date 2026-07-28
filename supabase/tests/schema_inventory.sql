\set ON_ERROR_STOP on

DO $$
DECLARE
  public_tables integer;
  policies integer;
  public_functions integer;
  public_triggers integer;
  project_auth_triggers integer;
  buckets integer;
  bucket_policies integer;
  missing_rls text;
BEGIN
  SELECT count(*) INTO public_tables
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  SELECT count(*) INTO policies
  FROM pg_policies
  WHERE schemaname IN ('public', 'storage');

  SELECT count(*) INTO public_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public';

  SELECT count(*) INTO public_triggers
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal AND n.nspname = 'public';

  SELECT count(*) INTO project_auth_triggers
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND n.nspname = 'auth'
    AND t.tgname IN (
      'link_staff_member_on_signup',
      'mark_staff_signed_in',
      'on_auth_user_claim_pool_invitations',
      'on_auth_user_created',
      'on_auth_user_created_affiliate'
    );

  SELECT count(*) INTO buckets FROM storage.buckets;
  SELECT count(*) INTO bucket_policies
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects';

  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO missing_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

  IF public_tables <> 79 THEN
    RAISE EXCEPTION 'Expected 79 public tables, found %', public_tables;
  END IF;
  IF policies <> 199 THEN
    RAISE EXCEPTION 'Expected 199 public/storage policies, found %', policies;
  END IF;
  IF public_functions <> 82 THEN
    RAISE EXCEPTION 'Expected 82 public functions, found %', public_functions;
  END IF;
  IF public_triggers + project_auth_triggers <> 78 THEN
    RAISE EXCEPTION 'Expected 78 project triggers, found % public + % auth',
      public_triggers, project_auth_triggers;
  END IF;
  IF buckets <> 6 THEN
    RAISE EXCEPTION 'Expected 6 storage buckets, found %', buckets;
  END IF;
  IF bucket_policies <> 18 THEN
    RAISE EXCEPTION 'Expected 18 storage object policies, found %', bucket_policies;
  END IF;
  IF missing_rls IS NOT NULL THEN
    RAISE EXCEPTION 'Public tables missing RLS: %', missing_rls;
  END IF;

  RAISE NOTICE
    'PASS: 79 tables, 199 policies, 82 functions, 78 triggers, 6 buckets, 18 storage policies, all public tables RLS-enabled';
END
$$;
