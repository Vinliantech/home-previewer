# Instruction to Lovable: Tokenized Properties Management System (fitted to the existing Kay-Steph codebase)

Build out the Tokenized Properties Management System by **extending the existing system — do not rebuild it**. This project already contains a working tokenized-investment engine. Your job is to add the missing capabilities listed below on top of it.

## ⚠️ Read first — what already exists (DO NOT duplicate or replace)

This is a **TanStack Start** app (file routes in `src/routes/`, server functions in `src/lib/*.functions.ts`). It is NOT react-router — never add react-router pages.

Already built and working — reuse, never recreate:

| Area | Where it lives |
|---|---|
| Tokenized property records | `tokenized_properties` table: name, location, description, property_type, images[], initial_value, current_value, min_investors, max_investors, min_investment, max_investment, token_value, funding_deadline, expected_rental_yield, expected_appreciation, status (13-state enum: open → partially_funded → fully_funded → under_review → approved → acquisition_in_progress → acquired → income_generating → available_for_resale → sold → closed), legal_title, management_fee_pct, service_charge, exit_terms, risk_disclosure, spv_id |
| SPVs, documents, tokens, valuations | `spvs`, `property_documents`, `property_tokens`, `property_valuations` tables |
| Income & money | `rental_distributions`, `rental_payouts`, `investor_wallets`, `wallet_transactions`, `withdrawal_requests`, `exit_requests`, `investment_certificates`, `audit_logs` |
| Transactional rules | RPCs: `admin_approve_investment` (allocates tokens; only approved amounts count toward funding), `admin_record_property_valuation` (records previous/new value, valuer, report, updates current_value — the exact flow in spec §12), `admin_record_rental_distribution`, `admin_mark_rental_payout_paid`, `admin_approve_withdrawal`, `admin_update_exit_request`, `admin_review_investor_kyc` |
| Investor application flow (spec §8) | `createInvestment` server fn already enforces: sign-in, verified KYC, property open, deadline not passed, min/max amount, token-value multiples → reservation → `uploadPaymentEvidence` → pending until admin approves. Keep it; extend it. |
| Admin approval (spec §9) | `/admin-invest` page ("Tokenized Properties" in the super-admin sidebar) with 8 tabs: Investments, KYC, Properties, Valuations, Rental Income, Payouts, Withdrawals, Exit Requests |
| Investor dashboard (spec §11) | `/portfolio/*` bank-UI pages: units, ownership %, current unit/share value, rental income, appreciation, certificates with public verification, statements, transactions, withdrawals, exits — complete |
| Public pages | `/invest/tokenized` (opportunity cards with funding %), `/invest/$id` (detail + invest flow) |
| Demo mode | Removed. `src/lib/demo.ts` no longer exists — there are no demo branches, no `blockInDemo()` guards and no sample fixtures. Every surface reads live Supabase data and requires a real account. |

**Non-negotiable guardrails**
1. Migrations are forward-only and idempotent (`ADD COLUMN IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object`), matching the style of `supabase/migrations/20260715130000_estate_operations.sql`. `ALTER` the existing tables — never drop/recreate.
2. Keep every existing RPC name and signature. Add new RPCs in a new migration.
3. Public pages must keep reading funding via the safe aggregate (`get_public_property_funding`) — never expose investor rows publicly.
4. All projected returns display as **estimates, never guarantees** (existing copy style).
5. `npx tsc --noEmit` and `npm run build` must pass when you finish.

---

## Phase 1 — Database migration (one new file in `supabase/migrations/`)

### 1a. Master property registry (spec §1–2)
The site currently has three disconnected property notions (marketing list, estate plots, tokenized properties). Create ONE master table:

`master_properties`: id, name, property_type (enum-ish text: residential_apartment, terrace, detached_house, commercial, serviced_plot, undeveloped_land, rental_income, off_plan, completed), location, full_address, description, images text[], videos text[], property_value numeric, full_purchase_price numeric, bedrooms int, size_label text, development_status text, title_type text, title_verification_status text (default 'pending'), rental_status text, expected_rental_income numeric, current_valuation numeric, features text[], amenities text[], availability_status text, listing_status text (draft, under_review, available_full_purchase, eligible_group_buy, eligible_tokenization, tokenization_setup, open_tokenized, fully_funded, acquisition_in_progress, income_generating, closed, sold, archived), allowed_routes text[] (full_purchase / group_buy / tokenized — a property may carry more than one only when deliberately set), created_at/updated_at + trigger, RLS: admins all, authenticated read of non-draft rows.

Link it: `ALTER TABLE tokenized_properties ADD COLUMN IF NOT EXISTS master_property_id uuid REFERENCES master_properties(id)`. Also add `master_property_id` to `group_pools` and `plots` (nullable) so all three routes can point at one master record. **Anti-double-sell rule:** a SECURITY DEFINER helper `assert_route_allowed(master_property_id, route)` that raises unless the route is in `allowed_routes`, called when creating a tokenized offer / pool / full-purchase allocation from a master property, plus block marking a master property `sold` while an open tokenized offer or pool references it.

