import { z } from "npm:zod@3.24.2";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError, enforceRateLimit, requireRoles, runJsonEndpoint } from "../_shared/platform.ts";
import { sendCrmEmail, staffInviteEmail } from "../_shared/email.ts";

const STAFF_ROLES = [
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
const PLATFORM_ADMINS = ["super_admin", "admin"] as const;
const details = {
  fullName: z.string().trim().min(2).max(120),
  position: z.string().trim().max(80).optional(),
  department: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(24).optional(),
  whatsappNumber: z.string().trim().max(24).optional(),
  startedOn: z.string().trim().max(10).optional(),
  notes: z.string().trim().max(1000).optional(),
};
const inviteSchema = z.object({
  ...details,
  email: z.string().trim().email().max(160),
  role: z.enum(STAFF_ROLES),
});
const updateSchema = z.object({
  ...details,
  staffId: z.string().uuid(),
  role: z.enum(STAFF_ROLES).optional(),
  status: z.enum(["invited", "pending_approval", "active", "suspended"]).optional(),
});

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid input.");
  return result.data;
}

async function replaceStaffRole(admin: SupabaseClient, userId: string, role: string) {
  const { error: deleteError } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .in("role", [...STAFF_ROLES]);
  if (deleteError) throw new Error(deleteError.message);
  const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(error.message);
}

Deno.serve((request) =>
  runJsonEndpoint(request, "staff-workflows", async (body) => {
    enforceRateLimit(request, "staff-workflows", 40, 10 * 60_000);
    const action = String(body.action ?? "");
    const { user, admin } = await requireRoles(request, PLATFORM_ADMINS);
    const siteUrl = (Deno.env.get("SITE_URL") ?? "https://kaystephgroup.com").replace(/\/$/, "");

    if (action === "invite") {
      const data = parse(inviteSchema, body.input);
      const email = data.email.toLowerCase();
      let authLink = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${siteUrl}/admin/auth` },
      });
      if (authLink.error) {
        authLink = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${siteUrl}/admin/auth` },
        });
      }
      if (authLink.error) throw new HttpError(409, authLink.error.message);
      const actionLink = authLink.data.properties?.action_link ?? null;
      const userId = authLink.data.user?.id ?? null;
      const { data: member, error } = await admin
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
          intended_role: data.role,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505")
          throw new HttpError(409, "That email is already in the staff directory.");
        throw new Error(error.message);
      }
      let emailSent = false;
      if (actionLink) {
        const emailBody = staffInviteEmail({
          fullName: data.fullName,
          position: data.position,
          roleLabel: data.role.replaceAll("_", " "),
          actionLink,
        });
        emailSent = (await sendCrmEmail(admin, { to: email, ...emailBody })).ok;
      }
      return { ok: true, staffId: member.id, emailSent, inviteLink: actionLink };
    }

    if (action === "resend_invite") {
      const data = parse(z.object({ staffId: z.string().uuid() }), body.input);
      const { data: member } = await admin
        .from("staff_members")
        .select("id, full_name, email, position, status")
        .eq("id", data.staffId)
        .maybeSingle();
      if (!member) throw new HttpError(404, "Staff member not found.");
      const link = await admin.auth.admin.generateLink({
        type: member.status === "invited" ? "invite" : "recovery",
        email: member.email,
        options: { redirectTo: `${siteUrl}/admin/auth` },
      });
      if (link.error) throw new Error(link.error.message);
      const actionLink = link.data.properties?.action_link ?? null;
      if (!actionLink) throw new Error("Could not generate an invite link.");
      await admin
        .from("staff_members")
        .update({ invited_at: new Date().toISOString() })
        .eq("id", member.id);
      const result = await sendCrmEmail(admin, {
        to: member.email,
        ...staffInviteEmail({
          fullName: member.full_name,
          position: member.position,
          actionLink,
        }),
      });
      return { ok: true, emailSent: result.ok, inviteLink: actionLink };
    }

    if (action === "update") {
      const data = parse(updateSchema, body.input);
      const { data: member } = await admin
        .from("staff_members")
        .select("id, user_id, status")
        .eq("id", data.staffId)
        .maybeSingle();
      if (!member) throw new HttpError(404, "Staff member not found.");
      const { error } = await admin
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
        await replaceStaffRole(admin, member.user_id, data.role);
      }
      if (data.status === "suspended" && member.user_id) {
        await admin
          .from("user_roles")
          .delete()
          .eq("user_id", member.user_id)
          .in("role", [...STAFF_ROLES]);
      }
      return { ok: true };
    }

    if (action === "review_change") {
      const data = parse(
        z.object({
          requestId: z.string().uuid(),
          approve: z.boolean(),
          note: z.string().trim().max(500).optional(),
        }),
        body.input,
      );
      const { data: change } = await admin
        .from("staff_change_requests")
        .select("*, staff_members(id, user_id, status)")
        .eq("id", data.requestId)
        .maybeSingle();
      if (!change) throw new HttpError(404, "Request not found.");
      const member = change.staff_members as {
        id: string;
        user_id: string | null;
        status: string;
      };
      if (data.approve) {
        await admin
          .from("staff_members")
          .update({
            ...(change.requested_position ? { position: change.requested_position } : {}),
            ...(change.requested_department ? { department: change.requested_department } : {}),
            ...(change.requested_role ? { intended_role: change.requested_role } : {}),
          })
          .eq("id", member.id);
        if (change.requested_role && member.user_id && member.status === "active") {
          await replaceStaffRole(admin, member.user_id, change.requested_role);
        }
      }
      const { error } = await admin
        .from("staff_change_requests")
        .update({
          status: data.approve ? "approved" : "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_note: data.note || null,
        })
        .eq("id", data.requestId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    if (action === "remove") {
      const data = parse(z.object({ staffId: z.string().uuid() }), body.input);
      const { data: member } = await admin
        .from("staff_members")
        .select("id, user_id")
        .eq("id", data.staffId)
        .maybeSingle();
      if (!member) throw new HttpError(404, "Staff member not found.");
      if (member.user_id === user.id)
        throw new HttpError(409, "You cannot remove your own access.");
      if (member.user_id) {
        await admin
          .from("user_roles")
          .delete()
          .eq("user_id", member.user_id)
          .in("role", [...STAFF_ROLES]);
      }
      const { error } = await admin.from("staff_members").delete().eq("id", member.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    throw new HttpError(404, "Unknown staff workflow action.");
  }),
);
