/**
 * CRM auto-assignment is not wired to the current schema yet. This is a
 * no-op stub so callers (public form, event, Meta webhook) continue to work
 * without pretending an adviser was assigned.
 */
export async function autoAssignCrmLead(_leadId: string): Promise<string | null> {
  return null;
}
