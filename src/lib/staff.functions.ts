import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STAFF_ROLES } from "@/lib/roles";

/**
 * Staff directory administration is not wired to the current schema in this
 * build (staff_members, staff_change_requests and related tables are not
 * provisioned). Every server function throws a friendly message so admin
 * screens surface a clear "not available yet" state instead of crashing.
 */

const notReady = () => {
  throw new Error("The staff directory is not connected in this environment yet.");
};

const anyInput = (input: unknown) => (input ?? {}) as any;

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ staff: [] as any[] }));

export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const resendStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ staffId: z.string().uuid() }).parse(input))
  .handler(async () => notReady());

export const updateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const approveStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ staffId: z.string().uuid() }).parse(input))
  .handler(async () => notReady());

export const rejectStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const listStaffChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ requests: [] as any[] }));

export const reviewStaffChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const myStaffProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ staff: null as any }));

export const updateMyStaffContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const requestStaffChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(anyInput)
  .handler(async () => notReady());

export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ staffId: z.string().uuid() }).parse(input))
  .handler(async () => notReady());

export type { StaffRole } from "@/lib/roles";
export const STAFF_ROLE_OPTIONS = STAFF_ROLES;
