import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const BREVO_API = "https://api.brevo.com/v3";
const TIMEOUT_MS = 10_000;

type Result = { ok: true } | { ok: false; error: string };
export type WorkshopContact = {
  email: string;
  firstName: string;
  fullName: string;
  phone: string;
  whatsapp?: string | null;
  location: string;
  gender: string;
  occupation: string | null;
  interest: string;
  eventName: string;
  reference: string;
};
type Config = {
  apiKey: string;
  listId: number | null;
  templateId: number | null;
  senderName: string;
  senderEmail: string;
  adminEmail: string | null;
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const positiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export async function brevoConfig(
  admin: SupabaseClient,
): Promise<{ config: Config } | { error: string }> {
  const [{ data: integration }, { data: secret }] = await Promise.all([
    admin
      .from("crm_integrations")
      .select("non_secret_config")
      .eq("provider", "brevo")
      .maybeSingle(),
    admin.from("integration_secrets").select("secret").eq("provider", "brevo").maybeSingle(),
  ]);
  const stored = (integration?.non_secret_config ?? {}) as Record<string, unknown>;
  const apiKey = text(secret?.secret) ?? text(Deno.env.get("BREVO_API_KEY"));
  if (!apiKey) return { error: "Brevo is not configured." };
  return {
    config: {
      apiKey,
      listId: positiveInt(stored.list_id) ?? positiveInt(Deno.env.get("BREVO_LIST_ID")),
      templateId: positiveInt(stored.template_id) ?? positiveInt(Deno.env.get("BREVO_TEMPLATE_ID")),
      senderName:
        text(stored.sender_name) ?? text(Deno.env.get("BREVO_SENDER_NAME")) ?? "Kay-Steph Group",
      senderEmail:
        text(stored.sender_email) ??
        text(Deno.env.get("BREVO_SENDER_EMAIL")) ??
        "email@kaystephgroup.com",
      adminEmail: text(stored.admin_email) ?? text(Deno.env.get("KAYSTEPH_ADMIN_EMAIL")),
    },
  };
}

async function call(config: Config, path: string, body: unknown): Promise<Result> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BREVO_API}${path}`, {
      method: "POST",
      headers: {
        "api-key": config.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.ok) return { ok: true };
    return {
      ok: false,
      error: `Brevo ${response.status}: ${(await response.text()).slice(0, 400)}`,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

export function upsertBrevoContact(config: Config, contact: WorkshopContact): Promise<Result> {
  return call(config, "/contacts", {
    email: contact.email,
    updateEnabled: true,
    attributes: {
      FIRSTNAME: contact.firstName,
      LASTNAME: contact.fullName.split(" ").slice(1).join(" ") || contact.firstName,
      FULL_NAME: contact.fullName,
      PHONE: contact.phone,
      LOCATION: contact.location,
      GENDER: contact.gender,
      OCCUPATION: contact.occupation ?? "",
      INTEREST: contact.interest,
      EVENT_NAME: contact.eventName,
      REGISTRATION_REFERENCE: contact.reference,
    },
    ...(config.listId ? { listIds: [config.listId] } : {}),
  });
}

export function sendBrevoConfirmation(config: Config, contact: WorkshopContact): Promise<Result> {
  if (!config.templateId)
    return Promise.resolve({ ok: false, error: "Brevo template is not set." });
  return call(config, "/smtp/email", {
    to: [{ email: contact.email, name: contact.fullName }],
    templateId: config.templateId,
    params: {
      FIRST_NAME: contact.firstName,
      FULL_NAME: contact.fullName,
      EMAIL: contact.email,
      PHONE: contact.phone,
      LOCATION: contact.location,
      GENDER: contact.gender,
      OCCUPATION: contact.occupation ?? "",
      INTEREST: contact.interest,
      EVENT_NAME: contact.eventName,
      REGISTRATION_REFERENCE: contact.reference,
    },
    tags: ["workshop-registration"],
  });
}

export function sendBrevoAdminNotification(
  config: Config,
  contact: WorkshopContact,
  expectation: string | null,
): Promise<Result> {
  if (!config.adminEmail) {
    return Promise.resolve({ ok: false, error: "Workshop admin email is not set." });
  }
  const safe = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return call(config, "/smtp/email", {
    to: [{ email: config.adminEmail }],
    subject: `New registration — ${contact.eventName} (${contact.reference})`,
    htmlContent:
      `<h2>New workshop registration</h2><p><strong>${safe(contact.fullName)}</strong> ` +
      `(${safe(contact.email)}, ${safe(contact.phone)})</p><p>Interest: ${safe(contact.interest)}</p>` +
      `<p>Expectation: ${safe(expectation ?? "—")}</p>`,
    sender: { name: config.senderName, email: config.senderEmail },
    replyTo: { email: contact.email, name: contact.fullName },
    tags: ["workshop-registration-admin"],
  });
}
