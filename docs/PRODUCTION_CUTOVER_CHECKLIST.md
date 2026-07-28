# Production cutover checklist

No command in this checklist has been run against
`ufhwetpowavyryiortlm`. Execute it only during an approved maintenance window.

## 1. Review and backup

- [ ] Merge the reviewed `agent/supabase-edge-preparation` branch.
- [ ] Confirm the source Lovable project has a current database/Auth backup.
- [ ] Export all six Storage buckets and verify file counts/checksums.
- [ ] Export application data separately from the schema migrations.
- [ ] Record Auth SMTP, email templates, OAuth, CAPTCHA, MFA, password policy,
      Realtime, and redirect settings from the source project.
- [ ] Freeze writes or define a final delta-copy window.

## 2. Local release gate

```bash
npm ci
npm test
npm run typecheck
npm run check:edge
npm run build:verify
npx supabase@latest start
npx supabase@latest db reset --local
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -v ON_ERROR_STOP=1 \
  -f supabase/tests/schema_inventory.sql
npx supabase@latest functions serve \
  --env-file /tmp/kaysteph-edge-secrets.env
```

- [ ] The inventory assertion reports 79 tables, 199 policies, 82 functions,
      78 application triggers, six buckets, 18 Storage policies, and no public
      table missing RLS.
- [ ] `dist/` contains `index.html`, `.htaccess`, `sitemap.xml`, and `assets/`.
- [ ] No build output contains a private credential or service-role key.
- [ ] Exercise every Edge Function locally with allowed/disallowed origins and
      authorized/unauthorized test accounts; provider calls use sandbox/test
      credentials.

Stop the local stack when finished:

```bash
npx supabase@latest stop
```

## 3. Link and dry-run only

```bash
npx supabase@latest login
export SUPABASE_DB_PASSWORD='NEW_PROJECT_DATABASE_PASSWORD'
npx supabase@latest link \
  --project-ref ufhwetpowavyryiortlm \
  --password "$SUPABASE_DB_PASSWORD"
npx supabase@latest migration list --linked
npx supabase@latest db push --linked --dry-run
```

- [ ] Review the dry-run output and resolve any unexpected remote objects.
- [ ] Confirm no `repair`, `reset --linked`, or destructive command is needed.

## 4. Approved Supabase cutover

Only after the dry-run is approved:

```bash
npx supabase@latest db push --linked

export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID='GOOGLE_CLIENT_ID'
export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET='GOOGLE_CLIENT_SECRET'
npx supabase@latest config push

npx supabase@latest secrets set \
  --env-file /tmp/kaysteph-edge-secrets.env \
  --project-ref ufhwetpowavyryiortlm

for function_name in \
  public-workflows \
  secure-workflows \
  admin-workflows \
  staff-workflows \
  signed-document-url \
  whatsapp \
  meta-leads-webhook
do
  npx supabase@latest functions deploy "$function_name" \
    --project-ref ufhwetpowavyryiortlm
done
```

- [ ] Restore application rows, Auth users/identities, and Storage objects.
- [ ] Regenerate `src/integrations/supabase/types.ts` from the new project.
- [ ] Run `npm run typecheck` again after regenerating the database types.
- [ ] Move provider credentials held in any developer-only `.env.local` into
      Supabase secrets, then securely remove or rotate the local copies.
- [ ] Configure Meta webhook URL:
      `https://ufhwetpowavyryiortlm.supabase.co/functions/v1/meta-leads-webhook`.
- [ ] Complete Meta verification and confirm signature-verified lead delivery.

## 5. HostAfrica release

- [ ] Configure the new project's publishable key as the GitHub Actions
      `VITE_SUPABASE_PUBLISHABLE_KEY` repository secret.
- [ ] Download the `hostafrica-public-html` artifact or run
      `npm run build:verify`.
- [ ] Back up the existing `public_html`.
- [ ] Keep host-owned `.well-known` and `cgi-bin` entries.
- [ ] Remove only website files replaced by the new artifact.
- [ ] Upload the **contents** of `dist/`, including `.htaccess`, into
      `public_html`.
- [ ] Set directory permissions to `755` and file permissions to `644`.
- [ ] Purge HostAfrica/CDN/browser caches.

## 6. Production smoke tests

- [ ] `/`, `/about`, `/contact`, `/blog`, and one nested URL load after a hard
      refresh.
- [ ] Email sign-up/sign-in/recovery and Google OAuth use the new project.
- [ ] RLS is tested with separate client, affiliate, investor, staff, CRM,
      content, and platform-admin accounts.
- [ ] Enquiry, group-buy, event, workshop, newsletter, and affiliate lead
      capture create the expected CRM records.
- [ ] Resend and Brevo emails deliver and log their result.
- [ ] Staff invite and client password-reset links are single-use and correct.
- [ ] Meta import, webhook capture, retry queue, and campaign sync work.
- [ ] WhatsApp text/template operations work with an approved test recipient.
- [ ] Uploads and signed downloads work for every private bucket.
- [ ] Browser developer tools show no request to the old Supabase project and
      no private credential.

## 7. Rollback

- [ ] Keep the pre-cutover `public_html` archive ready for immediate restore.
- [ ] Do not roll the database back by deleting migration history.
- [ ] If the frontend fails, restore the prior static files while leaving the
      new Supabase project intact for diagnosis.
- [ ] If data migration fails, stop writes, retain both backups, and reconcile
      the delta before retrying.
