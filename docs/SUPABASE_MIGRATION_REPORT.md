# Supabase migration report

Prepared for project `ufhwetpowavyryiortlm` at
`https://ufhwetpowavyryiortlm.supabase.co`.

## Executive status

The checked-out branch now has a reproducible, chronological database schema:

- 36 migration files
- 79 public tables
- 199 RLS policies: 181 on public tables and 18 on `storage.objects`
- 82 public functions
- 78 non-system triggers, including five on `auth.users`
- six Storage buckets
- 23 public enum types
- no public views
- no custom extension requirement beyond Supabase/PostgreSQL defaults
- RLS enabled on all 79 public tables

Every migration was parsed as PostgreSQL SQL and then executed, in filename
order, against a fresh PostgreSQL-compatible database with the Supabase Auth,
Storage, roles, and Realtime publication represented. All 36 completed. The
repository also includes `supabase/tests/schema_inventory.sql` for the official
local Supabase Docker stack.

Validation on 2026-07-28 produced:

```text
36 migrations; 79 tables; 199 policies; 82 functions; 78 triggers;
6 buckets; 23 enums; 0 public tables missing RLS
```

Docker, the Supabase CLI, Deno, and `psql` were not installed in the authoring
workspace. Consequently, the official `supabase db reset --local` and
`supabase functions serve` checks remain mandatory release gates in the
cutover checklist. No remote project was linked or modified during this work.

This validates the checked-out migration sequence. A final
`supabase db push --dry-run` against the real target is still required before
the first remote write.

## Changes made

- Changed `supabase/config.toml` from the old project ref
  `gwbkmmrrfpvkybrsxgro` to `ufhwetpowavyryiortlm`.
- Added the production Auth site URL, redirect allow-list, and Google OAuth
  configuration using environment-variable references.
- Reduced `.env.example` to public `VITE_` build values only.
- Fixed the reserved `position` output-column name in
  `20260727010000_sales_agents_from_staff.sql`.
- Added `20260728000000_storage_bucket_completeness.sql`, which makes the
  previously dashboard-only `avatars` and `client-documents` buckets
  reproducible.
- Added an intentionally empty, idempotent `supabase/seed.sql`.
- Reconciled all four newer `origin/main` migrations without removing history.
- Added seven secured Supabase Edge Functions and removed the old Node server
  runtime/service client.

## Migration-history findings

The checked-out 36-file sequence is internally complete and executable after
the fixes above. It is not, however, a backup of the Lovable production
project. Migration files do not contain:

- live table rows;
- `auth.users`, identities, sessions, or password hashes;
- uploaded Storage objects;
- Auth SMTP/templates, CAPTCHA, MFA, password-policy, or all provider settings;
- deployed Edge Functions and their secrets;
- the old project's Realtime/dashboard settings.

Git history also contains a retired
`20260715232348_723e9ef5-c144-4ea9-9fa6-bea4298056a2.sql` migration for a
different `client_documents`/versioning subsystem. The current application
uses the newer `documents` table and `client-documents` bucket, so restoring
that deleted subsystem would create a second, incompatible document model.

The four newer migrations from `origin/main` are now retained and reconciled:

- `20260728003610_881dcfe6-269c-4536-aed6-3a0e4feaf973.sql`
- `20260728003915_3ef132ec-7585-4c89-a5e7-bcdc8afad92b.sql`
- `20260728111131_5088d7ea-15ba-4a07-b4f1-7d6271d31a14.sql`
- `20260728112106_c107c8d1-0812-4922-8705-25dee58e14c8.sql`

- `20260728003610...` is an idempotent post-baseline workshop policy
  reconciliation. Its duplicate table DDL is already incorporated in
  `20260727020000`.
- `20260728003915...` is retained unchanged as a post-baseline PostgREST schema
  reload.
- `20260728111131...` is rewritten as idempotent permission hardening. Controls
  already present in the consolidated baseline are documented rather than
  duplicated.
- `20260728112106...` is retained as post-baseline property visibility and
  column-privilege hardening using the current enums. It does not create the
  duplicate functions/triggers from the conflicting version.

The complete 36-file chain was rerun after reconciliation and retains the
exact required inventory.

The generated `src/integrations/supabase/types.ts` is also behind the migration
history. It represents 48 tables rather than the resulting 79. Regenerate it
from the new linked project immediately after `db push`.

