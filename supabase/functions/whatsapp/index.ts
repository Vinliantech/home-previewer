import { z } from "npm:zod@3.24.2";
import { HttpError, enforceRateLimit, requireRoles, runJsonEndpoint } from "../_shared/platform.ts";

const CRM_ROLES = ["super_admin", "admin", "crm_manager", "sales_agent"] as const;
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Use an international phone number.");

Deno.serve((request) =>
  runJsonEndpoint(request, "whatsapp", async (body) => {
    enforceRateLimit(request, "whatsapp", 60, 10 * 60_000);
    const { user, admin, roles } = await requireRoles(request, CRM_ROLES);
    const canManageAllLeads = roles.some((role) =>
      ["super_admin", "admin", "crm_manager"].includes(role),
    );
    const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN")?.trim();
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")?.trim();
    const version = Deno.env.get("WHATSAPP_GRAPH_API_VERSION")?.trim();
    if (!token || !phoneNumberId || !version) {
      throw new HttpError(409, "WhatsApp Business is not configured.");
    }

    const action = String(body.action ?? "");
    let payload: Record<string, unknown>;
    let leadId: string | null = null;
    let recipientPhone: string | null = null;
    let activityBody = "WhatsApp operation completed.";

    if (action === "send_text") {
      const parsed = z
        .object({
          to: phoneSchema,
          message: z.string().trim().min(1).max(4096),
          previewUrl: z.boolean().default(false),
          leadId: z.string().uuid().optional(),
        })
        .safeParse(body.input);
      if (!parsed.success)
        throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
      leadId = parsed.data.leadId ?? null;
      recipientPhone = parsed.data.to.replace(/\D/g, "");
      activityBody = "WhatsApp text message sent.";
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: parsed.data.to.replace(/^\+/, ""),
        type: "text",
        text: { preview_url: parsed.data.previewUrl, body: parsed.data.message },
      };
    } else if (action === "send_template") {
      const parsed = z
        .object({
          to: phoneSchema,
          templateName: z.string().regex(/^[a-z0-9_]{1,512}$/),
          languageCode: z
            .string()
            .regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/)
            .default("en"),
          components: z.array(z.record(z.unknown())).max(20).default([]),
          leadId: z.string().uuid().optional(),
        })
        .safeParse(body.input);
      if (!parsed.success)
        throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
      leadId = parsed.data.leadId ?? null;
      recipientPhone = parsed.data.to.replace(/\D/g, "");
      activityBody = `WhatsApp template "${parsed.data.templateName}" sent.`;
      payload = {
        messaging_product: "whatsapp",
        to: parsed.data.to.replace(/^\+/, ""),
        type: "template",
        template: {
          name: parsed.data.templateName,
          language: { code: parsed.data.languageCode },
          components: parsed.data.components,
        },
      };
    } else if (action === "mark_read") {
      const parsed = z
        .object({ messageId: z.string().trim().min(1).max(300) })
        .safeParse(body.input);
      if (!parsed.success) throw new HttpError(400, "Invalid message id.");
      if (!canManageAllLeads) {
        throw new HttpError(403, "Only CRM managers can update provider message status.");
      }
      payload = {
        messaging_product: "whatsapp",
        status: "read",
        message_id: parsed.data.messageId,
      };
    } else {
      throw new HttpError(404, "Unknown WhatsApp operation.");
    }

    if (leadId) {
      const { data: lead } = await admin
        .from("leads")
        .select("assigned_to, phone, whatsapp_number")
        .eq("id", leadId)
        .maybeSingle();
      if (!lead) throw new HttpError(404, "Lead not found.");
      if (!canManageAllLeads && lead.assigned_to !== user.id) {
        throw new HttpError(403, "This lead is not assigned to you.");
      }
      const knownPhones = [lead.phone, lead.whatsapp_number]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.replace(/\D/g, ""));
      if (!canManageAllLeads && recipientPhone && !knownPhones.includes(recipientPhone)) {
        throw new HttpError(403, "The recipient does not match this lead.");
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      console.error(
        JSON.stringify({
          event: "whatsapp-provider-error",
          status: response.status,
          error: result.error?.message ?? "unknown",
        }),
      );
      throw new HttpError(502, "WhatsApp rejected the request.");
    }
    if (leadId) {
      await admin.from("lead_activities").insert({
        lead_id: leadId,
        activity_type: "whatsapp",
        body: activityBody,
        actor_id: user.id,
        meta: { provider_message_id: result.messages?.[0]?.id ?? null },
      });
      await admin
        .from("leads")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", leadId);
    }
    return { ok: true, messageId: result.messages?.[0]?.id ?? null };
  }),
);
