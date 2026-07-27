# Instruction to Lovable: Real Estate CRM & Lead Automation (fitted to the existing Kay-Steph "CRM Workspace")

Build out the Kay-Steph CRM & Lead Automation System by **extending the CRM that already exists — do not rebuild it**. This project already ships a working CRM workspace (leads table, pipeline, opportunities, assignment rules, Facebook ad tables, agent notifications). Your job is to add the missing capabilities below **on top of it**, inside the same `/crm` workspace and its dark UI.

## ⚠️ Read first — what already exists (DO NOT duplicate or replace)

This is a **TanStack Start** app (file routes in `src/routes/`, server functions in `src/lib/*.functions.ts`, Supabase backend). It is NOT react-router — never add react-router pages. The CRM lives under `src/routes/_authenticated/crm*.tsx` and uses a **dark** theme (`bg-white/5`, `text-white`), separate from the light bank-UI `/admin`. Keep that theme.

Already built and working — reuse, never recreate:

| Area | Where it lives |
|---|---|
| Lead records | `leads` table: full_name, phone, email, fb_profile_url, fb_lead_id (UNIQUE), page_id, campaign_id, campaign_name, ad_id, ad_name, form_id, form_name, property_id, property_name, preferred_location, budget_min, budget_max, investment_type, status, assigned_to, assigned_at, captured_at, last_contacted_at, notes, **raw_payload jsonb**, timestamps |
| Lead history & timeline | `lead_status_history` (from/to status, changed_by) + `lead_activities` (activity_type enum incl. call/sms/email/note/brochure_sent/inspection_booked/…/fb_message_in/fb_message_out/system, body, meta jsonb) |
| Tasks | `follow_up_tasks`: title, task_type enum, due_at, assigned_to, completed_at, snoozed_until |
| Deals | `opportunities`: stage (qualification→proposal→negotiation→closing→won→lost), probability, deal_value_naira, expected_close_at, lost_reason |
| Assignment engine | `assignment_rules` (match_location / match_investment_type / match_budget_min/max / match_campaign_id / assign_agent_id / use_round_robin / priority) + `autoAssignLead` server fn that walks rules by priority, falls back to round-robin (`round_robin_cursor`), assigns, creates a first task, and notifies the agent |
| Facebook infra | `fb_lead_sources` (page_id, page_name, **access_token**, ad_account_id, **webhook_verify_token**, last_sync_at), `fb_campaigns` (spend/objective/daily_budget), `fb_ads` (ad_id, form_id, form_name, spend) |
| Notifications | `crm_notifications` (per-user, realtime-enabled) |
| Server functions | `src/lib/crm.functions.ts`: `assignLead`, `autoAssignLead`, `convertToOpportunity`, `createManualLead`. `src/lib/enquiry.functions.ts`: `submitEnquiry` (website contact form → inserts a `leads` row with `raw_payload.source = "website_contact_form"`) |
| Enums | `investment_type` (full_purchase, group_purchase, fractional, tokenized), `lead_status` (new, contacted, interested, qualified, brochure_sent, inspection_booked, inspection_completed, payment_discussion, payment_received, converted, not_interested, follow_up_later), `opportunity_stage`, `task_type`, `activity_type` |
| Routes | `/crm` (layout + subnav), `/crm` Inbox, `/crm/pipeline` (drag-and-drop stages), `/crm/opportunities`, `/crm/ads` (FB campaign performance), `/crm/settings` (agents + assignment rules + FB page/token connect — admin only) |
| Security | RLS: `is_crm_admin` sees all, agents see only leads `assigned_to` themselves; realtime on `leads`, `crm_notifications`, `follow_up_tasks`; `log_lead_status_change` trigger writes history automatically |
| Shared kit | `src/lib/crm.ts`: Lead type, LEAD_STATUSES/INVESTMENT_TYPES/OPPORTUNITY_STAGES/TASK_TYPES arrays (with tones/labels), `fmtNaira`, `statusMeta`, `investmentLabel`, `fmtDate` |

