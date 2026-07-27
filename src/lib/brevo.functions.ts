import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Brevo administration and workshop registration operations for the CRM.
 *
 * The API key is never returned by anything here. It is written through an
 * RPC that only the database can read back, and reported only as "configured"
 * plus its last four characters — enough for an admin to tell which key is
 * loaded, useless to anyone who obtains it.
 */

type Roles = { role: string }[] | null;

async function assertCrmAdmin(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const allowed = ((data ?? []) as Roles satisfies Roles)?.some(
    (row) => row.role === "admin" || row.role === "super_admin" || row.role === "crm_manager",
  );
  if (!allowed) throw new Error("Only CRM administrators can manage the Brevo connection.");
}

export const getBrevoSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- these enter the generated types after the migration runs.
    const sb = context.supabase as any;

    const [{ data: integration }, { data: status }] = await Promise.all([
      sb.from("crm_integrations").select("non_secret_config").eq("provider", "brevo").maybeSingle(),
      sb.rpc("integration_secret_status", { _provider: "brevo" }),
    ]);

    const config = (integration?.non_secret_config ?? {}) as Record<string, unknown>;
    const secret = (Array.isArray(status) ? status[0] : status) as
      { configured: boolean; last_four: string | null; updated_at: string | null } | undefined;

    return {
      listId: config.list_id == null ? "" : String(config.list_id),
      templateId: config.template_id == null ? "" : String(config.template_id),
      senderName: (config.sender_name as string) ?? "",
      senderEmail: (config.sender_email as string) ?? "",
      adminEmail: (config.admin_email as string) ?? "",
      apiKey: {
        configured: secret?.configured ?? false,
        lastFour: secret?.last_four ?? null,
        updatedAt: secret?.updated_at ?? null,
      },
      // So the UI can explain where a value is coming from when the CRM is blank.
      environmentFallback: {
        apiKey: Boolean(process.env.BREVO_API_KEY),
        senderEmail: Boolean(process.env.BREVO_SENDER_EMAIL),
      },
    };
  });

export const saveBrevoSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        listId: z.string().trim().max(20),
        templateId: z.string().trim().max(20),
        senderName: z.string().trim().max(120),
        senderEmail: z.string().trim().max(160),
        adminEmail: z.string().trim().max(160),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);

    const email = (value: string) => {
      if (value === "") return null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        throw new Error(`"${value}" is not a valid email address.`);
      return value;
    };
    const positiveInt = (value: string, label: string) => {
      if (value === "") return null;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0)
        throw new Error(`${label} must be a positive number.`);
      return parsed;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above.
    const sb = context.supabase as any;
    const { error } = await sb
      .from("crm_integrations")
      .update({
        non_secret_config: {
          list_id: positiveInt(data.listId, "List ID"),
          template_id: positiveInt(data.templateId, "Template ID"),
          sender_name: data.senderName || null,
          sender_email: email(data.senderEmail),
          admin_email: email(data.adminEmail),
        },
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", "brevo");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Store a new API key. The value is never read back by anything but the server. */
export const saveBrevoApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ apiKey: z.string().trim().max(400) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above.
    const sb = context.supabase as any;
    // The RPC is SECURITY DEFINER and re-checks the caller, so this runs under
    // the admin's own session rather than the service role.
    const { error } = await sb.rpc("set_integration_secret", {
      _provider: "brevo",
      _secret: data.apiKey,
    });
    if (error) throw new Error(error.message);
    return { ok: true, cleared: data.apiKey.trim() === "" };
  });

export const listWorkshopRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above.
    const sb = context.supabase as any;
    const { data, error } = await sb
      .from("workshop_registrations")
      .select(
        "id, reference, event_name, full_name, email, phone, location, interest, confirmation_email_status, admin_email_status, brevo_contact_status, last_error, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { registrations: data ?? [] };
  });

/**
 * Re-send a confirmation Brevo failed to deliver.
 *
 * Idempotent by design: the registration already exists, so this only repeats
 * the side effects and records the new outcome. Safe to press twice.
 */
export const retryWorkshopConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above.
    const sb = supabaseAdmin as any;

    const { data: row } = await sb
      .from("workshop_registrations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("That registration no longer exists.");

    const { brevoConfig, upsertBrevoContact, sendBrevoConfirmation } =
      await import("@/lib/brevo.server");
    const configured = await brevoConfig();
    if ("error" in configured) {
      await sb
        .from("workshop_registrations")
        .update({ last_error: configured.error, last_attempt_at: new Date().toISOString() })
        .eq("id", row.id);
      throw new Error(configured.error);
    }

    const firstName = String(row.full_name).trim().split(/\s+/)[0] || String(row.full_name);
    const contact = {
      email: row.email as string,
      firstName,
      fullName: row.full_name as string,
      phone: row.phone as string,
      location: row.location as string,
      gender: row.gender as string,
      occupation: (row.occupation as string | null) ?? null,
      interest: row.interest as string,
      eventName: row.event_name as string,
      reference: row.reference as string,
    };

    const [contactResult, confirmation] = await Promise.all([
      upsertBrevoContact(configured.config, contact),
      sendBrevoConfirmation(configured.config, contact),
    ]);

    const errors = [
      contactResult.ok ? null : `contact: ${contactResult.error}`,
      confirmation.ok ? null : `confirmation: ${confirmation.error}`,
    ].filter(Boolean);

    await sb
      .from("workshop_registrations")
      .update({
        brevo_contact_status: contactResult.ok ? "synced" : "failed",
        confirmation_email_status: confirmation.ok ? "sent" : "failed",
        last_error: errors.length ? errors.join(" | ").slice(0, 2000) : null,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!confirmation.ok) throw new Error(`Still failing — ${confirmation.error}`);
    return { ok: true, reference: contact.reference };
  });
