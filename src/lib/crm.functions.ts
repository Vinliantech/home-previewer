import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * CRM server functions are placeholders in this build — the underlying CRM
 * schema (assignment_rules, follow_up_tasks, lead_activities, crm_notifications
 * and related tables) is not provisioned. Handlers throw a friendly error so
 * calling UIs surface an actionable message instead of a silent failure.
 */

const notReady = () => {
  throw new Error("The CRM workspace is not connected in this environment yet.");
};

const anyInput = (input: unknown) => (input ?? {}) as Record<string, unknown>;

export const assignLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const autoAssignLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async () => notReady());

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const updateLeadGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const addLeadNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const createFollowUpTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const completeFollowUpTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const convertToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const createManualLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const createCrmEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const toggleAutomationSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const createAutomationSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const getCrmIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({
    meta: { connected: false },
    email: { connected: false },
    whatsapp: { connected: false },
  }));

export const sendTestCrmEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ email: z.string().email() }).parse(input))
  .handler(async () => notReady());