**Non-negotiable guardrails**
1. Migrations are forward-only and idempotent (`ADD COLUMN IF NOT EXISTS`; `ALTER TYPE … ADD VALUE IF NOT EXISTS`; `DO $$ … EXCEPTION WHEN duplicate_object`). Match the style of `supabase/migrations/20260711181824_*.sql`. **ALTER the existing `leads` table — never drop/recreate it**, or you destroy captured leads and break every RLS policy, index, and the realtime publication.
2. Keep every existing enum value, RPC name, server-fn signature, and route path. Add new values/RPCs/routes; don't rename old ones (the pipeline, ads, and settings pages depend on them).
3. **Secrets never touch the frontend.** Facebook page access tokens and the email-provider API key live only in Supabase Edge Function secrets / server env. All email sending and all Facebook webhook handling run in **Edge Functions or server functions**, never client code. Do not commit keys; do not ship `.env`.
4. **Duplicate prevention is mandatory** (§4, §12): before inserting a lead, match on `email` OR `phone` (and `fb_lead_id` for FB) — if found, UPDATE that lead and append a `lead_activities` row instead of creating a second record.
5. Every projected/marketing claim stays an estimate; all consent + unsubscribe handling must actually gate sending. `npx tsc --noEmit` and `npm run build` must pass when you finish.

---

## Phase 1 — Database migration (one new file in `supabase/migrations/`)

### 1a. Extend `leads` (ADD COLUMN IF NOT EXISTS only) — §1, §2, §3, §16
- **Contact/profile:** `whatsapp text`, `country_of_residence text`, `preferred_property_location text` (distinct from existing `preferred_location`, or reuse it — pick one and document), `property_type text`, `preferred_contact_method text` (call/whatsapp/email/sms), `investment_timeline text`.
- **Grading (§2):** `lead_grade text` (values 'A' | 'B' | 'C' | 'D', nullable), `grade_source text default 'auto'` (auto/manual), `grade_updated_at timestamptz`, `grade_updated_by uuid`.
- **Source (§3):** `lead_source text` (structured; see enum below) + keep `raw_payload` for the original blob. Backfill existing rows from `raw_payload->>'source'` where present.
- **Consent (§16):** `consent_given boolean default false`, `consent_at timestamptz`, `consent_source text`, `unsubscribed_at timestamptz`, `unsubscribe_token uuid default gen_random_uuid()` (used in email unsubscribe links).
- **CPL:** `cost_per_lead numeric(12,2)` (nullable; filled from FB insights when available).

### 1b. Investment-preference values (§1) — extend, don't replace
Current `investment_type` enum has 4 values. Add the marketing-preference options with `ALTER TYPE public.investment_type ADD VALUE IF NOT EXISTS …`: `'land_purchase'`, `'residential'`, `'commercial'`, `'rental_income'`, `'not_decided'`. (Keep `full_purchase`, `group_purchase`, `fractional`, `tokenized`.) Update the `INVESTMENT_TYPES` array in `src/lib/crm.ts` with the new labels so every dropdown and label helper picks them up automatically.

### 1c. Lead source enum (§3)
`DO $$ BEGIN CREATE TYPE public.lead_source AS ENUM ('website_contact','property_enquiry','investment_form','event_registration','workshop_registration','fb_lead_ads','fb_messenger','instagram','whatsapp','referral','affiliate','walk_in','phone_call','manual_admin','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;` then make `leads.lead_source` use it (or keep it `text` with a CHECK if you prefer — but be consistent).

### 1d. Lead-status pipeline (§9) — reconcile, don't fork
The instruction lists 18 pipeline stages; the app already has 12 `lead_status` values driving `/crm/pipeline`. **Add only the genuinely missing ones** with `ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS`: `'auto_response_sent'`, `'assigned'`, `'contact_attempted'`, `'investment_pack_sent'`, `'kyc_pending'`, `'payment_submitted'`, `'payment_approved'`, `'lost'`. Map the instruction's names to existing ones instead of duplicating (e.g. "Property Information Sent" = existing `brochure_sent`; "Payment Received"/"Converted to Client" already exist). Update `LEAD_STATUSES` in `src/lib/crm.ts` (label + tone) so the pipeline board renders every stage in order. The `log_lead_status_change` trigger already records each move — no change needed there.

