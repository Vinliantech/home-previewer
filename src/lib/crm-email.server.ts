// The `email_deliveries` audit table is not present in the current schema.
// Delivery attempts are logged to the console so the app still ships email
// without pretending we persisted an audit record.

type SendCrmEmailInput = {
  leadId?: string | null;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function logDelivery(values: {
  lead_id?: string | null;
  recipient_email: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
}) {
  console.info("[crm-email]", values.status, values.recipient_email, values.subject, {
    lead_id: values.lead_id ?? null,
    error: values.error_message ?? null,
    message_id: values.provider_message_id ?? null,
  });
}


export async function sendCrmEmail(
  input: SendCrmEmailInput,
): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CRM_EMAIL_FROM;

  if (!apiKey || !from) {
    await logDelivery({
      lead_id: input.leadId,
      recipient_email: input.to,
      subject: input.subject,
      status: "skipped",
      error_message: "Email provider is not configured.",
    });
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
    });
    const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) {
      await logDelivery({
        lead_id: input.leadId,
        recipient_email: input.to,
        subject: input.subject,
        status: "failed",
        error_message: payload.message ?? `Email provider returned ${response.status}.`,
      });
      return { ok: false, reason: "provider_error" };
    }

    await logDelivery({
      lead_id: input.leadId,
      recipient_email: input.to,
      subject: input.subject,
      status: "sent",
      provider_message_id: payload.id ?? null,
      sent_at: new Date().toISOString(),
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    await logDelivery({
      lead_id: input.leadId,
      recipient_email: input.to,
      subject: input.subject,
      status: "failed",
      error_message: message,
    });
    return { ok: false, reason: "network_error" };
  }
}

/**
 * Staff invitation. The link is a single-use Supabase action link, so the body
 * is deliberately plain: no tracking, no forwarding-friendly wording.
 */
export async function sendStaffInvite(input: {
  to: string;
  fullName: string;
  position?: string | null;
  roleLabel?: string | null;
  actionLink: string;
}) {
  const firstName = escapeHtml(input.fullName.trim().split(/\s+/)[0] || "there");
  const role = input.position || input.roleLabel;
  const asRole = role ? ` as <strong>${escapeHtml(role)}</strong>` : "";
  const asRoleText = role ? ` as ${role}` : "";

  return sendCrmEmail({
    to: input.to,
    subject: "You have been invited to the Kay-Steph workspace",
    html:
      `<p>Hello ${firstName},</p>` +
      `<p>You have been added to the Kay-Steph Group workspace${asRole}. ` +
      `Set your password using the button below to sign in.</p>` +
      `<p><a href="${input.actionLink}" style="display:inline-block;background:#0b4539;color:#ffffff;` +
      `padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600">Set my password</a></p>` +
      `<p style="color:#6b7280;font-size:13px">This link can only be used once and will expire. ` +
      `If you were not expecting this invitation, you can ignore this email.</p>` +
      `<p>Kind regards,<br><strong>Kay-Steph Group</strong></p>`,
    text:
      `Hello ${firstName}, you have been added to the Kay-Steph Group workspace${asRoleText}. ` +
      `Set your password to sign in: ${input.actionLink} ` +
      `(single use, expires). If you were not expecting this invitation, ignore this email.`,
  });
}

export async function sendClientPasswordReset(input: {
  to: string;
  fullName: string;
  actionLink: string;
}) {
  const firstName = input.fullName.trim().split(/\s+/)[0] || "Client";
  return sendCrmEmail({
    to: input.to,
    subject: "Reset your Kay-Steph portal password",
    html:
      `<p>Hello ${escapeHtml(firstName)},</p>` +
      `<p>An administrator has created a secure password-reset link for your Kay-Steph client portal.</p>` +
      `<p><a href="${input.actionLink}" style="display:inline-block;background:#0b4539;color:#ffffff;` +
      `padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600">Reset my password</a></p>` +
      `<p style="color:#6b7280;font-size:13px">This one-time link expires automatically. ` +
      `If you did not request a reset, contact Kay-Steph Group before using it.</p>` +
      `<p>Kind regards,<br><strong>Kay-Steph Group</strong></p>`,
    text:
      `Hello ${firstName}, reset your Kay-Steph portal password using this one-time link: ` +
      `${input.actionLink} If you did not request it, contact Kay-Steph Group.`,
  });
}

export async function sendLeadAcknowledgement(input: {
  leadId: string;
  fullName: string;
  email: string | null;
  source: string;
  propertyName?: string | null;
  investmentLabel?: string | null;
  eventName?: string | null;
}) {
  if (!input.email) return { ok: false, reason: "no_email" };

  const firstName = escapeHtml(input.fullName.trim().split(/\s+/)[0] || "there");
  const propertyName = escapeHtml(input.propertyName || "your selected property");
  const investmentModel = escapeHtml(input.investmentLabel || "property investment");
  const eventName = escapeHtml(input.eventName || "your selected Kay-Steph event");
  const signature = "<p>Kind regards,<br><strong>Kay-Steph Group</strong></p>";

  if (input.source === "event_registration" || input.source === "workshop_registration") {
    return sendCrmEmail({
      leadId: input.leadId,
      to: input.email,
      subject: "Your Kay-Steph registration is confirmed",
      html: `<p>Hello ${firstName},</p><p>Your registration for <strong>${eventName}</strong> has been received. We will send the confirmed date, time, location or meeting link and a reminder before the event.</p>${signature}`,
      text: `Hello ${firstName}, your registration for ${eventName} has been received. Kay-Steph will send the confirmed event details and a reminder.`,
    });
  }

  if (input.source === "website_investment_form" || input.investmentLabel) {
    return sendCrmEmail({
      leadId: input.leadId,
      to: input.email,
      subject: "Your Kay-Steph investment enquiry",
      html: `<p>Hello ${firstName},</p><p>Thank you for your interest in <strong>${investmentModel}</strong>. We have received your information. A Kay-Steph adviser will contact you to explain the opportunity, eligibility requirements, documents and next steps.</p>${signature}`,
      text: `Hello ${firstName}, thank you for your interest in ${investmentModel}. A Kay-Steph adviser will contact you shortly.`,
    });
  }

  return sendCrmEmail({
    leadId: input.leadId,
    to: input.email,
    subject: "We received your Kay-Steph property enquiry",
    html: `<p>Hello ${firstName},</p><p>Thank you for your interest in <strong>${propertyName}</strong>. A Kay-Steph property adviser will contact you shortly with the property details, available documents and next steps.</p>${signature}`,
    text: `Hello ${firstName}, thank you for your interest in ${propertyName}. A Kay-Steph property adviser will contact you shortly.`,
  });
}
