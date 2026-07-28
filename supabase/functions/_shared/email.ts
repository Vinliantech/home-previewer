import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendCrmEmail(
  admin: SupabaseClient,
  input: {
    leadId?: string | null;
    to: string;
    subject: string;
    html: string;
    text?: string;
  },
): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from = Deno.env.get("CRM_EMAIL_FROM")?.trim();
  const log = async (
    status: "sent" | "failed" | "skipped",
    providerMessageId?: string | null,
    errorMessage?: string | null,
  ) => {
    const { error } = await admin.from("email_deliveries").insert({
      lead_id: input.leadId ?? null,
      provider: "resend",
      recipient_email: input.to,
      subject: input.subject,
      status,
      provider_message_id: providerMessageId ?? null,
      error_message: errorMessage ?? null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
    if (error) console.warn("[email] delivery log unavailable", error.message);
  };

  if (!apiKey || !from) {
    await log("skipped", null, "Resend is not configured.");
    return { ok: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };
    if (!response.ok) {
      await log("failed", null, payload.message ?? `Resend returned ${response.status}.`);
      return { ok: false, reason: "provider_error" };
    }
    await log("sent", payload.id ?? null);
    return { ok: true };
  } catch (error) {
    await log("failed", null, error instanceof Error ? error.message : String(error));
    return { ok: false, reason: "network_error" };
  }
}

export function staffInviteEmail(input: {
  fullName: string;
  position?: string | null;
  roleLabel?: string | null;
  actionLink: string;
}) {
  const firstName = escapeHtml(input.fullName.trim().split(/\s+/)[0] || "there");
  const role = input.position || input.roleLabel;
  const asRole = role ? ` as <strong>${escapeHtml(role)}</strong>` : "";
  return {
    subject: "You have been invited to the Kay-Steph workspace",
    html:
      `<p>Hello ${firstName},</p><p>You have been added to the Kay-Steph Group workspace${asRole}. ` +
      `Set your password using the secure link below.</p><p><a href="${escapeHtml(input.actionLink)}">` +
      `Set my password</a></p><p>This single-use link expires automatically.</p>`,
    text: `Hello ${firstName}, set your Kay-Steph password: ${input.actionLink}`,
  };
}

export function clientResetEmail(fullName: string, actionLink: string) {
  const firstName = escapeHtml(fullName.trim().split(/\s+/)[0] || "Client");
  return {
    subject: "Reset your Kay-Steph portal password",
    html:
      `<p>Hello ${firstName},</p><p>An administrator created a secure password-reset link for ` +
      `your Kay-Steph client portal.</p><p><a href="${escapeHtml(actionLink)}">Reset my password</a></p>` +
      `<p>This one-time link expires automatically.</p>`,
    text: `Hello ${firstName}, reset your Kay-Steph portal password: ${actionLink}`,
  };
}

export async function sendLeadAcknowledgement(
  admin: SupabaseClient,
  input: {
    leadId: string;
    fullName: string;
    email: string | null;
    source: string;
    propertyName?: string | null;
    investmentLabel?: string | null;
    eventName?: string | null;
  },
) {
  if (!input.email) return { ok: false, reason: "no_email" };
  const firstName = escapeHtml(input.fullName.trim().split(/\s+/)[0] || "there");
  let subject = "We received your Kay-Steph property enquiry";
  let body = `Thank you for your interest in ${escapeHtml(input.propertyName || "your selected property")}. A Kay-Steph adviser will contact you shortly.`;
  if (["event_registration", "workshop_registration"].includes(input.source)) {
    subject = "Your Kay-Steph registration is confirmed";
    body = `Your registration for <strong>${escapeHtml(input.eventName || "your selected event")}</strong> has been received.`;
  } else if (input.source === "website_investment_form" || input.investmentLabel) {
    subject = "Your Kay-Steph investment enquiry";
    body = `Thank you for your interest in <strong>${escapeHtml(input.investmentLabel || "property investment")}</strong>. A Kay-Steph adviser will contact you shortly.`;
  }
  return sendCrmEmail(admin, {
    leadId: input.leadId,
    to: input.email,
    subject,
    html: `<p>Hello ${firstName},</p><p>${body}</p><p>Kind regards,<br><strong>Kay-Steph Group</strong></p>`,
  });
}
