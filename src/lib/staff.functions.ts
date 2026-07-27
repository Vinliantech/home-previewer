import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STAFF_ROLES } from "@/lib/roles";
import type { Database } from "@/integrations/supabase/types";

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
export const listStaff = createServerFn({ method: "GET" })
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
export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => inviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = normaliseEmail(data.email);
    const siteUrl = process.env.SITE_URL ?? "";
    let userId: string | null = null;
    let actionLink: string | null = null;

    const invited = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: siteUrl ? { redirectTo: `${siteUrl}/admin/auth` } : undefined,
    });

    if (invited.error) {
      // Already has an account (a client being promoted to staff, or a
      // re-invite): link the existing user and send a password-reset link
      // instead of failing the whole invite.
      const recovery = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: siteUrl ? { redirectTo: `${siteUrl}/admin/auth` } : undefined,
      });
      if (recovery.error) throw new Error(recovery.error.message);
      userId = recovery.data.user?.id ?? null;
      actionLink = recovery.data.properties?.action_link ?? null;
    } else {
      userId = invited.data.user?.id ?? null;
      actionLink = invited.data.properties?.action_link ?? null;
    }

    const now = new Date().toISOString();
    const { data: member, error } = await supabaseAdmin
      .from("staff_members")
      .insert({
        user_id: userId,
        full_name: data.fullName,
        email,
        phone: data.phone || null,
        whatsapp_number: data.whatsappNumber || null,
        position: data.position || null,
        department: data.department || null,
        started_on: data.startedOn || null,
        notes: data.notes || null,
        status: "invited",
        // Recorded as an intention only. Nothing reaches user_roles until an
        // admin approves the person who actually signs in — an invite landing
        // in the wrong inbox must not hand out access on its own.
        intended_role: data.role,
        invited_by: context.userId,
        invited_at: now,
      })
      .select("id")
      .single();
    if (error) {
      // staff_members_email_key_idx is the authority on duplicates; checking
      // first would only open a race between the check and the insert.
      if (error.code === "23505") throw new Error("That email is already in the staff directory.");
      throw new Error(error.message);
    }

    let emailSent = false;
    if (actionLink) {
      const { sendStaffInvite } = await import("@/lib/crm-email.server");
      const result = await sendStaffInvite({
        to: email,
        fullName: data.fullName,
        position: data.position || null,
        roleLabel: data.role.replace(/_/g, " "),
        actionLink,
      });
      emailSent = result.ok;
    }

    return { ok: true, staffId: member.id, emailSent, inviteLink: actionLink };
  });

/** Re-issues the set-password link for someone who has not signed in yet. */
export const resendStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ staffId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member, error } = await supabaseAdmin
      .from("staff_members")
      .select("id, full_name, email, position, status")
      .eq("id", data.staffId)
      .single();
    if (error || !member) throw new Error("Staff member not found.");

    const siteUrl = process.env.SITE_URL ?? "";
    const link = await supabaseAdmin.auth.admin.generateLink({
      type: member.status === "invited" ? "invite" : "recovery",
      email: member.email,
      options: siteUrl ? { redirectTo: `${siteUrl}/admin/auth` } : undefined,
    });
    if (link.error) throw new Error(link.error.message);
    const actionLink = link.data.properties?.action_link ?? null;
    if (!actionLink) throw new Error("Could not generate an invite link.");

    await supabaseAdmin
      .from("staff_members")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", member.id);

    const { sendStaffInvite } = await import("@/lib/crm-email.server");
    const result = await sendStaffInvite({
      to: member.email,
      fullName: member.full_name,
      position: member.position,
      roleLabel: null,
      actionLink,
    });
    return { ok: true, emailSent: result.ok, inviteLink: actionLink };
  });

/** Edits the human record, and the permission role when one is supplied. */
export const updateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: member, error: readError } = await supabaseAdmin
      .from("staff_members")
      .select("id, user_id, status")
      .eq("id", data.staffId)
      .single();
    if (readError || !member) throw new Error("Staff member not found.");

    const { error } = await supabaseAdmin
      .from("staff_members")
      .update({
        full_name: data.fullName,
        position: data.position || null,
        department: data.department || null,
        phone: data.phone || null,
        whatsapp_number: data.whatsappNumber || null,
        started_on: data.startedOn || null,
        notes: data.notes || null,
        ...(data.role ? { intended_role: data.role } : {}),
        ...(data.status ? { status: data.status } : {}),
      })
      .eq("id", data.staffId);
    if (error) throw new Error(error.message);

    const nextStatus = data.status ?? member.status;
    if (data.role && member.user_id && nextStatus === "active") {
      // Only an already-approved account has its role written through. For a
      // pending one the edit records the intention; approval is what grants it,
      // otherwise editing would quietly bypass the approval gate.
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id)
        .in("role", STAFF_ROLES);
      await supabaseAdmin.from("user_roles").insert({ user_id: member.user_id, role: data.role });
    }

    // A suspended account keeps its record but loses every staff permission.
    if (data.status === "suspended" && member.user_id) {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id)
        .in("role", STAFF_ROLES);
    }

    return { ok: true };
  });

/**
 * Grants access to someone who has signed in and is waiting. The role comes
 * from the record (or an explicit override), and approve_staff_member re-checks
 * admin rights in the database.
 */
export const approveStaff = createServerFn({ method: "POST" })
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
export const rejectStaff = createServerFn({ method: "POST" })
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
export const listStaffChangeRequests = createServerFn({ method: "GET" })
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
export const reviewStaffChangeRequest = createServerFn({ method: "POST" })
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
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: request, error: readError } = await supabaseAdmin
      .from("staff_change_requests")
      .select("*, staff_members(id, user_id, status)")
      .eq("id", data.requestId)
      .single();
    if (readError || !request) throw new Error("Request not found.");

    if (data.approve) {
      const member = request.staff_members as unknown as {
        id: string;
        user_id: string | null;
        status: string;
      };
      await supabaseAdmin
        .from("staff_members")
        .update({
          ...(request.requested_position ? { position: request.requested_position } : {}),
          ...(request.requested_department ? { department: request.requested_department } : {}),
          ...(request.requested_role ? { intended_role: request.requested_role } : {}),
        })
        .eq("id", member.id);

      if (request.requested_role && member.user_id && member.status === "active") {
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", member.user_id)
          .in("role", STAFF_ROLES);
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: member.user_id, role: request.requested_role });
      }
    }

    const { error } = await supabaseAdmin
      .from("staff_change_requests")
      .update({
        status: data.approve ? "approved" : "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_note: data.note || null,
      })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================ SELF-SERVICE ============================ */

/** The signed-in staff member's own record. RLS scopes this to themselves. */
export const myStaffProfile = createServerFn({ method: "GET" })
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
export const updateMyStaffContact = createServerFn({ method: "POST" })
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
export const requestStaffChange = createServerFn({ method: "POST" })
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
export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ staffId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member } = await supabaseAdmin
      .from("staff_members")
      .select("id, user_id")
      .eq("id", data.staffId)
      .maybeSingle();
    if (member?.user_id) {
      if (member.user_id === context.userId) {
        throw new Error("You cannot remove your own staff access.");
      }
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", member.user_id)
        .in("role", STAFF_ROLES);
    }
    const { error } = await supabaseAdmin.from("staff_members").delete().eq("id", data.staffId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Re-exported for existing importers; the canonical source is @/lib/roles.
export type { StaffRole } from "@/lib/roles";
export const STAFF_ROLE_OPTIONS = STAFF_ROLES;
