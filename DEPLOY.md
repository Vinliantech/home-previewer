# Kay-Steph Group — HostAfrica Self-Hosting Guide

This is a **TanStack Start SSR** application (React + Node server). It is
**not a static site** — copying files into `public_html` will not run it.

Domain: **kaystephgroup.com**
Hosting: **HostAfrica cPanel / DirectAdmin — "Setup Node.js App"**
Startup file: **`.output/server/index.mjs`**

---

## 0. Prerequisites (once)

| Requirement | Notes |
|---|---|
| Node.js **22.12+** on the server | The current HostAfrica panel offers 20.x — open a support ticket asking them to enable Node.js 22 (or the newest LTS) for your account. The build refuses to run on Node 20. |
| A Supabase project | Database, auth, storage — the entire backend. |
| Resend account + API key | CRM acknowledgement emails and staff invites. |
| Brevo account + API key | Workshop registration confirmations. |
| Meta app credentials (optional at launch) | Facebook Lead Ads capture. |
| SSH or FTP access to the account | The GitHub Action deploys via FTP. |

**Never commit `.env` or upload it to a public folder.** The
`SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security.

---

## 1. Set up the Node.js application in cPanel

1. cPanel → **Setup Node.js App** → **Create application**.
2. Fill in:
   - **Node.js version:** `22.x` (must be ≥ 22.12).
   - **Application mode:** `Production`.
   - **Application root:** e.g. `kaysteph-app` (created outside `public_html`).
   - **Application URL:** attach it to `kaystephgroup.com` (and `www`).
   - **Application startup file:** `.output/server/index.mjs`
     *(or `app.mjs` — the workflow uploads a shim that re-exports the same server).*
3. Click **Create**. cPanel prints an `Enter to the virtual environment`
   command — you don't need it for GitHub Actions deploys.
4. Under **Environment variables**, add every key from `.env.example`
   (see §4). Passenger does **not** read `.env` files.
5. Leave the app **Started** — GitHub Actions will restart it via the
   `tmp/restart.txt` file the workflow uploads.

---

## 2. DNS — point kaystephgroup.com at HostAfrica

At your domain registrar (or in cPanel → Zone Editor if DNS is hosted at
HostAfrica), set:

| Type  | Host  | Value |
|-------|-------|-------|
| A     | `@`   | HostAfrica server IP (from your welcome email / cPanel sidebar) |
| CNAME | `www` | `kaystephgroup.com.` |

Leave MX / mail records untouched. DNS propagation is usually 15 min – 2 h.

In cPanel → **Domains**, make sure `kaystephgroup.com` (and `www`) is
attached to the Node.js app. Then cPanel → **SSL/TLS Status** → run
**AutoSSL** to issue Let's Encrypt certificates for both.

---

## 3. GitHub Actions deploy — required repo secrets

Set these in the repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `FTP_SERVER` | HostAfrica FTP hostname (e.g. `ftp.kaystephgroup.com` or the server hostname from your welcome email). |
| `FTP_USERNAME` | Your cPanel FTP user. |
| `FTP_PASSWORD` | That user's password. |
| `FTP_APP_DIR` | **The Node app root**, NOT `public_html`. Example: `/kaysteph-app/`. |

Push to `main` (or click **Run workflow**) and the action will:
1. Install Node.js 22 on the runner.
2. `npm install`.
3. `NITRO_PRESET=node-server npm run build` → produces `.output/`.
4. Package `.output/`, `package.json`, `package-lock.json`, `app.mjs`, and
   `tmp/restart.txt`.
5. Upload the payload via FTP into `FTP_APP_DIR`.

After the workflow finishes, click **Restart** on the Node.js app in cPanel
(the touched `tmp/restart.txt` also triggers Passenger to reload).

---

## 4. Files that must live in the Node app root on the server

After a successful deploy, the app root (e.g. `~/kaysteph-app/`) contains:

```
kaysteph-app/
├── .output/                 # Nitro node-server build (uploaded)
│   ├── server/
│   │   ├── index.mjs        # ← Application startup file
│   │   └── ...              # bundled server + node_modules
│   └── public/              # static assets served by the Node server
├── package.json             # uploaded (for reference / npm scripts)
├── package-lock.json        # uploaded
├── app.mjs                  # small shim → imports .output/server/index.mjs
└── tmp/
    └── restart.txt          # touch to reload Passenger
