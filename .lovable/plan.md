## Add Phase 2 — Group Buy Pools

Wire the uploaded `phase2-group-pools` package into the app: DB schema, server functions, and 4 new authenticated routes (pools list, pool detail, portfolio wrapper, admin console).

### What ships

**1. Database migration** (`supabase/migrations/<new>_group_pools.sql`)
Use the uploaded SQL, with two small edits so it applies cleanly on the current schema:
- Drop the FK to `public.tokenized_properties` (that table doesn't exist yet); keep `property_id uuid` as a loose reference plus `property_name text`.
- Replace calls to `public.is_admin(auth.uid())` with `public.has_role(auth.uid(), 'admin'::public.app_role)` since the project already ships `has_role` and no `is_admin`.

Creates: enums (`pool_visibility`, `pool_status`, `pool_member_status`), tables `group_pools` and `pool_members`, `SECURITY DEFINER` helpers `is_pool_member` / `is_pool_founder`, RLS + GRANTs for `authenticated` and `service_role`, and admin RPCs `admin_review_pool` / `admin_set_pool_member_status`.

**2. Library files (copied verbatim from the zip)**
- `src/lib/pools.ts` — shared types & labels.
- `src/lib/pools.functions.ts` — server functions (list, detail, create, join, admin actions) with `requireSupabaseAuth` middleware.
- `src/lib/demo.ts` — demo/seed helpers used by the routes.

Adjust only if TypeScript compile fails against current `Database` types; otherwise leave untouched per the "do not restructure" convention we've followed.

**3. New authenticated routes** (copied from the zip)
- `src/routes/_authenticated/portfolio.tsx` — portfolio layout with `<Outlet />`.
- `src/routes/_authenticated/portfolio.pools.index.tsx` — `/portfolio/pools` list.
- `src/routes/_authenticated/portfolio.pools.$id.tsx` — `/portfolio/pools/:id` detail.
- `src/routes/_authenticated/admin.tsx` — `/admin` console (gated by `has_role admin`).

**4. Sidebar wiring**
Add "Group Pools" (→ `/portfolio/pools`) and "Admin" (→ `/admin`, admin-only) links inside `src/components/portal/PortalShell.tsx`.

### Out of scope
- The loose `script.js` / `styles.css` uploads (plain-HTML template snippets) — not integrated; the app already has its own header/nav/reveal logic.
- Creating a `tokenized_properties` table (Phase 3 work).
- Any change to the public marketing site or existing Group Buy landing form.

### Technical notes
- All new server fns use `createServerFn().middleware([requireSupabaseAuth])`, matching `server-functions-modern`.
- `routeTree.gen.ts` will regenerate automatically from the new route files.
- After migration approval, `src/integrations/supabase/types.ts` regenerates and the copied `pools.functions.ts` will typecheck against the new tables.

Confirm and I'll implement.
