/**
 * Brevo (formerly Sendinblue) integration.
 *
 * Server-only. The API key is a full-access credential — it can read the whole
 * contact database and send mail as the company — so it lives in the
 * environment and is never returned to a caller, logged, or bundled. This file
 * carries the .server.ts suffix so the convention is enforced by review: route
 * files and *.functions.ts ship to the client bundle and must import it
 * dynamically inside a handler, never at the top level.
 *
 * Every function here reports failure as a value rather than throwing past the
 * caller. A registration that is already saved must never be lost because
 * Brevo was slow, rate-limited or down.
 */

const BREVO_API = "https://api.brevo.com/v3";
const TIMEOUT_MS = 10_000;

export type BrevoResult = { ok: true } | { ok: false; error: string };

type BrevoConfig = {
  apiKey: string;
  listId: number | null;
  templateId: number | null;
  senderName: string;
  senderEmail: string;
  adminEmail: string | null;
};

/**
 * Reads configuration: the CRM first, the environment as a fallback.
 *
 * The CRM is authoritative so the team can rotate a key or point at a new
 * event list without a redeploy. Environment variables still work — they are
 * how the very first deployment gets going, before anyone can sign in to set
 * the CRM values — and each field falls back independently, so a half-filled
 * CRM row cannot silently blank out a working environment setting.
 *
 * Returns the reason rather than throwing, so a caller can save a registration
 * and mark the email failed.
 */
export async function brevoConfig(): Promise<{ config: BrevoConfig } | { error: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- integration_secrets enters the generated types after the migration runs.
  const sb = supabaseAdmin as any;

  let stored: Record<string, unknown> = {};
  let storedKey: string | null = null;
  try {
    const [{ data: integration }, { data: secret }] = await Promise.all([
      sb.from("crm_integrations").select("non_secret_config").eq("provider", "brevo").maybeSingle(),
      // Readable here only because this runs with the service role.
      sb.from("integration_secrets").select("secret").eq("provider", "brevo").maybeSingle(),
    ]);
    stored = (integration?.non_secret_config as Record<string, unknown>) ?? {};
    storedKey = (secret?.secret as string | undefined)?.trim() || null;
  } catch (error) {
    // A database hiccup must not stop a configured environment from sending.
    console.error("[brevo] could not read CRM settings, using environment:", error);
  }

  const text = (value: unknown): string | null => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed === "" ? null : trimmed;
  };
  const positiveInt = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const apiKey = storedKey ?? text(process.env.BREVO_API_KEY);
  if (!apiKey) {
    return {
      error: "No Brevo API key. Add one in CRM → Settings → Integrations, or set BREVO_API_KEY.",
    };
  }

  const senderEmail = text(stored.sender_email) ?? text(process.env.BREVO_SENDER_EMAIL);
  if (!senderEmail) {
    return { error: "No Brevo sender address configured." };
  }

  return {
    config: {
      apiKey,
      listId: positiveInt(stored.list_id) ?? positiveInt(process.env.BREVO_LIST_ID),
      templateId: positiveInt(stored.template_id) ?? positiveInt(process.env.BREVO_TEMPLATE_ID),
      senderName:
        text(stored.sender_name) ?? text(process.env.BREVO_SENDER_NAME) ?? "Kay-Steph Group",
      senderEmail,
      adminEmail: text(stored.admin_email) ?? text(process.env.KAYSTEPH_ADMIN_EMAIL),
    },
  };
}

async function brevoFetch(config: BrevoConfig, path: string, body: unknown): Promise<BrevoResult> {
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

    // Brevo answers 204 for some contact updates, which response.ok covers,
    // and returns a JSON { code, message } for errors.
    const text = await response.text();
    return { ok: false, error: `Brevo ${response.status}: ${text.slice(0, 400)}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: message.includes("abort") ? `Brevo timed out after ${TIMEOUT_MS}ms` : message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export type WorkshopContact = {
  email: string;
  firstName: string;
  fullName: string;
  phone: string;
  location: string;
  gender: string;
  occupation: string | null;
  interest: string;
  eventName: string;
  reference: string;
};

/**
 * Create or update the contact and put them on the event list.
 *
 * updateEnabled makes this idempotent: a returning participant has their
 * details refreshed rather than causing a duplicate-contact error.
 */
export async function upsertBrevoContact(
  config: BrevoConfig,
  contact: WorkshopContact,
): Promise<BrevoResult> {
  return brevoFetch(config, "/contacts", {
    email: contact.email,
    updateEnabled: true,
    attributes: {
      FIRSTNAME: contact.firstName,
      LASTNAME: contact.fullName.split(" ").slice(1).join(" ") || contact.firstName,
      FULL_NAME: contact.fullName,
      SMS: contact.phone,
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

/** The template variables the Kay-Steph confirmation design expects. */
function templateParams(contact: WorkshopContact) {
  return {
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
  };
}

export async function sendBrevoConfirmation(
  config: BrevoConfig,
  contact: WorkshopContact,
): Promise<BrevoResult> {
  if (!config.templateId) {
    return { ok: false, error: "BREVO_TEMPLATE_ID is not set." };
  }
  return brevoFetch(config, "/smtp/email", {
    to: [{ email: contact.email, name: contact.fullName }],
    templateId: config.templateId,
    params: templateParams(contact),
    sender: { name: config.senderName, email: config.senderEmail },
    tags: ["workshop-registration"],
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Internal notification. Deliberately plain HTML rather than a template: the
 * team needs the detail, not a design, and it must not break when somebody
 * edits the participant-facing template.
 */
export async function sendBrevoAdminNotification(
  config: BrevoConfig,
  contact: WorkshopContact,
  expectation: string | null,
): Promise<BrevoResult> {
  if (!config.adminEmail) {
    return { ok: false, error: "KAYSTEPH_ADMIN_EMAIL is not set." };
  }

  const rows: Array<[string, string]> = [
    ["Reference", contact.reference],
    ["Event", contact.eventName],
    ["Name", contact.fullName],
    ["Email", contact.email],
    ["Phone", contact.phone],
    ["Location", contact.location],
    ["Gender", contact.gender],
    ["Occupation", contact.occupation ?? "—"],
    ["Area of interest", contact.interest],
    ["Hopes to gain", expectation ?? "—"],
  ];

  const html = `<h2 style="font-family:Georgia,serif">New workshop registration</h2>
<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="color:#6b7280">${escapeHtml(label)}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`,
  )
  .join("\n")}
</table>`;

  return brevoFetch(config, "/smtp/email", {
    to: [{ email: config.adminEmail }],
    subject: `New registration — ${contact.eventName} (${contact.reference})`,
    htmlContent: html,
    sender: { name: config.senderName, email: config.senderEmail },
    replyTo: { email: contact.email, name: contact.fullName },
    tags: ["workshop-registration-admin"],
  });
}
