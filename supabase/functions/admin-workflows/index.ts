import { z } from "npm:zod@3.24.2";
import { HttpError, enforceRateLimit, requireRoles, runJsonEndpoint } from "../_shared/platform.ts";
import { clientResetEmail, sendCrmEmail } from "../_shared/email.ts";
import { brevoConfig, sendBrevoConfirmation, upsertBrevoContact } from "../_shared/brevo.ts";
import { captureLead, type LeadInput, recordCaptureFailure } from "../_shared/crm.ts";
import { parseMetaLead, type MetaLeadPayload } from "../_shared/meta.ts";

const CRM_ADMINS = ["super_admin", "admin", "crm_manager"] as const;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid input.");
  return result.data;
}

function metaConfig() {
  const pageAccessToken = Deno.env.get("META_PAGE_ACCESS_TOKEN")?.trim();
  const graphVersion = Deno.env.get("META_GRAPH_API_VERSION")?.trim();
  if (!pageAccessToken || !graphVersion) throw new HttpError(409, "Meta is not configured.");
  return { pageAccessToken, graphVersion };
}

const toNumber = (value: string | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

Deno.serve((request) =>
  runJsonEndpoint(request, "admin-workflows", async (body) => {
    enforceRateLimit(request, "admin-workflows", 60, 10 * 60_000);
    const action = String(body.action ?? "");
    const { user, admin, roles } = await requireRoles(request, CRM_ADMINS);
    const isPlatformAdmin = roles.some((role) => ["super_admin", "admin"].includes(role));

    if (action === "reset_client_password") {
      if (!isPlatformAdmin) {
        throw new HttpError(403, "Only platform administrators can reset client passwords.");
      }
      const data = parse(z.object({ profileId: z.string().uuid() }), body.input);
      const { data: profile } = await admin
        .from("profiles")
        .select("id, user_id, full_name, email")
        .eq("id", data.profileId)
        .maybeSingle();
      if (!profile) throw new HttpError(404, "Client account not found.");
      const siteUrl = (Deno.env.get("SITE_URL") ?? "https://kaystephgroup.com").replace(/\/$/, "");
      const recovery = await admin.auth.admin.generateLink({
        type: "recovery",
        email: profile.email,
        options: { redirectTo: `${siteUrl}/portfolio/profile` },
      });
      if (recovery.error) throw new Error(recovery.error.message);
      const actionLink = recovery.data.properties?.action_link ?? null;
      if (!actionLink) throw new Error("Could not generate a password-reset link.");
      const sent = await sendCrmEmail(admin, {
        to: profile.email,
        ...clientResetEmail(profile.full_name, actionLink),
      });
      await admin.rpc("log_admin_action", {
        _action: "client_password_reset_issued",
        _entity_type: "profile",
        _entity_id: profile.id,
        _details: { client_user_id: profile.user_id, email_sent: sent.ok },
        _actor: user.id,
      });
      return { ok: true, emailSent: sent.ok, resetLink: actionLink };
    }

    if (action === "integration_status") {
      const { data: lastMetaCapture } = await admin.rpc("crm_last_capture_at", {
        _source: "facebook_lead_ads",
      });
      return {
        meta: {
          configured: Boolean(
            Deno.env.get("META_APP_SECRET") &&
            Deno.env.get("META_PAGE_ACCESS_TOKEN") &&
            Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") &&
            Deno.env.get("META_GRAPH_API_VERSION"),
          ),
          lastCaptureAt: (lastMetaCapture as string | null) ?? null,
          required: [
            "META_APP_SECRET",
            "META_PAGE_ACCESS_TOKEN",
            "META_WEBHOOK_VERIFY_TOKEN",
            "META_GRAPH_API_VERSION",
          ],
        },
        email: {
          configured: Boolean(Deno.env.get("RESEND_API_KEY") && Deno.env.get("CRM_EMAIL_FROM")),
          provider: "Resend",
          required: ["RESEND_API_KEY", "CRM_EMAIL_FROM"],
        },
        whatsapp: {
          configured: Boolean(
            Deno.env.get("WHATSAPP_ACCESS_TOKEN") &&
            Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") &&
            Deno.env.get("WHATSAPP_GRAPH_API_VERSION"),
          ),
          built: true,
          required: [
            "WHATSAPP_ACCESS_TOKEN",
            "WHATSAPP_PHONE_NUMBER_ID",
            "WHATSAPP_GRAPH_API_VERSION",
          ],
        },
      };
    }

    if (action === "test_email") {
      if (!isPlatformAdmin) {
        throw new HttpError(403, "Only platform administrators can send tests.");
      }
      const data = parse(z.object({ email: z.string().email() }), body.input);
      const result = await sendCrmEmail(admin, {
        to: data.email,
        subject: "Kay-Steph CRM email connection test",
        html: "<p>Your Kay-Steph CRM transactional email connection is working.</p>",
        text: "Your Kay-Steph CRM transactional email connection is working.",
      });
      if (!result.ok) throw new HttpError(502, "Test email could not be sent.");
      return { ok: true };
    }

    if (action === "brevo_get") {
      const [{ data: integration }, { data: secret }] = await Promise.all([
        admin
          .from("crm_integrations")
          .select("non_secret_config")
          .eq("provider", "brevo")
          .maybeSingle(),
        admin
          .from("integration_secrets")
          .select("last_four, updated_at")
          .eq("provider", "brevo")
          .maybeSingle(),
      ]);
      const config = (integration?.non_secret_config ?? {}) as Record<string, unknown>;
      return {
        listId: config.list_id == null ? "" : String(config.list_id),
        templateId: config.template_id == null ? "" : String(config.template_id),
        senderName: (config.sender_name as string) ?? "",
        senderEmail: (config.sender_email as string) ?? "",
        adminEmail: (config.admin_email as string) ?? "",
        apiKey: {
          configured: Boolean(secret || Deno.env.get("BREVO_API_KEY")),
          lastFour: secret?.last_four ?? null,
          updatedAt: secret?.updated_at ?? null,
        },
        environmentFallback: {
          apiKey: Boolean(Deno.env.get("BREVO_API_KEY")),
          senderEmail: Boolean(Deno.env.get("BREVO_SENDER_EMAIL")),
        },
      };
    }

    if (action === "brevo_save_settings") {
      if (!isPlatformAdmin) {
        throw new HttpError(403, "Only platform administrators can change Brevo settings.");
      }
      const data = parse(
        z.object({
          listId: z.string().trim().max(20),
          templateId: z.string().trim().max(20),
          senderName: z.string().trim().max(120),
          senderEmail: z.string().trim().email().or(z.literal("")),
          adminEmail: z.string().trim().email().or(z.literal("")),
        }),
        body.input,
      );
      const positiveInt = (value: string, label: string) => {
        if (!value) return null;
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          throw new HttpError(400, `${label} must be a positive integer.`);
        }
        return parsed;
      };
      const { error } = await admin
        .from("crm_integrations")
        .update({
          non_secret_config: {
            list_id: positiveInt(data.listId, "List ID"),
            template_id: positiveInt(data.templateId, "Template ID"),
            sender_name: data.senderName || null,
            sender_email: data.senderEmail || null,
            admin_email: data.adminEmail || null,
          },
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("provider", "brevo");
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    if (action === "brevo_save_key") {
      if (!isPlatformAdmin) {
        throw new HttpError(403, "Only platform administrators can change provider keys.");
      }
      const data = parse(z.object({ apiKey: z.string().trim().max(400) }), body.input);
      if (data.apiKey && data.apiKey.length < 12)
        throw new HttpError(400, "That API key is too short.");
      if (!data.apiKey) {
        await admin.from("integration_secrets").delete().eq("provider", "brevo");
        return { ok: true, cleared: true };
      }
      const { error } = await admin.from("integration_secrets").upsert({
        provider: "brevo",
        secret: data.apiKey,
        last_four: data.apiKey.slice(-4),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      return { ok: true, cleared: false };
    }

    if (action === "brevo_list_registrations") {
      const { data, error } = await admin
        .from("workshop_registrations")
        .select(
          "id, reference, event_name, full_name, email, phone, location, interest, confirmation_email_status, admin_email_status, brevo_contact_status, last_error, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return { registrations: data ?? [] };
    }

    if (action === "brevo_retry_confirmation") {
      const data = parse(z.object({ id: z.string().uuid() }), body.input);
      const { data: row } = await admin
        .from("workshop_registrations")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (!row) throw new HttpError(404, "Registration not found.");
      const configured = await brevoConfig(admin);
      if ("error" in configured) throw new HttpError(409, configured.error);
      const contact = {
        email: row.email,
        firstName: String(row.full_name).trim().split(/\s+/)[0] || row.full_name,
        fullName: row.full_name,
        phone: row.phone,
        whatsapp: row.whatsapp,
        location: row.location,
        gender: row.gender,
        occupation: row.occupation,
        interest: row.interest,
        eventName: row.event_name,
        reference: row.reference,
      };
      const [contactResult, confirmation] = await Promise.all([
        upsertBrevoContact(configured.config, contact),
        sendBrevoConfirmation(configured.config, contact),
      ]);
      const errors = [
        contactResult.ok ? null : contactResult.error,
        confirmation.ok ? null : confirmation.error,
      ].filter(Boolean);
      await admin
        .from("workshop_registrations")
        .update({
          brevo_contact_status: contactResult.ok ? "synced" : "failed",
          confirmation_email_status: confirmation.ok ? "sent" : "failed",
          last_error: errors.length ? errors.join(" | ").slice(0, 2000) : null,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (!confirmation.ok) throw new HttpError(502, confirmation.error);
      return { ok: true, reference: row.reference };
    }

    if (action === "meta_list_failures") {
      const { data, error } = await admin
        .from("lead_capture_failures")
        .select("*")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return { failures: data ?? [] };
    }

    if (action === "meta_retry_capture") {
      const data = parse(z.object({ id: z.string().uuid() }), body.input);
      const { data: row } = await admin
        .from("lead_capture_failures")
        .select("id, payload, attempts")
        .eq("id", data.id)
        .is("resolved_at", null)
        .maybeSingle();
      if (!row) throw new HttpError(404, "Failed capture not found.");
      if (!row.payload || typeof row.payload !== "object" || Array.isArray(row.payload)) {
        throw new HttpError(422, "Stored capture payload is invalid.");
      }
      try {
        const result = await captureLead(admin, row.payload as LeadInput);
        await admin
          .from("lead_capture_failures")
          .update({
            resolved_at: new Date().toISOString(),
            resolved_lead_id: result.leadId,
            attempts: (row.attempts ?? 1) + 1,
            last_attempt_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        return { ok: true, leadId: result.leadId };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await admin
          .from("lead_capture_failures")
          .update({
            error: message.slice(0, 2000),
            attempts: (row.attempts ?? 1) + 1,
            last_attempt_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        throw new HttpError(502, `Still failing: ${message}`);
      }
    }

    if (action === "meta_import_form") {
      const data = parse(
        z.object({
          formId: z.string().trim().min(1).max(64),
          since: z.string().datetime().optional(),
        }),
        body.input,
      );
      const { pageAccessToken, graphVersion } = metaConfig();
      const fields =
        "id,created_time,field_data,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,form_id";
      let next: string | null =
        `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(data.formId)}/leads` +
        `?fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(pageAccessToken)}`;
      let imported = 0;
      let alreadyPresent = 0;
      let failed = 0;
      let pages = 0;
      const sinceMs = data.since ? Date.parse(data.since) : null;
      while (next && pages < 20) {
        const response = await fetch(next, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok)
          throw new HttpError(502, `Meta rejected the request (${response.status}).`);
        const page = (await response.json()) as {
          data?: Array<MetaLeadPayload & { id: string }>;
          paging?: { next?: string };
        };
        pages += 1;
        for (const lead of page.data ?? []) {
          if (sinceMs && lead.created_time && Date.parse(lead.created_time) < sinceMs) continue;
          const input = parseMetaLead(lead, {
            leadgenId: lead.id,
            pageId: Deno.env.get("META_PAGE_ID"),
            formId: lead.form_id ?? data.formId,
          });
          try {
            const result = await captureLead(admin, input);
            if (result.duplicateSubmission) alreadyPresent += 1;
            else imported += 1;
          } catch (error) {
            failed += 1;
            await recordCaptureFailure(admin, input, error);
          }
        }
        next = page.paging?.next ?? null;
      }
      return { imported, alreadyPresent, failed, pages, morePages: Boolean(next) };
    }

    if (action === "meta_sync_campaigns") {
      const { pageAccessToken, graphVersion } = metaConfig();
      const configuredAccount = Deno.env.get("META_AD_ACCOUNT_ID")?.trim();
      if (!configuredAccount) throw new HttpError(409, "Meta ad account is not configured.");
      const account = configuredAccount.startsWith("act_")
        ? configuredAccount
        : `act_${configuredAccount}`;
      const fields = "id,name,objective,status,daily_budget,insights{spend,impressions,clicks}";
      let next: string | null =
        `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(account)}/campaigns` +
        `?fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(pageAccessToken)}`;
      let synced = 0;
      let pages = 0;
      const syncedAt = new Date().toISOString();
      while (next && pages < 20) {
        const response = await fetch(next, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok)
          throw new HttpError(502, `Meta rejected the request (${response.status}).`);
        const page = (await response.json()) as {
          data?: Array<{
            id: string;
            name?: string;
            objective?: string;
            status?: string;
            daily_budget?: string;
            insights?: { data?: Array<{ spend?: string; impressions?: string; clicks?: string }> };
          }>;
          paging?: { next?: string };
        };
        pages += 1;
        const rows = (page.data ?? []).map((campaign) => {
          const insight = campaign.insights?.data?.[0];
          return {
            campaign_id: campaign.id,
            campaign_name: campaign.name ?? campaign.id,
            objective: campaign.objective ?? null,
            status: campaign.status ?? null,
            daily_budget: campaign.daily_budget ? toNumber(campaign.daily_budget) / 100 : null,
            spend: toNumber(insight?.spend),
            impressions: Math.round(toNumber(insight?.impressions)),
            clicks: Math.round(toNumber(insight?.clicks)),
            last_synced_at: syncedAt,
            updated_at: syncedAt,
          };
        });
        if (rows.length) {
          const { error } = await admin
            .from("fb_campaigns")
            .upsert(rows, { onConflict: "campaign_id" });
          if (error) throw new Error(error.message);
          synced += rows.length;
        }
        next = page.paging?.next ?? null;
      }
      return { synced, pages, morePages: Boolean(next) };
    }

    throw new HttpError(404, "Unknown administration workflow action.");
  }),
);