### 1e. New tables
- **`events`** (§5): id, name, event_type text (event/webinar/presentation/workshop/site_inspection), starts_at timestamptz, ends_at, location text, meeting_url text, property_id uuid, capacity int, description text, status text default 'scheduled', created_by, timestamps. RLS: admins all, agents read.
- **`event_registrations`** (§5): id, event_id → events, lead_id → leads, attendance_status text default 'registered' (registered/confirmed/reminder_sent/attended/did_not_attend/cancelled/follow_up_required), registered_at, reminder_sent_at, timestamps. UNIQUE(event_id, lead_id).
- **`email_templates`** (§8): id, name, subject text, body_html text, body_text text, category text, dynamic_fields text[] (documentation only), branding_enabled boolean default true, active boolean default true, created_by, timestamps. RLS: admins only.
- **`email_sequences`** (§7, §8): id, name, trigger_condition text (new_lead/property_enquiry/investment_enquiry/event_registration/manual), active boolean default true, stop_on text[] (default array['reply','inspection_booked','converted','unsubscribed','manual_stop','not_interested']), created_by, timestamps.
- **`email_sequence_steps`**: id, sequence_id → email_sequences, step_order int, delay_minutes int (0 = immediate, 1440 = +1 day, etc.), template_id → email_templates, timestamps.
- **`email_sends`** (delivery log, §8, §13): id, lead_id, template_id, sequence_id nullable, step_order nullable, to_email text, subject text, provider_message_id text, status text (queued/sent/delivered/opened/clicked/bounced/failed/unsubscribed), error text, scheduled_for timestamptz, sent_at, opened_at, clicked_at, created_at. Index (lead_id), (status), (scheduled_for). RLS: admins all, agents read sends for their leads.
- **`email_enrollments`** (active sequence state per lead): id, lead_id, sequence_id, current_step int default 0, next_send_at timestamptz, status text (active/completed/stopped), stop_reason text, timestamps. UNIQUE(lead_id, sequence_id). This is what the scheduler reads.
- **`tokenized_waitlist`** is unrelated — ignore.
- Optional **`csv_imports`** (§15): id, filename, row_count int, imported_by, created_at — for the audit trail of bulk imports.

All new tables: `GRANT` to authenticated + service_role, `ENABLE ROW LEVEL SECURITY`, admin-all policy via `is_crm_admin(auth.uid())`, agent-read where a lead relationship exists, and an `updated_at` trigger where they have that column. Add `events`, `event_registrations`, `email_sends` to the realtime publication if you want live dashboard counts.

### 1f. RPCs (new migration; keep existing names)
- `recommend_lead_grade(_lead_id uuid) returns text` — SECURITY DEFINER helper encoding §2: A when payment/KYC evidence or "ready to invest" signals present; B when clear interest + budget ≥ threshold + docs requested; C interested but not ready; D incomplete/out-of-market/unresponsive. Called on insert to prefill `lead_grade` when `grade_source='auto'`.
- `merge_leads(_primary uuid, _duplicate uuid)` (§12, §15) — reassign the duplicate's activities, tasks, status history, event registrations, email sends to `_primary`, copy over any non-null fields the primary is missing, then delete the duplicate. Admin-only (raise unless `is_crm_admin`).
- `enroll_lead_in_sequence(_lead_id uuid, _sequence_id uuid)` — creates/refreshes an `email_enrollments` row and sets `next_send_at` from step 0's delay.
- `stop_email_enrollments(_lead_id uuid, _reason text)` — sets active enrollments to stopped (§7 auto-stop conditions).

---

## Phase 2 — Backend automation (Edge Functions — secrets stay server-side)

### 2a. Facebook Lead Ads webhook (§4)
Create a Supabase **Edge Function** `fb-leads-webhook`:
- `GET` handler answers Meta's verification challenge using `webhook_verify_token` from `fb_lead_sources`.
- `POST` handler receives leadgen events, uses the matching source's `access_token` (from `fb_lead_sources`, server-side only) to fetch full field data from the Graph API, then runs the **capture pipeline** (below).
- Store campaign/ad/form ids and names on the lead; upsert `fb_campaigns`/`fb_ads`; record `cost_per_lead` when insights are available.
- The `access_token` and app secret are **Edge Function secrets**, never returned to the browser. The existing `/crm/settings` "connect page" form already collects page id + token into `fb_lead_sources` — reuse it; do not build a second connector.

