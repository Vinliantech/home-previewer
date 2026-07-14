# Investor Portal — Build Plan

Lovable Cloud is now enabled (auth, database, storage, server functions ready). The portal is large, so I'll ship it in 4 phases and stop for your review between each.

## Phase 1 — Auth foundation (this turn)
- Email/password + Google sign-in via managed OAuth
- `/auth` public route (sign in / sign up / forgot password)
- `/reset-password` public route
- `_authenticated` layout gate (integration-managed)
- `profiles` table (id, full_name, phone, avatar_url, created_at) + auto-create trigger on signup
- `user_roles` table + `app_role` enum (`investor`, `admin`) + `has_role()` security-definer fn
- Header updated to show account menu / "Sign in" based on session
- `/dashboard` stub landing page (post-login home)

## Phase 2 — KYC + investor profile
- `kyc_submissions` table (BVN, ID doc, address, employment, status enum, reviewer notes)
- Storage bucket `kyc-documents` (private, per-user RLS)
- `/dashboard/kyc` form with file uploads + status badge
- Admin review server fns (gated by `has_role('admin')`)

## Phase 3 — Investments core
- `properties` table (seeded from `src/lib/properties.ts`) with funding fields
- `investments` table (user_id, property_id, amount, tokens, status)
- `tokens` table (per-investment token ledger)
- `transactions` table (deposits, allocations, payouts)
- `/invest/$id` deal-room pages with live funding progress
- `/dashboard/portfolio` — holdings, current value, ownership %
- `/dashboard/transactions` — transaction history

## Phase 4 — Wallet, statements, certificates
- `wallet_balances` view + top-up/withdrawal request flows
- `/dashboard/wallet`
- `/dashboard/statements` — quarterly PDFs (generated server-side)
- `/dashboard/certificates` — ownership certificates per token holding
- Contact form wired to Cloud (persist enquiries + email notification)

## Technical notes
- All user data tables use RLS scoped to `auth.uid()`; admin access via `has_role()`.
- Every table gets explicit `GRANT` statements (Cloud requirement).
- Server fns via `createServerFn` with `requireSupabaseAuth` for user-scoped writes.
- Google OAuth `redirect_uri` = `window.location.origin` (public route), then navigate to intended destination after session hydrates.
- Property/invest data stays in `src/lib/*.ts` for Phase 1–2; Phase 3 moves it to the DB.

## Confirm before I start Phase 1
- OK to default to **email/password + Google** for auth?
- Should new signups land on `/dashboard` or bounce to `/dashboard/kyc` until KYC is submitted?
- Any admin email(s) you want auto-granted the `admin` role on first login? (If yes, tell me the address.)