## Database inventory

### Tables

Identity, access, and staff:

`profiles`, `user_roles`, `affiliate_profiles`, `staff_members`,
`staff_change_requests`, `sales_agents`

Affiliate and CRM:

`client_leads`, `commissions`, `payout_requests`, `training_videos`, `leads`,
`lead_status_history`, `lead_activities`, `lead_capture_failures`,
`lead_interests`, `follow_up_tasks`, `opportunities`, `assignment_rules`,
`crm_notifications`, `crm_events`, `event_registrations`, `email_templates`,
`automation_sequences`, `automation_steps`, `automation_enrollments`,
`email_deliveries`, `crm_integrations`, `crm_settings`, `crm_audit_logs`,
`fb_lead_sources`, `fb_campaigns`, `fb_ads`, `workshop_registrations`,
`integration_secrets`

Investment and group buying:

`spvs`, `tokenized_properties`, `investor_profiles`, `investments`,
`property_documents`, `property_tokens`, `property_valuations`,
`investment_certificates`, `investor_wallets`, `wallet_transactions`,
`withdrawal_requests`, `exit_requests`, `rental_distributions`,
`rental_payouts`, `investor_notifications`, `audit_logs`, `group_pools`,
`pool_members`

Estate and client operations:

`available_properties`, `estates`, `plots`, `plot_allocations`,
`client_applications`, `reservations`, `payment_records`,
`payment_requirements`, `company_account`, `documents`, `support_tickets`,
`ticket_messages`

Content and publishing:

`content_authors`, `blog_categories`, `blog_tags`, `blog_media`, `blog_posts`,
`blog_post_categories`, `blog_post_tags`, `blog_post_revisions`,
`blog_media_usage`, `blog_comments`, `newsletter_subscribers`,
`blog_engagement_events`, `social_publications`, `content_settings`,
`content_audit_logs`

### Policies

All 79 public tables have RLS enabled. Policy counts by relation are:

```text
affiliate_profiles 4; assignment_rules 2; audit_logs 1;
automation_enrollments 2; automation_sequences 2; automation_steps 2;
available_properties 2; blog_categories 2; blog_comments 3;
blog_engagement_events 1; blog_media 2; blog_media_usage 2;
blog_post_categories 2; blog_post_revisions 1; blog_post_tags 2;
blog_posts 4; blog_tags 2; client_applications 3; client_leads 3;
commissions 2; company_account 2; content_audit_logs 1; content_authors 2;
content_settings 2; crm_audit_logs 1; crm_events 2; crm_integrations 1;
crm_notifications 1; crm_settings 2; documents 6; email_deliveries 2;
email_templates 2; estates 2; event_registrations 2; exit_requests 3;
fb_ads 2; fb_campaigns 2; fb_lead_sources 1; follow_up_tasks 3;
group_pools 3; investment_certificates 2; investments 4;
investor_notifications 3; investor_profiles 5; investor_wallets 2;
lead_activities 3; lead_capture_failures 1; lead_interests 2;
lead_status_history 3; leads 3; newsletter_subscribers 1; opportunities 3;
payment_records 2; payment_requirements 2; payout_requests 3;
plot_allocations 2; plots 2; pool_members 3; profiles 3;
property_documents 3; property_tokens 2; property_valuations 3;
rental_distributions 2; rental_payouts 4; reservations 3; sales_agents 3;
social_publications 2; spvs 2; staff_change_requests 2; staff_members 3;
support_tickets 3; ticket_messages 3; tokenized_properties 2;
training_videos 2; user_roles 1; wallet_transactions 2;
withdrawal_requests 3; workshop_registrations 1; storage.objects 18.
```

The policies cover own-record access, public published/catalogue reads,
staff/CRM roles, content roles, administrator operations, investor ownership,
pool membership, and private Storage-folder ownership.

### Functions

The final 82-function API is:

