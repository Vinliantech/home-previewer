# Kay-Steph Group Website and Property Platform

This project contains the Kay-Steph public website, property catalogue, investor portal,
affiliate portal, CRM, and administration dashboards.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add the Supabase project values.
3. Add the production investment bank details only after the finance team verifies them.
4. Start the app with `npm run dev`.

The local development URL is `http://localhost:8080`.

## Required database migration

Apply all 31 files in `supabase/migrations` in filename order before using the
investor, CRM or administration workflows. They are forward-only and idempotent.
`DEPLOY.md` lists them with a one-line description each.

Two are easy to miss and the code depends on both:

- `20260717090000_crm_lead_matching.sql` — lead dedupe keys.
- `20260723040000_unified_property_catalogue.sql` — makes `tokenized_properties`
  the shared catalogue for the public site, client portal, affiliate portal and
  admin. Without it the property pages fall back to the shipped catalogue and
  admin edits do not propagate.

Deploy them through Lovable Cloud or the Supabase CLI used by your project.

## Payment configuration

Set these public display values only after the settlement account is approved:

```env
VITE_INVESTMENT_BANK_NAME=
VITE_INVESTMENT_ACCOUNT_NAME=
VITE_INVESTMENT_ACCOUNT_NUMBER=
```

When these values are empty, the portal blocks payment-evidence submission and directs
the investor to Kay-Steph finance instead of displaying placeholder bank details.

## Verification

```bash
npx tsc --noEmit
npm run build
```

Run ESLint against the files you change. The original Lovable export still contains
repository-wide formatting debt, so clean that baseline separately before making
`npm run lint` a required CI gate.

Never commit `.env`, service-role keys, Meta secrets, KYC documents, or payment evidence.
