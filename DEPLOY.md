# Kay-Steph Group — Deployment Guide

This is a **TanStack Start** application: a React front end with a Node server
side (Supabase auth and data, server functions, the Meta Lead Ads webhook,
Resend transactional email). It is **not a static site** — copying the files
into `public_html` will not run it. Use one of the two paths below.

---

## 0. What you need before deploying

| Requirement | Why |
|---|---|
| Node.js 20+ | Build and run the server |
| A Supabase project | Database, auth, storage — the entire backend |
| Resend account + API key | CRM acknowledgement emails and staff invites |
| Brevo account + API key | Workshop registration confirmations and event lists |
| Meta app credentials (optional at launch) | Facebook Lead Ads capture |
| The `.env` values | Copy `.env.example` to `.env` and fill every value |

**Never commit or upload `.env` anywhere public. The
`SUPABASE_SERVICE_ROLE_KEY` bypasses all row-level security.**

---

## 1. Set up the database (run once per Supabase project)

Run every file in `supabase/migrations/` **in filename order** (they are
timestamped — sort ascending). In the Supabase Dashboard: SQL Editor → paste →
run, one after another. All 31 are forward-only and idempotent; re-running is
safe.

```
20260711174903…  roles, profiles, signup trigger
20260711175858…  affiliate programme
20260711175918…  affiliate extras
20260711181717…  sales_agent role
20260711181824…  CRM core (leads, tasks, opportunities, fb tables)
20260711183201…  tokenized investment engine
20260711184007…  investment extras
20260712010000…  production hardening
20260715120000…  group pools
20260715130000…  estate operations
20260716090000…  CRM workspace (grading, events, email queue)
20260717090000…  CRM lead matching (dedupe keys)  ← code depends on this
20260717100000…  crm_manager role
20260717110000…  staff directory
20260717120000…  staff approval flow
20260717130000…  client detail sync
20260717143000…  social/blog content system
20260719090000…  security hardening (role RPCs, audit)
20260723010000…  real property catalogue (replaces the placeholder seed)
20260723020000…  connected portal controls (plot holds, payment plans,
                 affiliate supervisors)
20260723030000…  staff-directory role grants
20260723040000…  unified property catalogue  ← the public site, portals and
                 admin all read this; skipping it leaves the catalogue broken
20260725010000…  affiliate referrals into the CRM (links client_leads to the
                 lead pipeline; backfills past referrals where the match is
                 unambiguous)
20260726010000…  affiliates cannot be activated without a staff supervisor
20260726020000…  client documentation numbers (KS-C-#####) and the reviewed
                 client/admin document exchange  ← needs a PRIVATE storage
                 bucket named "client-documents" created in the dashboard
20260726030000…  admin review of client identity verification, and a guard
                 stopping clients writing their own verification status
20260726040000…  group-buy membership (claims invitations on sign-up,
                 reveals co-members and their contributions)
20260726050000…  lead capture reliability (queues any inbound lead whose
                 capture failed, so none is lost)
20260727010000…  CRM advisers are created from the staff directory, and their
                 contact details follow their staff record
20260727020000…  workshop registrations (reference numbers, per-event email
                 de-duplication, Brevo delivery tracking)
20260727030000…  write-only integration credential store, so the Brevo key can
                 be set from the CRM without any account being able to read it
```

Then, in Supabase Dashboard → Authentication → URL Configuration, set the Site
URL to your domain so invite/recovery links point at production.

---

## 2A. Path A — cPanel with "Setup Node.js App"

Your host must offer the Node.js application feature (Passenger). Shared plans
without it cannot run this site — use Path B instead.

1. Upload this zip and extract it to a folder **outside** `public_html`, e.g.
   `~/kaysteph-app`.
2. cPanel → **Setup Node.js App** → Create application:
   - Node version: 20+
   - Application root: `kaysteph-app`
   - Application mode: Production
   - **Application startup file:** `.output/server/index.mjs`
3. In the app's environment-variables panel, add every value from `.env`
   (Passenger does not read `.env` files automatically).
4. In the app's terminal (or cPanel terminal):
   ```bash
   cd ~/kaysteph-app
   npm install
   npm run build        # produces .output/  (needs ~2GB RAM; see note)
   ```
