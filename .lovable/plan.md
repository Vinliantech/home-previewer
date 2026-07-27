
# Fractional Property Tokenization & Co-Ownership

Reuses existing client accounts. Any signed-in client can complete KYC, then invest. Currency ₦. Manual bank transfer + payment evidence. Admin (super_admin/admin) confirms everything.

## 1. Database (single migration, RLS + GRANTs on every table)

**Enums**
- `kyc_status`: not_submitted, pending, verified, rejected, more_info
- `property_status`: open, partially_funded, fully_funded, under_review, approved, acquisition_in_progress, acquired, income_generating, available_for_resale, sold, closed
- `investment_status`: draft, submitted, payment_pending, payment_received, under_review, approved, rejected, refunded, cancelled
- `token_status`: reserved, pending_payment, pending_approval, active, locked, listed_for_resale, transferred, redeemed, cancelled
- `exit_status`: submitted, under_review, approved_for_listing, buyer_found, payment_pending, transfer_in_progress, completed, rejected, cancelled
- `wallet_txn_type`: deposit, investment_payment, rental_income, sale_proceeds, withdrawal, refund, adjustment
- Extend `app_role` with `property_manager`, `finance_officer`, `compliance_officer`

**Tables**
- `investor_profiles` — user_id (unique FK auth.users), address, country, nationality, dob, id_type, id_number, id_doc_url, photo_url, next_of_kin (jsonb), bank_details (jsonb), kyc_status, kyc_reviewed_by, kyc_notes
- `tokenized_properties` — name, location, description, type, images (text[]), initial_value, current_value, min_investors, max_investors, min_investment, max_investment, token_value (default 10000), total_tokens (generated), funding_deadline, expected_rental_yield, expected_appreciation, status, legal_title, management_fee_pct, service_charge, exit_terms, risk_disclosure, spv_id
- `property_documents` — property_id, doc_type (title/certificate_of_incorporation/shareholders/co_ownership/subscription/valuation/mgmt/insurance/rental_statement), file_url, uploaded_by
- `spvs` — name, registration_number, incorporation_date, docs (jsonb)
- `investments` — investor_id (auth.users), property_id, proposed_amount, approved_amount, ownership_pct (numeric(6,4)), tokens_count, status, agreement_accepted_at, payment_evidence_url, admin_notes, approved_by, approved_at, certificate_number
- `property_tokens` — investment_id, property_id, investor_id, tokens_count, unit_value, status, issued_at
- `property_valuations` — property_id, previous_value, new_value, change_pct, valuation_date, report_url, valuer, approved_by, notes
- `rental_distributions` — property_id, gross_income, expenses (jsonb), mgmt_fee, maintenance, taxes, net_distributable, distribution_date, notes
- `rental_payouts` — distribution_id, investor_id, ownership_pct_snapshot, amount, status (pending/paid), paid_at, reference
- `investor_wallets` — investor_id (unique), available_balance, pending_balance (materialized via triggers on txns)
- `wallet_transactions` — investor_id, type, amount, property_id, investment_id, reference, status, method, evidence_url, notes
- `withdrawal_requests` — investor_id, amount, bank_details (jsonb), status, admin_notes, approved_by
- `exit_requests` — investor_id, property_id, tokens_to_sell, asking_price, status, buyer_investment_id, admin_notes
- `investment_certificates` — investment_id (unique), certificate_number, pdf_url, qr_token (unique), issued_at, issued_by
- `investor_notifications` — investor_id, type, title, body, link, read_at
- `audit_logs` — actor_id, action, entity_type, entity_id, previous_value (jsonb), new_value (jsonb), ip, notes

**RLS**
- Investors: read/write own `investor_profiles`, own `investments`, own `property_tokens`, own `wallet_transactions`, own `investor_wallets`, own `rental_payouts`, own `withdrawal_requests`, own `exit_requests`, own `investment_certificates`, own `investor_notifications`.
- Public read (anon + authenticated) on `tokenized_properties` (safe columns) + `property_documents` marked public + aggregated funding stats.
- Admin roles (super_admin/admin + specialized): full read/write via `has_role`.
- `audit_logs`: insert via SECURITY DEFINER trigger, read admin only.

**Functions & triggers**
- `recalc_property_funding(property_id)` — sums approved investments, updates status transitions.
- `on_investment_approved` trigger — creates `property_tokens` (approved_amount / token_value), sets ownership_pct = approved_amount / initial_value * 100, generates certificate_number, calls recalc.
- `on_valuation_approved` — updates `tokenized_properties.current_value`, snapshots into `property_valuations`.
- `distribute_rental(distribution_id)` — inserts `rental_payouts` per active token holder using ownership snapshot.
- `has_investor_role(uid)` — always true for authenticated (any client can invest post-KYC gate at app layer).
- `generate_certificate_number()` — sequential `KS-CERT-YYYYMM-XXXX`.
- `audit_trigger()` — SECURITY DEFINER, writes to `audit_logs` on key tables.
- `update_updated_at_column` triggers on all mutable tables.