### 2b. The capture pipeline (shared server logic — §4, §18)
One reusable path that every intake (FB webhook, website forms, event forms, manual entry) funnels through:
1. **De-dupe** on email/phone/fb_lead_id (§4 guardrail) → update-or-insert into `leads`, set `lead_source`, `captured_at`.
2. Append a `lead_activities` row ("enquiry received", meta = payload).
3. `recommend_lead_grade` → set grade if auto.
4. Call the existing `autoAssignLead` (rules → round-robin) — it already creates the first task + agent notification.
5. **Enqueue the immediate email** (Phase 2c) and enroll the lead in the matching `email_sequences` (`enroll_lead_in_sequence`).
Extend `submitEnquiry` in `enquiry.functions.ts` to call this pipeline (today it only inserts a row — add de-dupe, grading, assignment, and email enqueue). Add sibling server fns `submitInvestmentEnquiry` and `submitEventRegistration` that reuse the same pipeline with the right `lead_source`.

### 2c. Email delivery (§6, §7)
- Create an Edge Function `send-email` that calls **one** transactional provider (Resend recommended; SendGrid/Mailgun/Brevo/SES/Postmark all acceptable) using an API key from Edge Function secrets. It renders an `email_templates` row, substitutes dynamic fields (§8 list: first_name, full_name, property_name, property_location, property_price, investment_model, adviser_name, adviser_phone, event_name, event_date, event_venue, registration_link, property_details_link), appends the Kay-Steph brand wrapper and an **unsubscribe link** built from `leads.unsubscribe_token`, sends, and writes an `email_sends` row with the provider message id + status.
- Create a scheduled Edge Function `process-email-queue` (cron, e.g. every 5 min) that: (a) sends any `email_sends` with status `queued` and `scheduled_for <= now()`; (b) advances `email_enrollments` — when `next_send_at <= now()`, queue the current step's template, bump `current_step`, set the next `next_send_at` from the next step's delay, mark `completed` at the end. Immediately after a §6 confirmation, queue step 0.
- **Auto-stop (§7):** a lead reply, `inspection_booked`/`inspection_completed`, `converted`, `unsubscribed`, admin manual stop, or `not_interested` all call `stop_email_enrollments`. Wire these into the status-change flow and the unsubscribe endpoint.
- **Unsubscribe endpoint:** a public route/function that takes `unsubscribe_token`, sets `unsubscribed_at`, stops enrollments, and blocks all future **marketing** sends (transactional confirmations may still go out). The `send-email` function must refuse to send marketing email to an unsubscribed lead.

---

## Phase 3 — CRM UI (fit into the existing `/crm` workspace; dark theme)

Extend the subnav in `src/routes/_authenticated/crm.tsx` (currently Inbox / Pipeline / Opportunities / Ads / Settings) toward the §17 map, adding these routes under `src/routes/_authenticated/`:
- **`crm.lead.$id.tsx`** — the single **complete lead profile** (§12): contact block, source + grade (with manual override select), property interests, budget, investment preference, FB campaign details, event registrations, **email history** (from `email_sends`), tasks, appointments, KYC/payment status, and the full **activity timeline** (merge `lead_activities` + `lead_status_history` chronologically). This is the biggest missing screen — the Inbox and Pipeline currently have no drill-in.
- **`crm.tasks.tsx`** (§11) — tasks & reminders across leads, filter by adviser/type/overdue; create call/whatsapp/email/inspection/document/payment/KYC reminders (extend `task_type` enum with `whatsapp`, `document_request`, `kyc_reminder`, `meeting` via `ADD VALUE IF NOT EXISTS`).
- **`crm.events.tsx`** (§5) — create/manage events & workshops, view registrations, set attendance status, trigger reminders.
- **`crm.emails.tsx`** (§8) — Email Templates & Automations admin: template CRUD with dynamic-field insert + test-send, sequence builder (steps + delays + trigger + stop conditions), activate/pause, and a delivery view reading `email_sends` (sent/opened/clicked/bounced).
- **`crm.grades.tsx`** (§2) — leads grouped by A/B/C/D with counts and manual re-grade.
- **`crm.import.tsx`** (§15) — CSV import (map columns → run the capture pipeline with de-dupe) and export current lead view to CSV.
- Upgrade **`crm.index.tsx`** (Inbox) into / alongside a **dashboard** (§13) with the metric cards: total leads, new today, by source, by grade, by property, by location, by investment preference, per-adviser load, uncontacted, overdue follow-ups, events registered, inspections booked, qualified, payment-stage, converted, conversion rate, plus FB campaign + email-delivery summaries. `/crm/ads` already covers §14 (Facebook campaign reporting) — extend it with qualified-leads / inspections / applications / payments-approved / total value / conversion-rate columns rather than building a new page.
- Add **Facebook Leads**, **Website Enquiries**, **Event Registrations** as filtered views of the leads list keyed on `lead_source` (not new tables).
- **Consent & audit (§16):** show consent status on each lead; add unsubscribe-request handling and a consent/audit view for admins (reuse `lead_activities` + any existing `audit_logs`). Every form (website, investment, event) must include the §16 consent checkbox and write `consent_given/consent_at/consent_source`; do not enroll a lead in marketing sequences without consent.