`admin_approve_investment`, `admin_approve_withdrawal`,
`admin_assign_reservation_plot`, `admin_mark_rental_payout_paid`,
`admin_record_property_valuation`, `admin_record_rental_distribution`,
`admin_reject_investment`, `admin_reject_withdrawal`,
`admin_review_investor_kyc`, `admin_review_pool`,
`admin_set_pool_member_status`, `admin_update_exit_request`,
`after_investment_approved`, `approve_staff_member`,
`assert_role_change_allowed`, `audit_sensitive_change`,
`claim_pool_invitations`, `content_audit_post_change`,
`content_can_manage_seo`, `content_can_manage_social`,
`content_can_manage_team`, `content_can_publish`,
`content_capture_post_revision`, `content_enforce_post_workflow`,
`content_touch_updated_at`, `create_group_pool`,
`create_sales_agent_from_staff`, `crm_email_key`, `crm_last_capture_at`,
`crm_phone_key`, `ensure_investor_wallet`, `find_lead_by_contact`,
`generate_certificate_number`, `get_admin_summary`,
`get_affiliate_earnings`, `get_affiliate_leaderboard`,
`get_estate_ops_summary`, `get_pool_members`, `get_pool_summaries`,
`get_public_property_funding`, `grant_registered_staff_role`,
`grant_user_role`, `guard_document_review`, `guard_profile_admin_fields`,
`handle_new_affiliate`, `handle_new_user`, `has_role`,
`increment_blog_post_view`, `integration_secret_status`,
`invite_pool_member`, `is_admin`, `is_content_member`, `is_crm_admin`,
`is_pool_founder`, `is_pool_member`, `is_sales_agent`, `join_group_pool`,
`link_staff_member_on_signup`, `list_assignable_staff`, `log_admin_action`,
`log_crm_lead_audit`, `log_lead_status_change`, `mark_staff_signed_in`,
`on_investment_approved`, `protect_affiliate_admin_fields`,
`publish_scheduled_content`, `recalc_property_funding`,
`recommend_crm_lead_grade`, `request_property_token_exit`,
`request_staff_change`, `require_affiliate_supervisor`,
`review_client_verification`, `revoke_user_role`,
`set_integration_secret`, `submit_investment_payment_evidence`,
`submit_investor_kyc`, `sync_client_details_from_profile`,
`sync_sales_agent_from_staff`, `sync_shared_property_catalogue`,
`update_my_staff_contact`, `update_updated_at_column`,
`verify_investment_certificate`.

### Triggers, views, and extensions

There are 78 application triggers. Five run on `auth.users`:

- `on_auth_user_created`
- `on_auth_user_created_affiliate`
- `link_staff_member_on_signup`
- `mark_staff_signed_in`
- `on_auth_user_claim_pool_invitations`

The remaining triggers maintain timestamps, audit records, investment state,
catalogue synchronization, CRM grading/history, content revisions/workflow,
document review, affiliate supervision, and staff/sales-agent synchronization.

There are no views in the consolidated schema. There are no explicit
`CREATE EXTENSION` statements and no application function requires a custom
extension. `gen_random_uuid()` is available on current Supabase PostgreSQL.

### Storage buckets

| Bucket             | Public |   Limit | MIME types                           |
| ------------------ | -----: | ------: | ------------------------------------ |
| `avatars`          |     no |   5 MiB | JPEG, PNG, WebP, GIF                 |
| `blog-media`       |    yes | 250 MiB | configured media/document allow-list |
| `client-documents` |     no |  25 MiB | unrestricted; RLS controls paths     |
| `content-private`  |     no | 250 MiB | configured media/document allow-list |
| `investor-kyc`     |     no |   5 MiB | JPEG, PNG, WebP, PDF                 |
| `payment-evidence` |     no |   5 MiB | JPEG, PNG, WebP, PDF                 |

Bucket definitions and object policies are now present, but the actual files
must be copied from the source project separately.

## Auth configuration

The application uses:

- email/password sign-up and sign-in;
- email confirmation/redirect flows to `/portfolio` and `/affiliate`;
- admin/staff invite and password-recovery links;
- Google OAuth on the affiliate login page.

`config.toml` now sets:

- Site URL: `https://kaystephgroup.com`
- production redirects for the apex and `www` domains
- local redirects for `http://localhost:5173`
- Google OAuth using environment variables

Before `config push`, create Google OAuth credentials and add this authorized
redirect URI in Google Cloud:

```text
https://ufhwetpowavyryiortlm.supabase.co/auth/v1/callback
```

