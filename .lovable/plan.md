## Goal

Reframe the investor story from five parallel models to **three product categories** (Full Purchase, Group Buy, Tokenized Ownership) with the SPV shown as protective infrastructure — not a fourth option — across the marketing site.

## 1. Data model — `src/lib/properties.ts`

- Narrow `InvestmentModel` to `"full_purchase" | "group_buy" | "tokenized"`.
- Update `INVESTMENT_MODEL_LABEL` to: Full purchase / Group buy / Tokenized ownership.
- Migrate each property's `investmentModels` array with the mapping:
  - `group_purchase` → `group_buy`
  - `fractional`, `spv`, `tokenized` → `tokenized`
  - deduplicate.
- Result per property (all include `full_purchase` today):
  - Guzape Dream Homes: full_purchase, group_buy
  - Ruby's Apartment: full_purchase, tokenized
  - Lillycrest Terrace: full_purchase, group_buy, tokenized
  - Lillycrest Residence: full_purchase, group_buy
  - Estate Plots Phase II: full_purchase, group_buy, tokenized

## 2. Invest page — `src/routes/invest.index.tsx`

Replace the "Ways to invest" section with:

**(a) Three cards** (same visual template as today — icon, tagline, title, body, bullets, entry line) in this order:

- **Full Purchase** (Building2) — "Own it outright". Entry: From ₦32.5M (estate plots).
- **Group Buy** (Users) — "Buy together, at scale". Four bullets including "Shared outcomes are held in a dedicated SPV (see below)". Entry: Set per pool (typically from ₦10M).
- **Tokenized Ownership** (Coins) — "Own a documented fraction, from ₦1M". Body rendered as three labelled beats (What you own / How it's counted / What you get). Bullets: Proportional ownership units · Per-unit income distributions · Unit resale to verified investors. Entry: From ₦1M per unit; larger contributions from ₦5M work the same way — just more units.

The "Not sure which fits?" adviser card stays as the fourth slot on the grid.

**(b) Full-width SPV protection strip** immediately below the cards — navy background, gold accent, shield/landmark icon, titled *"How shared ownership is protected: the SPV"*, containing the exact copy provided. Styled as a horizontal band spanning the container, not a card.

**(c) Comparison table** below the strip, with rows: You own / Entry / Held via / Income / Liquidity / Best for and the three model columns. Responsive: horizontal scroll on small screens, standard table on ≥md.

**(d) Copy sweep on the same page:**
- Hero description: rewrite to "Three structured routes into premium Abuja real estate — buy outright, join a group buy, or hold tokenized units from ₦1M. Every route is verified, documented and protected by a dedicated SPV."
- Ensure the capital ladder **₦1M → ₦10M → ₦32.5M+** appears explicitly (in the hero or intro under the three cards).
- Route `head()`: retitle to "Invest with Kay-Steph | Full Purchase, Group Buy & Tokenized Property in Abuja" and rewrite meta description / og:description to the three-category framing.
- Any remaining "SPV arrangement" / "fractional" copy on this page is retired.

## 3. Properties listing — `src/routes/properties.index.tsx`

- Investment-model filter offers exactly three options: Full purchase, Group buy, Tokenized ownership (source from updated `INVESTMENT_MODEL_LABEL`).
- Card badges pick up the new labels automatically.
- Any hard-coded model strings replaced with the new enum values.

## 4. FAQ — `src/routes/faq.tsx`

- Rename the "SPVs & tokenization" category description so the SPV reads as the protective wrapper behind **all** shared ownership (group buys included), not a product.
- In the "Fractional & group investment" category, rewrite copy so fractional ownership is described as the same product as tokenized units — a fraction counted in units — not a separate route. Keep the "Is tokenization the same as cryptocurrency? — No" Q&A prominent (front of its category).

## 5. Consistency sweep (presentation only)

Files touched from a grep for `fractional`, `SPV arrangement`, `Five routes/models`, `group_purchase`, `tokeniz`:

- `src/routes/index.tsx` (home)
- `src/routes/why-kaysteph.tsx`
- `src/routes/services.tsx`
- `src/routes/about.tsx`
- `src/routes/team.tsx`
- `src/routes/contact.tsx`
- `src/routes/blog.tsx`
- `src/routes/market-report.tsx` (if referenced)
- Any login/capability list mentioning the five models

Rules for the sweep:
- Replace product-name uses of "Fractional ownership" and "SPV arrangement" with the three-category names.
- Where "five models/routes" appears, change to "three routes".
- Keep SPV mentions only where they describe **protection** of shared ownership.
- Do not touch dashboards' internal data or the database schema.

## 6. Verification

- `bunx tsgo --noEmit` clean.
- Manual visual check of `/invest`, `/properties`, `/faq` — 3 cards + SPV strip + table; filter shows 3 options; FAQ wording updated.

## Out of scope

- Authenticated dashboard content and any DB schema changes.
- Redesign of unrelated sections (hero visuals, steps, risks, eligibility, contribution examples).
