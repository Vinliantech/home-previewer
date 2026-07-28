# Kay-Steph Group deployment guide

The front end builds as a static Vite React application for Apache shared
hosting. Supabase provides Auth, Postgres, Storage, RPCs, and Edge Functions.

Read `docs/SUPABASE_MIGRATION_REPORT.md` and
`docs/PRODUCTION_CUTOVER_CHECKLIST.md` before cutover.

## 1. Configure the new Supabase project

Copy `.env.example` to `.env.production` and fill the new project's
publishable key:

```env
VITE_SUPABASE_PROJECT_ID=ufhwetpowavyryiortlm
VITE_SUPABASE_URL=https://ufhwetpowavyryiortlm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_PROJECT_PUBLISHABLE_KEY
```

Do not place the service-role key, Brevo, Resend, or Meta secrets in any
`VITE_` variable. Anything prefixed with `VITE_` is public browser code.
Configure `VITE_SUPABASE_PUBLISHABLE_KEY` as a GitHub Actions repository
secret before downloading the `hostafrica-public-html` workflow artifact.

Link and dry-run the database before applying it:

```bash
npx supabase@latest login
export SUPABASE_DB_PASSWORD='NEW_PROJECT_DATABASE_PASSWORD'
npx supabase@latest link \
  --project-ref ufhwetpowavyryiortlm \
  --password "$SUPABASE_DB_PASSWORD"
npx supabase@latest db push --linked --dry-run
npx supabase@latest db push --linked
```

Then configure Auth and regenerate `src/integrations/supabase/types.ts` as
described in the migration report.

## 2. Build the static site

```bash
npm install
npm test
npm run typecheck
npm run check:edge
npm run build:verify
```

The deployable output is:

```text
dist/
  .htaccess
  index.html
  assets/
  sitemap.xml
  favicon.ico
```

The checked build produces all of these files. `dist/.htaccess` supplies the
Apache client-routing fallback for URLs such as `/about` and `/contact`.

## 3. Upload to cPanel or DirectAdmin

1. Back up the current `public_html`.
2. Keep host-managed entries such as `.well-known` and `cgi-bin`.
3. Remove only the old website assets that the new build replaces.
4. Upload the **contents** of `dist/` into `public_html`, not the `dist`
   directory itself.
5. Ensure hidden files are included so `public_html/.htaccess` is uploaded.
6. Use normal permissions: directories `755`, files `644`.
7. Purge any cPanel, CDN, and browser cache.

Do not upload source files, `node_modules`, `.env.production`, migration SQL,
or secret keys into `public_html`.

## 4. Cutover checks

- `/`, `/about`, and `/contact` load, including after a hard refresh.
- Email/password sign-up, sign-in, sign-out, and recovery use the new project.
- Google OAuth returns through
  `https://ufhwetpowavyryiortlm.supabase.co/auth/v1/callback`.
- Public property/blog data is served by the new database.
- Client, affiliate, investor, staff, CRM, content, and admin RLS access is
  tested with separate real accounts.
- Upload and signed-download checks pass for all six Storage buckets.
- No browser request uses the old Supabase project.

## Backend deployment

Static HostAfrica hosting never receives private credentials. Deploy the seven
Edge Functions and set their secrets in Supabase using the commands in the
cutover checklist. The Meta webhook URL is the Supabase Function URL, not a
path under `kaystephgroup.com`.