Keep the existing dark CRM styling and the admin-only gating already in `crm.tsx` (agents are redirected appropriately; admin sees settings/emails/import).

---

## Phase 4 — Public-facing forms (§5, §6)
Build the event/workshop registration form (fields per §5) and an investment-enquiry form as public routes that post to the new server fns (`submitEventRegistration`, `submitInvestmentEnquiry`). Reuse the existing enquiry form pattern in `src/lib/enquiry.functions.ts` + its form component. Each posts through the Phase-2 capture pipeline, so de-dupe, grading, assignment, immediate email, and sequence enrollment all happen automatically. The §6 email copy (property enquiry / event confirmation / investment enquiry) becomes three seeded `email_templates` rows.

---

## Phase 5 — Verification checklist (all must pass before you finish)
1. `npx tsc --noEmit` and `npm run build` pass.
2. A website/investment/event submission with a **new** email creates one lead, assigns an adviser, logs an activity, and queues the §6 confirmation email; submitting again with the **same** email or phone updates that lead and adds an activity — **no duplicate row**.
3. A Facebook Lead Ad test submission (Meta test tool) verifies the webhook, captures the lead with campaign/ad/form names, and runs the full pipeline.
4. Advancing a lead to `inspection_booked`, marking it `converted`, or hitting the unsubscribe link **stops** its active email sequence (`email_enrollments.status = stopped`).
5. Marketing email to an unsubscribed lead is refused; the unsubscribe link works from a real send.
6. Pipeline board shows all statuses in order; grades A–D filter correctly and can be overridden manually.
7. Secrets check: no Facebook token or email API key appears in any client bundle or committed file; all sending/webhook logic runs server-side.
8. The CRM has no demo mode: it requires a real signed-in account with a CRM role, and empty tables must render an empty state rather than placeholder rows.

**Deployment order:** run the new migration in Lovable Cloud → set the Edge Function secrets (email API key, FB app secret) → deploy the `fb-leads-webhook`, `send-email`, `process-email-queue` functions and register the FB webhook URL → then ship the UI.

## Reuse map — instruction section → where it lands
| §  | Section | Status | Action |
|----|---------|--------|--------|
| 1  | Lead fields | Partial | Add whatsapp/country/property_type/consent/contact-method cols + investment_type values |
| 2  | Lead grading A–D | New | `lead_grade` col + `recommend_lead_grade` RPC + `/crm/grades` |
| 3  | Lead sources | Partial | Structured `lead_source` enum (raw_payload already stores origin) |
| 4  | Facebook Lead Ads | Infra only | Build `fb-leads-webhook` Edge Fn on top of existing `fb_lead_sources` |
| 5  | Events & workshops | New | `events` + `event_registrations` tables + `/crm/events` + public form |
| 6  | Immediate email | New | `send-email` Edge Fn + seeded templates |
| 7  | Scheduled sequences | New | `email_sequences`/`_steps`/`_enrollments` + `process-email-queue` cron |
| 8  | Template management | New | `email_templates` + `/crm/emails` |
| 9  | Pipeline (18 stages) | Partial | Add missing `lead_status` values, map the rest to existing (pipeline UI exists) |
| 10 | Lead assignment | Exists | `assignment_rules` + `autoAssignLead` — extend match criteria |
| 11 | Tasks & reminders | Partial | `follow_up_tasks` exists — add task types + `/crm/tasks` |
| 12 | Complete lead profile | Missing UI | Build `/crm/lead/$id` (data all exists) + `merge_leads` |
| 13 | CRM dashboard | Partial | Upgrade `crm.index` with metric cards |
| 14 | FB campaign reporting | Exists | Extend `/crm/ads` columns |
| 15 | Admin controls | Partial | CSV import/export, merge, consent view |
| 16 | Privacy & consent | New | Consent cols + unsubscribe endpoint + gating |
| 17 | Navigation | Partial | Extend `crm.tsx` subnav |
| 18 | Workflow | Orchestration | The Phase-2 capture pipeline ties it together |