```

**You do NOT need to run `npm install` on the server** — the Nitro
`node-server` preset bundles all runtime dependencies inside
`.output/server/node_modules/`.

---

## 5. Required production environment variables

Copy every value into cPanel → Node.js App → **Environment variables**:

```
# --- Supabase (backend) ---
SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only — never expose to browser
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# --- Site identity ---
SITE_URL=https://kaystephgroup.com
PUBLIC_SITE_URL=https://kaystephgroup.com

# --- Investment bank details (client portal) ---
VITE_INVESTMENT_BANK_NAME=
VITE_INVESTMENT_ACCOUNT_NAME=
VITE_INVESTMENT_ACCOUNT_NUMBER=

# --- Meta Lead Ads (server-only) ---
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=
META_PAGE_ACCESS_TOKEN=
META_PAGE_ID=
META_GRAPH_API_VERSION=
META_AD_ACCOUNT_ID=

# --- Resend (CRM transactional email) ---
RESEND_API_KEY=
CRM_EMAIL_FROM=Kay-Steph Group <enquiries@kaystephgroup.com>

# --- Brevo (workshop registration email) ---
BREVO_API_KEY=
BREVO_LIST_ID=
BREVO_TEMPLATE_ID=
BREVO_SENDER_NAME=Kay-Steph Group
BREVO_SENDER_EMAIL=events@kaystephgroup.com
KAYSTEPH_ADMIN_EMAIL=

# --- WhatsApp Business (optional) ---
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

Any `VITE_*` variable must ALSO be present at build time on the GitHub
Actions runner if you use it in client code — add those as repo secrets
and reference them under an `env:` block on the `Build` step. Server-only
keys (Supabase service role, Meta, Resend, Brevo, WhatsApp) only need to
exist on the HostAfrica side.

---

## 6. Database migrations (once per Supabase project)

Run every file in `supabase/migrations/` **in filename order** via the
Supabase SQL editor. They are idempotent — re-running is safe. See the
in-repo history for the full list; the ones that matter for a new
environment:

- roles / profiles / signup trigger
- affiliate programme + extras
- CRM core (leads, tasks, opportunities, FB tables)
- tokenized investment engine + extras
- group pools
- estate operations
- CRM workspace, lead matching, staff directory
- security hardening (role RPCs, audit)
- unified property catalogue
- client documentation (needs a **private** storage bucket called
  `client-documents` created in the dashboard)
- workshop registrations
- write-only integration credential store

Then Supabase Dashboard → **Authentication → URL Configuration** → set the
Site URL to `https://kaystephgroup.com`.

---

## 7. Go-live checklist

- [ ] cPanel Node.js app shows **Running** with startup file
      `.output/server/index.mjs`.
- [ ] `https://kaystephgroup.com` returns the homepage over HTTPS.
- [ ] `/admin/auth` loads and the first super-admin can sign in.
- [ ] Contact form → acknowledgement email arrives (Resend key OK).
- [ ] Workshop registration → confirmation email arrives (Brevo key OK).
- [ ] Meta webhook subscribed to
      `https://kaystephgroup.com/api/public/meta/webhook`.
- [ ] Existing Meta leads imported via CRM → Settings → Integrations →
      Meta lead recovery.
- [ ] At least one sales adviser exists BEFORE marketing goes live.

---

## 8. Troubleshooting

**"Application failed to start"** — cPanel shows this if the Node version is
too low. Confirm the panel version selector says 22.x. If only 20.x is
available, open a HostAfrica support ticket asking them to enable Node 22.

**Site loads but every server function 500s** — an env var is missing. Open
the app's log in cPanel (Node.js App → Logs) and check which key is
`undefined`.

**Deploy uploaded but old code still serves** — Passenger caches the
process. Click **Restart** in cPanel, or in File Manager touch
`tmp/restart.txt` inside the app root.

**Build fails on the runner with `EBADENGINE`** — the workflow already pins
Node 22. If you're building locally, run `nvm use 22` first.
