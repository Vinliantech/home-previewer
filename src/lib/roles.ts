/**
 * The single source of truth for staff roles.
 *
 * Import from here — never redeclare a role list or label map in a component.
 * This file previously existed as five separate copies (staff admin page,
 * staff profile page, user-roles module, staff server functions), and they
 * drifted: the UI once offered content roles the database enum did not have.
 * Keep it dependency-free so both browser components and server functions can
 * import it.
 *
 * Adding a role means three places, in order:
 *   1. `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS '<role>'` migration
 *   2. the `app_role` union in src/integrations/supabase/types.ts
 *   3. this file (STAFF_ROLES + ROLE_LABELS — the test suite fails otherwise)
 */

/** Every grantable staff role, in the order pickers display them. */
export const STAFF_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "crm_manager",
  "content_manager",
  "content_editor",
  "content_author",
  "seo_manager",
  "social_media_manager",
  "sales_agent",
  "property_manager",
  "finance_officer",
  "compliance_officer",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  crm_manager: "CRM Manager",
  content_manager: "Content Manager",
  content_editor: "Content Editor",
  content_author: "Content Author",
  seo_manager: "SEO Manager",
  social_media_manager: "Social Media Manager",
  sales_agent: "Sales Agent",
  property_manager: "Property Manager",
  finance_officer: "Finance Officer",
  compliance_officer: "Compliance Officer",
};

/** What a role unlocks, shown under pickers. Optional per role. */
export const ROLE_HINTS: Partial<Record<StaffRole, string>> = {
  crm_manager: "Full CRM workspace only — no access to the platform control centre.",
  content_manager: "Full Blog & Content workspace, including team and publishing settings.",
  content_editor: "Edit, review, schedule and publish Journal content.",
  content_author: "Create drafts and submit stories for review.",
  seo_manager: "Manage content metadata, sitemap controls and search reporting.",
  social_media_manager: "Prepare, schedule and publish approved social variations.",
};

/** Human label for any role value, tolerating unknown strings from old data. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role as StaffRole] ?? role.replace(/_/g, " ");
}
