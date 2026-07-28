-- Retained from origin/main. This is intentionally a post-baseline operation:
-- it asks PostgREST to reload its schema cache after the reconciled workshop
-- registration migration.
NOTIFY pgrst, 'reload schema';