The repository does not record the old project's email-confirmation choice,
SMTP server, email templates, CAPTCHA, MFA, or password policy. Review and set
those in the new Supabase Dashboard. Existing Auth users and password hashes
require a source database backup/export; schema migrations cannot recreate
them. Existing sessions will be invalid because the new project has a
different JWT signing key, so migrated users should sign in again.

## Exact schema deployment commands

Run from the repository root. Do not put passwords or keys in Git.

```bash
npm install
npx supabase@latest login

export SUPABASE_DB_PASSWORD='NEW_PROJECT_DATABASE_PASSWORD'
npx supabase@latest link \
  --project-ref ufhwetpowavyryiortlm \
  --password "$SUPABASE_DB_PASSWORD"

npx supabase@latest migration list --linked
npx supabase@latest db push --linked --dry-run
npx supabase@latest db push --linked
```

Push the Auth URL/provider configuration only after supplying the Google
credentials referenced by `config.toml`:

```bash
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID='GOOGLE_CLIENT_ID'
export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET='GOOGLE_CLIENT_SECRET'
npx supabase@latest config push
```

Regenerate the TypeScript database types after the migrations are live:

```bash
npx supabase@latest gen types typescript \
  --linked \
  --schema public \
  > src/integrations/supabase/types.ts
```

No meaningful seed rows exist, so `--include-seed` is optional and currently
does nothing:

```bash
npx supabase@latest db push --linked --include-seed
```

Do not run `db reset --linked`; it drops user-created objects on the remote
database.

## Data, Auth-user, and Storage migration

An exact live-data command cannot be produced from this repository alone. It
requires one of:

- a full source-project backup;
- source database connection credentials; or
- exports of the source tables, Auth schema, and Storage files.

A full backup can preserve Auth users and password hashes. Supabase CLI
`db dump` intentionally excludes the managed `auth` and `storage` schemas, so
it is not a complete user migration by itself. Prefer Supabase's project clone
or full backup/restore workflow when the source account permits it.

For Storage files exported to local bucket directories, upload each bucket
after the schema push:

```bash
npx supabase@latest storage cp ./storage/avatars ss:///avatars -r --experimental
npx supabase@latest storage cp ./storage/blog-media ss:///blog-media -r --experimental
npx supabase@latest storage cp ./storage/client-documents ss:///client-documents -r --experimental
npx supabase@latest storage cp ./storage/content-private ss:///content-private -r --experimental
npx supabase@latest storage cp ./storage/investor-kyc ss:///investor-kyc -r --experimental
npx supabase@latest storage cp ./storage/payment-evidence ss:///payment-evidence -r --experimental
```

## Application compatibility and production readiness

Browser-side Supabase Auth, RLS-protected CRUD, RPC calls, and Storage use
environment variables rather than a hard-coded project URL, so they can target
the new project after these production build variables are set:

```env
VITE_SUPABASE_PROJECT_ID=ufhwetpowavyryiortlm
VITE_SUPABASE_URL=https://ufhwetpowavyryiortlm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_PROJECT_PUBLISHABLE_KEY
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `VITE_` variable or upload it
to `public_html`.

The static build contains `dist/index.html`, `dist/assets/`,
`dist/.htaccess`, and `dist/sitemap.xml`. Privileged workflows now run in:

- `public-workflows`: enquiries, group-buy, event/workshop registration,
  newsletter, engagement, and comments;
- `secure-workflows`: authenticated affiliate referrals;
- `admin-workflows`: Resend, Brevo, Meta recovery/sync, integration status,
  and client password-reset operations;
- `staff-workflows`: invite, re-invite, privileged edits, change review, and
  removal;
- `signed-document-url`: access-checked private Storage URLs;
- `whatsapp`: authenticated WhatsApp Business text/template/read operations;
- `meta-leads-webhook`: verification, HMAC validation, lead fetch, capture,
  and retry-queue writes.

Each browser endpoint applies explicit origin restrictions, request-size
limits, schema validation, authentication/role checks where required,
sanitized error handling, structured request-ID logging, and best-effort burst
rate limiting. Durable cross-isolate rate limits should also be configured at
the Supabase/API gateway layer.

The old Node entry, service client, server modules, TanStack Start server
functions, and server API routes are removed. The static frontend contains
only public `VITE_` configuration. See `supabase/functions/SECRETS.md` for the
private secret inventory and `docs/PRODUCTION_CUTOVER_CHECKLIST.md` for the
exact ordered production procedure.
