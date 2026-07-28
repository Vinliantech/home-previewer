import { createClientFn } from "@/lib/client-function";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STAFF_ROLES } from "@/lib/roles";
import type { Database } from "@/integrations/supabase/types";
import { invokeEdgeFunction } from "@/integrations/supabase/edge";

/**
 * Staff directory administration.
 *
 * Inviting somebody needs the Supabase auth admin API, which runs with the
 * service key and therefore bypasses RLS. Every function here must prove the
 * caller is a platform admin with their own session before touching that
 * client — RLS cannot do it for us.
 */

const staffDetails = {
  fullName: z.string().trim().min(2, "Enter the staff member's full name").max(120),
  position: z.string().trim().max(80).optional(),
  department: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(24).optional(),
  whatsappNumber: z.string().trim().max(24).optional(),
  startedOn: z.string().trim().max(10).optional(),
  notes: z.string().trim().max(1000).optional(),
};

const inviteSchema = z.object({
  ...staffDetails,
  email: z.string().trim().email("Enter a valid email address").max(160),
  role: z.enum(STAFF_ROLES),
});

const updateSchema = z.object({
  ...staffDetails,
  staffId: z.string().uuid(),
  role: z.enum(STAFF_ROLES).optional(),
  status: z.enum(["invited", "pending_approval", "active", "suspended"]).optional(),
});

/** Throws unless the caller holds platform admin rights on their own session. */
async function assertPlatformAdmin(context: {
  supabase: SupabaseClient<Database>;
  userId: string;
}) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("You do not have permission to manage staff.");
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Everyone in the directory, with their permission roles attached. */
export const listStaff = createClientFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: staff, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("full_name");
    if (error) throw new Error(error.message);

    const userIds = (staff ?? []).map((s) => s.user_id).filter((id): id is string => Boolean(id));
    let roles: { user_id: string; role: string }[] = [];
    if (userIds.length) {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      roles = (data ?? []) as { user_id: string; role: string }[];
    }
    return (staff ?? []).map((member) => ({
      ...member,
      roles: roles.filter((r) => r.user_id === member.user_id).map((r) => r.role),
    }));
  });

/**
 * Creates the staff record, provisions the auth account and emails a
 * set-password link. The link is generated (not sent) by Supabase so the
 * message goes out through our own branded Resend template.
 */
export const inviteStaff = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => inviteSchema.parse(input))
  .handler(({ data }) =>
    invokeEdgeFunction<{
      ok: true;
      staffId: string;
      emailSent: boolean;
      inviteLink: string | null;
    }>("staff-workflows", "invite", { ...data, email: normaliseEmail(data.email) }),
  );

/** Re-issues the set-password link for someone who has not signed in yet. */
export const resendStaffInvite = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ staffId: z.string().uuid() }).parse(input))
  .handler(({ data }) =>
    invokeEdgeFunction<{ ok: true; emailSent: boolean; inviteLink: string }>(
      "staff-workflows",
      "resend_invite",
      data,
    ),
  );

/** Edits the human record, and the permission role when one is supplied. */
export const updateStaff = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => updateSchema.parse(input))
  .handler(({ data }) =>
    invokeEdgeFunction<{ ok: true }>("staff-workflows", "update", data),
  );

/**
 * Grants access to someone who has signed in and is waiting. The role comes
 * from the record (or an explicit override), and approve_staff_member re-checks
 * admin rights in the database.
 */
export const approveStaff = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ staffId: z.string().uuid(), role: z.enum(STAFF_ROLES).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("approve_staff_member", {
      _staff_id: data.staffId,
      _role: data.role ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Declines a pending staff member. The record is kept for the audit trail. */
export const rejectStaff = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({ staffId: z.string().uuid(), reason: z.string().trim().max(500).optional() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { error } = await context.supabase
      .from("staff_members")
      .update({ status: "suspended", rejected_reason: data.reason || "Access request declined." })
      .eq("id", data.staffId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Open role/position requests raised by staff, newest first. */
export const listStaffChangeRequests = createClientFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("staff_change_requests")
      .select("*, staff_members(id, full_name, email, position, department)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Approving a request applies it; declining records why. */
export const reviewStaffChangeRequest = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        requestId: z.string().uuid(),
        approve: z.boolean(),
        note: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(({ data }) =>
    invokeEdgeFunction<{ ok: true }>("staff-workflows", "review_change", data),
  );

/* ============================ SELF-SERVICE ============================ */

/** The signed-in staff member's own record. RLS scopes this to themselves. */
export const myStaffProfile = createClientFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("staff_members")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) return null;

    const [{ data: roles }, { data: requests }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("staff_change_requests")
        .select("*")
        .eq("staff_id", member.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    return {
      ...member,
      roles: (roles ?? []).map((r) => r.role as string),
      requests: requests ?? [],
    };
  });

/** Staff keep their own phone numbers current; nothing else is self-writable. */
export const updateMyStaffContact = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        phone: z.string().trim().max(24).optional(),
        whatsappNumber: z.string().trim().max(24).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("update_my_staff_contact", {
      _phone: data.phone ?? null,
      _whatsapp: data.whatsappNumber ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Asks an admin for a different role or position. Grants nothing by itself. */
export const requestStaffChange = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        role: z.enum(STAFF_ROLES).optional(),
        position: z.string().trim().max(80).optional(),
        department: z.string().trim().max(80).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("request_staff_change", {
      _role: data.role ?? null,
      _position: data.position ?? null,
      _department: data.department ?? null,
      _note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Removes the directory entry and every staff permission it granted. */
export const removeStaff = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ staffId: z.string().uuid() }).parse(input))
  .handler(({ data }) =>
    invokeEdgeFunction<{ ok: true }>("staff-workflows", "remove", data),
  );

// Re-exported for existing importers; the canonical source is @/lib/roles.
export type { StaffRole } from "@/lib/roles";
export const STAFF_ROLE_OPTIONS = STAFF_ROLES;