**Storage buckets** (created via tool)
- `investor-kyc` (private) — ID docs, selfies
- `property-media` (public) — property images
- `property-docs` (private) — legal PDFs; signed URLs
- `payment-evidence` (private)
- `certificates` (private, signed URLs) — generated PDFs

## 2. Server functions (`src/lib/invest.functions.ts`)

All `requireSupabaseAuth`; admin-scoped ones check `has_role`.

Investor: `submitKyc`, `getMyKyc`, `listOpenProperties` (public, uses publishable client), `getPropertyDetail`, `createInvestment`, `uploadPaymentEvidence`, `getMyPortfolio`, `getMyWallet`, `requestWithdrawal`, `requestExit`, `getMyCertificate` (returns signed URL), `getMyNotifications`.

Admin: `listKycQueue`, `reviewKyc`, `createProperty`, `updateProperty`, `uploadPropertyDoc`, `listInvestmentsForReview`, `approveInvestment` (accepts adjusted amount + signed agreement URL), `rejectInvestment`, `recordValuation`, `recordRentalIncome` (creates distribution + payouts), `markPayoutPaid`, `approveWithdrawal`, `approveExitRequest`, `issueCertificate` (renders PDF via `pdf-lib`, uploads, stores qr_token), `getAdminAnalytics`, `getAuditLogs`.

Certificate PDF: `pdf-lib` (Worker-safe). QR verification uses `/verify/$token` public route that returns non-sensitive summary.

## 3. Routes

**Public**
- `/invest` — landing with headline, hero, opportunities grid (SSR via publishable client)
- `/invest/$propertyId` — property detail, funding progress, "Calculate My Share" widget, CTA to sign in/invest
- `/verify/$token` — certificate verification page

**Authenticated investor (`/portfolio/*`)**
- `/portfolio` — overview cards (total invested, current value, returns, rental earned, portfolio chart)
- `/portfolio/opportunities` — browse + invest
- `/portfolio/properties` — my holdings
- `/portfolio/tokens` — token ledger per property
- `/portfolio/returns` — rental + appreciation history
- `/portfolio/wallet` — balances, deposit instructions, upload evidence, withdraw
- `/portfolio/transactions` — full ledger
- `/portfolio/documents` — property docs I can access
- `/portfolio/certificates` — download PDFs
- `/portfolio/exit-requests`
- `/portfolio/kyc` — submit / status
- `/portfolio/profile`
- `/portfolio/notifications`

**Investment flow**
- `/portfolio/invest/$propertyId` — amount → live ownership%/tokens/share preview → accept agreement → submit → payment instructions → upload evidence

**Admin (`/admin/invest/*`)** added into existing admin dashboard nav
- Dashboard, Properties (list/create/edit), Property valuations, SPVs, Investors (KYC queue), Investment requests, Contributions/payments, Ownership records, Rental income (record + distribute), Distributions, Withdrawals, Exit requests, Documents, Reports, Audit logs, Settings (token value default, bank details displayed to investors)

## 4. UI system

- Premium real-estate aesthetic building on existing navy palette. Reuse tokens; add `--gold` accent, `--surface-elevated`, subtle glass cards.
- Components: `PropertyCard`, `FundingProgress` (progress + investor count + days remaining), `ShareCalculator`, `OwnershipDonut` (recharts), `PortfolioValueChart`, `ReturnBadge`, `StatusBadge` (per enum), `TransactionTable`, `CertificatePreview`, `KycStepper`, `InvestmentWizard` (4 steps), `PaymentInstructionsCard`, `DocumentList` with signed-URL fetch.
- Naira formatter `formatNGN(amount)`; percentages to 2dp.
- Mobile responsive; sticky invest CTA on mobile property detail.
- Toasts + in-app notification bell with unread badge.

## 5. Business rule enforcement

Enforced in DB + server fn:
- Property cannot transition to `fully_funded` until sum(approved) = initial_value AND approved investor count ≥ min_investors.
- Trigger on investment approve rejects if sum(approved) + new_approved > initial_value.
- Ownership_pct always derived from approved_amount / initial_value (not current_value).
- Rental payouts snapshot ownership at distribution time.
- Exit transfers require admin approval before token rows move investor_id.
- Every mutation on properties, investments, valuations, distributions, withdrawals, exits triggers audit_logs insert with previous/new jsonb.

## 6. Notifications

In-app only for v1 (write to `investor_notifications`). Email/SMS/WhatsApp scaffolded as no-op hooks with clear TODO for later provider wiring — no user action needed now.

## 7. Not in v1 (explicitly)

- Automated payment gateway (manual only)
- Automated KYC provider (manual review)
- Email/SMS/WhatsApp delivery (hooks only)
- Investor-to-investor direct chat
- On-chain tokens (the "token" is a database ownership unit, per spec)

## 8. Technical notes

- Uses TanStack `createServerFn` + existing Supabase auth middleware pattern.
- Certificate PDFs generated server-side with `pdf-lib`; QR encoded with `qrcode` (both Worker-compatible).
- Publishable-key server client for public property lists during SSR.
- Public route loaders never call `requireSupabaseAuth`.
- Single migration for all schema; grants included per table.
- Seed data added via migration: 3 sample tokenized properties + default SPV so the /invest page isn't empty on first load.

Approve to build.
