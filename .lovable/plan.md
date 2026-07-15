## What's in the upload vs the project

I diffed every file in `kaysteph-all-changes.zip` against the current project. Results:

- **17 files identical** — already applied (finance-ops, support-ops, invest.group-buy, invest.tokenized, market-report, careers, team, pools.ts, PageShell, pools.$id, pools.index, portfolio.pools.index, and both existing migrations in a cosmetically different but equivalent form).
- **21 files differ** — need to be overwritten.
- **17 files are net-new** — need to be created.
- **2 migration files** in the upload are cosmetic reformats of migrations already applied to the database, with 3 real drift points I'll skip (see "Migrations" below).

## What I'll add / change

### 1. Route restructure: authenticated pages move under `/portfolio/*`
The upload consolidates all client-portal routes under one shell. New files:

```
_authenticated/portfolio.index.tsx          (Overview)
_authenticated/portfolio.opportunities.tsx
_authenticated/portfolio.properties.tsx     (was my-properties)
_authenticated/portfolio.tokens.tsx         (was my-tokens)
_authenticated/portfolio.returns.tsx
_authenticated/portfolio.wallet.tsx
_authenticated/portfolio.transactions.tsx
_authenticated/portfolio.statements.tsx
_authenticated/portfolio.certificates.tsx
_authenticated/portfolio.exit-requests.tsx
_authenticated/portfolio.kyc.tsx
_authenticated/portfolio.profile.tsx
_authenticated/portfolio.notifications.tsx
_authenticated/portfolio.support.tsx
```

`portfolio.tsx` is rewritten from a thin `<Outlet/>` into the full sidebar+header shell (replacing the previous `PortalShell` wrapping pattern).

**Legacy top-level files I'll delete** (replaced by the portfolio.* versions above):
`dashboard.tsx, kyc.tsx, my-properties.tsx, my-tokens.tsx, opportunities.tsx, returns.tsx, wallet.tsx, transactions.tsx, statements.tsx, certificates.tsx, exit-requests.tsx, notifications.tsx, profile.tsx, support.tsx`

TanStack will regenerate `routeTree.gen.ts` automatically.

### 2. New auth surfaces
- `src/routes/admin.auth.tsx` — admin sign-in page (`/admin/auth`)
- `src/routes/affiliate.auth.tsx` — partner sign-in / sign-up (`/affiliate/auth`)
- `src/routes/_authenticated/affiliate.portal.tsx` — partner dashboard (`/affiliate/portal`)

### 3. Updated files (overwrite with upload version)
`_authenticated/route.tsx` (adds demo bypass + seedDemoData), `_authenticated/admin.tsx`, `_authenticated/portfolio.tsx`, `routes/index.tsx`, `routes/auth.tsx`, `routes/about.tsx`, `routes/blog.tsx`, `routes/contact.tsx`, `routes/faq.tsx`, `routes/services.tsx`, `routes/why-kaysteph.tsx`, `routes/properties.index.tsx`, `components/site/SiteHeader.tsx`, `components/site/SiteFooter.tsx`, `components/admin/estate-ops.tsx`, `components/portfolio/kit.tsx`, `lib/demo.ts`, `lib/enquiry.functions.ts`, `lib/groupbuy.functions.ts`, `lib/invest.functions.ts`, `lib/pools.functions.ts`, `lib/properties.ts`.

### 4. Follow-on fixes I expect to need
The affiliate portal imports `@/lib/affiliate` (formatting helpers) and `demoAffiliate` from `@/lib/demo`. If those aren't in the corresponding upload files, I'll create the missing helpers minimally so the build passes. Same treatment for any other missing symbols surfaced by `tsgo`.

### 5. Migrations — skip
The upload's two SQL files are reformatted duplicates of migrations already applied (`20260715223237_*` and `20260715223933_*`). They contain three drifts I will NOT introduce because they'd fail against the current schema:
- `group_pools.property_id` FK to `public.tokenized_properties` (that table doesn't exist).
- `documents.approved_by / approved_at` columns.
- Policies referencing `public.is_admin(...)` (only `public.has_role(...)` exists).

If you want any of these later, I'll do it as a separate forward migration.

## Verification
After the sweep I'll run `tsgo --noEmit` and patch anything that fails (usually a missing helper import). No manual edits to `routeTree.gen.ts`.

## Out of scope
No new database changes, no design changes beyond what the uploaded files carry, no removals outside the legacy `_authenticated/*` files listed above.