### 1b. Extend `tokenized_properties` (spec §3–5) — ADD COLUMN IF NOT EXISTS only
- **Offer sizing:** `tokenization_target numeric` (amount offered to investors), `percentage_offered numeric` (default 100), `retained_by text` (note on who holds the remainder). CHECK: tokenization_target ≤ initial_value.
- **Timeline:** `opens_at timestamptz`, `expected_close_date date`, `investment_duration_months int`, `rental_commencement_date date`, `first_distribution_date date`, `extension_days int` (funding_deadline already exists).
- **Participation:** `max_ownership_pct_per_investor numeric`, `allow_unequal_contributions boolean default true`, `waiting_list_enabled boolean default true`.
- **Units:** `total_units int` (validated: total_units = tokenization_target ÷ token_value — reject publish if it doesn't balance), `min_units_per_investor int default 1`, `max_units_per_investor int`, `allow_partial_units boolean default false`, `resale_allowed boolean default true`, `allocation_method text default 'first_come'`.
- **Fees (spec §4):** `fee_schedule jsonb` holding {maintenance_provision, insurance_provision, spv_admin_charge, entry_fee, exit_fee, other_charges[]} — management_fee_pct and service_charge already exist as columns; don't duplicate them inside the json.
- **Legal (spec §5):** `legal_structure text default 'spv'` (spv / direct_fractional / beneficial_interest / trust_nominee / other); extend `spvs` with registration_number, share_structure, directors text[], investor_rights text, voting_structure text, distribution_terms text, transfer_rules text (IF NOT EXISTS each). Add `required_documents text[]` and `publish_checklist jsonb` on tokenized_properties; a new `coming_soon` and `draft` value handling: reuse existing enum — add `DO $$ ... ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'draft'; ... 'coming_soon';` .
- **Funding-rule hardening (spec §10):** new RPC `admin_publish_tokenized_offer(_property_id)` that validates: units balance, target ≤ value, min < max, checklist complete (or items explicitly marked pending), then flips status draft→coming_soon/open. Extend `createInvestment` server fn checks with: opens_at not in future, approved investor count < max_investors, per-investor max ownership, requested units within min/max per investor. Add `reservation_expires_at` on `investments` + RPC `expire_stale_reservations()` that cancels unpaid reservations past expiry (releasing their units) — call it at the top of `adminListInvestments` and `listOpenProperties`. `admin_approve_investment` must additionally reject when approval would exceed tokenization_target, max_investors, or the investor's ownership cap. (Pending never counts toward funding — that is already true; keep it.)

## Phase 2 — Admin (fit into the EXISTING structure; no new nav trees)

- **Master Properties module:** add a "Properties (Master)" section to the super-admin sidebar in `src/routes/_authenticated/admin.tsx` under SALES, built as a new module in `src/components/admin/` following the exact pattern of `estate-ops.tsx` (bank UI: DashCard/StatusBadge/TableShell). CRUD for master_properties with the §1 fields, listing_status control, allowed_routes control, and a **"Tokenize This Property"** button on every row whose allowed_routes includes tokenized.
- **Tokenization wizard:** clicking "Tokenize This Property" opens `/admin-invest?master=<id>` — extend the existing "Properties" tab in `src/routes/_authenticated/admin-invest.tsx`. Replace the current flat "New Property" dialog with a stepped wizard (Offer → Timeline → Participation → Units → Fees → Legal & Documents → Preview → Publish) that **prefills name, location, type, images, value, description from the master record** (no re-entry), computes total_units live from target ÷ unit price with validation, and calls the extended `adminCreateProperty` + `admin_publish_tokenized_offer`. Keep the wizard usable standalone (no master id) for backward compatibility.
- Add two tabs to `/admin-invest`: **Waiting List** (registrations when an offer is full — new `tokenized_waitlist` table: property_id, user_id/email, amount_interested, created_at) and **Audit Log** (read the existing `audit_logs` table filtered to investment events).
- Keep the existing 8 tabs untouched in behavior; they already implement spec §9 (approve/reject/adjust amount/notes) and §12 (valuations — current unit value = current_value ÷ total_units follows automatically once total_units exists; show it in the Valuations tab).

## Phase 3 — Public pages (upgrade in place)

- `/invest/tokenized` cards (spec §6): keep the existing card; add tokenization target, % offered, unit price, units total/remaining, approved investor count + spaces remaining, funding % **computed against tokenization_target (not initial_value)** — update this same calculation in `/invest/$id` and `/invest` so all three agree. Status badges: map to existing enum + new coming_soon; "Nearly Funded" is a display rule at ≥ 80%. Buttons: View Details (exists), Invest Now (exists), plus **Calculate My Units** (inline calculator: amount ⇄ units ⇄ est. ownership %) and **Request Investment Pack** (reuse the existing enquiry server-fn pattern from `src/lib/enquiry.functions.ts` → CRM leads). When fully funded or investor cap reached: swap Invest Now for **Join Waiting List** (writes `tokenized_waitlist`) or "Opportunity Fully Subscribed".
- `/invest/$id` detail (spec §7): extend with % offered, units allocated/remaining, min/max investors, approved count, fee breakdown (gross vs estimated net after disclosed fees), legal structure + SPV summary, timeline (opens, deadline, duration, rental commencement, first distribution), documents list (property_documents — already fetched), calculator, and FAQs. Keep the existing invest flow untouched apart from the new validations.

## Phase 4 — Verification checklist (must all pass before you finish)
1. `npx tsc --noEmit` and `npm run build` pass.
2. Signed out, `/admin-invest`, `/invest/tokenized`, `/invest/$id` and `/portfolio` redirect to their sign-in page; signed in, each renders live data with an empty state when the table has no rows.
3. Funding math: a property with target ₦60M / unit ₦1M shows 60 units; approving ₦20M shows 33% funded; a pending ₦40M application changes nothing.
4. Publishing is blocked when units × unit price ≠ target, or the document checklist has unresolved required items.
5. No duplicate property records: tokenizing a master property links it; the master list shows its route badges.

**Deployment order:** run the new migration in Lovable Cloud first, then apply the code.
