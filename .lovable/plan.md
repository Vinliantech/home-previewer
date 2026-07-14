# Redesign investor dashboard to match reference

Rework `src/routes/_authenticated/dashboard.tsx` so the client portal matches the two uploaded screenshots — a light, bank-style layout with a full-height left sidebar, top date bar, KPI row, charts row, holdings list, and recent activity.

## Layout changes

1. **Sidebar** (left, white, full height, `KSS` logo + "Kay-Steph / CLIENT PORTAL"):
   - Overview (active, navy pill w/ gold icon)
   - Section: **INVEST** — Opportunities, My Properties, My Tokens
   - Section: **MONEY** — Returns, Wallet, Transactions, Statements
   - Section: **DOCUMENTS** — Certificates, Exit Requests
   - Section: **ACCOUNT** — KYC Verification, Profile & Security, Notifications (badge 2), Support
   - Bottom: Sign out
   - All non-implemented links route to `/dashboard` for now (no new routes).

2. **Top bar**: light, shows "Tuesday, 14 July 2026" left; right side notification bell with badge + user chip (initials circle navy/gold + "Demo Client" + chevron). Removes search.

3. **Main content** on `bg-[oklch(0.98_0.005_260)]`:
   - Header row: "Welcome back, {firstName}" + subtitle; right: **+ New investment** (navy) and **Statement** (white outline) buttons.
   - **KPI cards** (4-up): Total Invested ₦26,500,000 · Current Value ₦28,525,000 (+₦2,025,000 +7.6% green) · Wallet Balance ₦745,000 · Rental Earned ₦1,115,000 (2 active holdings). Each with small icon chip top-right.
   - **Charts row** (2-up):
     - *Portfolio allocation* — donut (SVG) navy + gold, legend rows Ruby's Apartment ₦15,400,000 / Lillycrest Terrace ₦13,125,000.
     - *Rental income* — 5 gold bar chart (Feb–Jun 26).
   - **My holdings** card: thumbnail + name + Contributed / Ownership / Share value + status pill (APPROVED green, AWAITING COMPANY APPROVAL amber). Rows: Ruby's Apartment, Lillycrest Terrace, Estate Plots — Phase II. "View all →" top-right.
   - **Recent activity** card: rows for Contribution (red negative) and Rental Distribution (green positive) with property + date. "All transactions →" top-right.

## Data

All values are hardcoded demo data inside the dashboard file (matches current placeholder approach — no DB wiring). Uses existing property images from `src/lib/properties.ts` where available; falls back to a colored tile.

## Scope

- Only edits `src/routes/_authenticated/dashboard.tsx`.
- Uses existing tokens (`navy`, `gold`, `cream`) — no new CSS variables.
- Donut + bars rendered as inline SVG (no chart library added).
- No new routes, no schema/auth changes, no changes to other pages.

## Verification

Visual check at `/dashboard` after sign-in against both reference screenshots; `tsgo --noEmit` clean.
