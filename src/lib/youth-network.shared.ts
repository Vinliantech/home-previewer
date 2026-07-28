import { z } from "zod";
import type { InvestmentType } from "@/lib/crm";
import {
  YOUTH_NETWORK_EVENT_KEY,
  YOUTH_NETWORK_EVENT_NAME,
  YOUTH_NETWORK_GENDERS,
  YOUTH_NETWORK_INTERESTS,
} from "@/lib/youth-network.constants";

/**
 * Shared handler for Youth Network workshop registration.
 *
 * Called from two places:
 *  - the in-app server function (typed RPC from the SPA)
 *  - the public API route at /api/public/youth-network (CORS, used by the
 *    standalone youth-network.html hosted on a subdomain).
 *
 * Both paths must produce the same reference, the same Brevo emails and the
 * same CRM lead — so the logic lives here, not in either entry point.
 */
export const youthNetworkRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  gender: z.enum(YOUTH_NETWORK_GENDERS).default("Prefer not to say"),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160),
  whatsapp: z.string().trim().max(30).optional(),
  occupation: z.string().trim().max(120).optional(),
  interest: z.enum(YOUTH_NETWORK_INTERESTS).default("Other"),
  expectation: z.string().trim().max(2000).optional(),
  consentGiven: z.boolean().default(true),
  company: z.string().max(0).optional(),
});

export type YouthNetworkRegistrationInput = z.infer<typeof youthNetworkRegistrationSchema>;

const INTEREST_TO_INVESTMENT: Partial<Record<string, InvestmentType>> = {
  "Property Investment": "fractional",
};

export async function processYouthNetworkRegistration(data: YouthNetworkRegistrationInput) {
  if (data.company) {
    return {
      ok: true as const,
      reference: "KSYN-00000",
      email: data.email,
      alreadyRegistered: false,
      confirmationSent: false,
    };
  }

  const email = data.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabaseAdmin as any;

  const { data: existing } = await sb
    .from("workshop_registrations")
    .select("reference, confirmation_email_status")
    .eq("event_key", YOUTH_NETWORK_EVENT_KEY)
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return {
      ok: true as const,
      reference: existing.reference as string,
      email: data.email,
      alreadyRegistered: true,
      confirmationSent: existing.confirmation_email_status === "sent",
    };
  }

  const { data: registration, error: insertError } = await sb
    .from("workshop_registrations")
    .insert({
      event_key: YOUTH_NETWORK_EVENT_KEY,
      event_name: YOUTH_NETWORK_EVENT_NAME,
      full_name: data.fullName,
      email: data.email.trim(),
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      location: data.location,
      gender: data.gender,
      occupation: data.occupation || null,
      interest: data.interest,
      expectation: data.expectation || null,
      consent_given: data.consentGiven,
      consent_at: now,
    })
    .select("id, reference")
    .single();

  if (insertError || !registration) {
    console.error("[youth-network] could not save registration:", insertError);
    throw new Error(
      "We could not complete your registration. Please try again or reach us on WhatsApp.",
    );
  }

  const reference: string = registration.reference;

  let leadId: string | null = null;
  try {
    const { captureLead } = await import("@/lib/crm-capture.server");
    const capture = await captureLead({
      source: "workshop_registration",
      sourceReference: reference,
      sourceDetail: YOUTH_NETWORK_EVENT_NAME,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      whatsappNumber: data.whatsapp || data.phone,
      location: data.location,
      investmentType: INTEREST_TO_INVESTMENT[data.interest] ?? "not_decided",
      preferredContactMethod: data.whatsapp ? "whatsapp" : "phone",
      message: data.expectation,
      consentGiven: data.consentGiven,
      capturedAt: now,
      rawPayload: {
        source: "youth_network_workshop",
        registration_reference: reference,
        gender: data.gender,
        occupation: data.occupation ?? null,
        interest: data.interest,
        expectation: data.expectation ?? null,
        submitted_at: now,
      },
      interestMetadata: {
        programme: YOUTH_NETWORK_EVENT_NAME,
        registration_reference: reference,
        interest: data.interest,
        gender: data.gender,
        occupation: data.occupation ?? null,
      },
      suppressAcknowledgement: true,
    });
    leadId = capture.leadId;
  } catch (error) {
    console.error("[youth-network] CRM capture failed:", error);
  }

  const { brevoConfig, upsertBrevoContact, sendBrevoConfirmation, sendBrevoAdminNotification } =
    await import("@/lib/brevo.server");

  const firstName = data.fullName.trim().split(/\s+/)[0] || data.fullName.trim();
  const contact = {
    email: data.email.trim(),
    firstName,
    fullName: data.fullName.trim(),
    phone: data.phone,
    location: data.location,
    gender: data.gender,
    occupation: data.occupation || null,
    interest: data.interest,
    eventName: YOUTH_NETWORK_EVENT_NAME,
    reference,
  };

  let contactStatus = "failed";
  let confirmationStatus = "failed";
  let adminStatus = "failed";
  const errors: string[] = [];

  const configured = await brevoConfig();
  if ("error" in configured) {
    errors.push(configured.error);
  } else {
    const { config } = configured;
    const [contactResult, confirmationResult, adminResult] = await Promise.all([
      upsertBrevoContact(config, contact),
      sendBrevoConfirmation(config, contact),
      sendBrevoAdminNotification(config, contact, data.expectation || null),
    ]);
    if (contactResult.ok) contactStatus = "synced";
    else errors.push(`contact: ${contactResult.error}`);
    if (confirmationResult.ok) confirmationStatus = "sent";
    else errors.push(`confirmation: ${confirmationResult.error}`);
    if (adminResult.ok) adminStatus = "sent";
    else errors.push(`admin: ${adminResult.error}`);
  }

  await sb
    .from("workshop_registrations")
    .update({
      lead_id: leadId,
      brevo_contact_status: contactStatus,
      confirmation_email_status: confirmationStatus,
      admin_email_status: adminStatus,
      last_error: errors.length ? errors.join(" | ").slice(0, 2000) : null,
      last_attempt_at: now,
    })
    .eq("id", registration.id);

  if (errors.length) {
    console.error(`[youth-network] ${reference} saved, delivery issues:`, errors.join(" | "));
  }

  return {
    ok: true as const,
    reference,
    email: data.email.trim(),
    alreadyRegistered: false,
    confirmationSent: confirmationStatus === "sent",
  };
}
