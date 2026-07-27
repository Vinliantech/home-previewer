import { describe, expect, it } from "vitest";
import { Constants } from "@/integrations/supabase/types";
import { ROLE_LABELS, STAFF_ROLES, roleLabel } from "@/lib/roles";

// Guards the exact drift this module was created to end: role lists living in
// several files and disagreeing with each other or with the database enum.
describe("staff roles", () => {
  it("every staff role has a human label", () => {
    for (const role of STAFF_ROLES) {
      expect(ROLE_LABELS[role], `missing label for ${role}`).toBeTruthy();
    }
  });

  it("has no labels for roles that do not exist", () => {
    for (const key of Object.keys(ROLE_LABELS)) {
      expect(STAFF_ROLES, `label for unknown role ${key}`).toContain(key);
    }
  });

  it("every staff role exists in the app_role enum types", () => {
    // Catches the historical bug where the UI offered content roles the
    // database enum did not yet have — granting them threw at runtime.
    const enumRoles = Constants.public.Enums.app_role as readonly string[];
    for (const role of STAFF_ROLES) {
      expect(enumRoles, `${role} is not in app_role — add the enum migration first`).toContain(
        role,
      );
    }
  });

  it("client is an enum value but never a grantable staff role", () => {
    const enumRoles = Constants.public.Enums.app_role as readonly string[];
    expect(enumRoles).toContain("client");
    expect(STAFF_ROLES as readonly string[]).not.toContain("client");
  });

  it("roleLabel tolerates unknown historical values", () => {
    expect(roleLabel("some_legacy_role")).toBe("some legacy role");
    expect(roleLabel("crm_manager")).toBe("CRM Manager");
  });
});