5. Restart the application. The site now serves on the domain the app is
   attached to.

> **If the build dies on the server** (shared hosts often cap memory): run
> `npm install && npm run build` on your own machine, then upload the whole
> folder *including* `.output/`, and skip step 4.

## 2B. Path B — keep Lovable (or any Node host) and point your domain

1. Import/sync this source into Lovable (it builds and hosts it).
2. Set the same environment variables in the host's settings panel.
3. In cPanel → Zone Editor, point your domain at the host:
   - either a `CNAME` for `www` to the host's domain, and an `A`/`ALIAS` for
     the apex per their instructions,
   - keep everything else (email MX records) untouched.

This also works for Render / Railway / Fly / Vercel — anything that runs Node.

---

## 3. After first deploy — go-live checklist

- [ ] Sign in at `/admin/auth` with the first super-admin account (create the
      user in Supabase Auth, then grant `super_admin` in User Roles or SQL).
- [ ] `RESEND_API_KEY` + `CRM_EMAIL_FROM` set → submit the contact form and
      confirm the acknowledgement email arrives.
- [ ] `SITE_URL` set → invite a staff member, confirm the email link returns
      to your domain.
- [ ] Meta webhook (when ready): subscribe the app to
      `https://<your-domain>/api/public/meta/webhook` with your
      `META_WEBHOOK_VERIFY_TOKEN`; send a test lead from Meta's testing tool.
- [ ] Meta already has leads? The webhook only hears about submissions made
      while it is subscribed. CRM → Settings → Integrations → **Meta lead
      recovery**: paste the lead form id and Import to pull the leads the
      form already holds (Meta keeps them 90 days). Safe to re-run — leads
      are matched on their Meta id and never duplicated.
- [ ] Check that panel occasionally: any lead whose capture failed is
      queued there with a Retry button, and is NOT in the CRM until retried.
      The card also shows when the last Facebook lead was captured — a long
      silence usually means the page access token has expired.
- [ ] Add at least one sales adviser (CRM → Settings → Team) BEFORE the first
      campaign runs. With none, auto-assignment has nobody to route to and
      every lead lands unassigned with no follow-up task. The CRM dashboard
      shows an Unassigned count for exactly this.
- [ ] Optional: set `META_AD_ACCOUNT_ID` and press "Sync campaign spend" to
      populate cost-per-lead and ROI on Reports. Lead capture works without it.
- [ ] Brevo: set it up in **CRM → Settings → Integrations → Brevo** — API key,
      list id, template id, sender and admin address. The key is stored where
      no signed-in account can read it back, so it can be rotated there
      without a redeploy. The environment variables still work and are the
      fallback when the CRM row is empty, which is how a first deployment
      gets going before anyone can sign in.
      The confirmation template must define FIRST_NAME, FULL_NAME, EMAIL,
      PHONE, LOCATION, GENDER, OCCUPATION, INTEREST, EVENT_NAME and
      REGISTRATION_REFERENCE.
- [ ] Submit a test registration at `/events/youth-network`, then check
      **CRM → Settings → Integrations → Workshop registrations**. A
      registration is never lost when Brevo fails: undelivered confirmations
      are listed there with the error and a Retry button.
- [ ] There is no demo mode. Every portal requires a real Supabase account,
      so create the accounts you need before a walkthrough.
- [ ] Investment bank details (`VITE_INVESTMENT_*`) only after finance
      verifies the production account.

---

## 4. What's in this archive

```
src/                  application code, web-optimised images, tests
supabase/migrations/  the 31 SQL files above
public/               favicon, robots, static files
docs/                 Lovable instruction documents (reference)
source-images/        original full-resolution property renders
.env.example          every variable the app reads — copy to .env and fill
package.json, vite.config.ts, vitest.config.ts, tsconfig…, tailwind…
```

Not included, on purpose: `node_modules/` (recreate with `npm install`),
`.env` (secrets never travel in archives), `.output/` (recreate with
`npm run build`).

Local commands: `npm install` → `npm test` (54 tests) → `npm run dev`
(http://localhost:8080) → `npm run build`.
