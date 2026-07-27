import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { InvestmentType } from "@/lib/crm";

/**
 * Youth Network Workshop registration.
 *
 * A training registration, not a property enquiry, so it does not reuse
 * registerForCrmEvent: that one requires a crm_events UUID plus an investment
 * type, country and contact preference that a student signing up for a
 * workshop has no reason to answer.
 *
 * It still travels the shared capture pipeline, so a registrant is deduplicated
 * against any enquiry they have already made, acknowledged by email, and routed
 * to an adviser exactly like every other inbound lead.
 */
export const YOUTH_NETWORK_INTERESTS = [
  "Real Estate Sales",
  "Property Investment",
  "Digital Marketing",
  "Affiliate Marketing",
  "Entrepreneurship",
  "Career Development",
  "Networking",
  "Other",
] as const;

export const YOUTH_NETWORK_GENDERS = ["Male", "Female", "Prefer not to say"] as const;

/**
 * Most people register to learn a trade, not to buy — so the default is
 * not_decided and only the genuinely investment-shaped answers map across.
 * Guessing otherwise would send training registrants down an investor
 * follow-up path.
 */
const INTEREST_TO_INVESTMENT: Partial<Record<string, InvestmentType>> = {
  "Property Investment": "fractional",
};

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  location: z.string().trim().min(2, "Enter your city or state").max(120),
  gender: z.enum(YOUTH_NETWORK_GENDERS),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  email: z.string().trim().email("Enter a valid email address").max(160),
  whatsapp: z.string().trim().max(30).optional(),
  occupation: z.string().trim().max(120).optional(),
  interest: z.enum(YOUTH_NETWORK_INTERESTS),
  expectation: z.string().trim().max(2000).optional(),
  consentGiven: z.boolean().refine(Boolean, "Please accept the consent statement."),
  // Honeypot: a hidden field real people never fill.
  company: z.string().max(0).optional(),
});

export type YouthNetworkRegistrationInput = z.infer<typeof registrationSchema>;

/** Identifies this workshop for de-duplication and reporting. */
export const YOUTH_NETWORK_EVENT_KEY = "youth-network-workshop-2.0";
export const YOUTH_NETWORK_EVENT_NAME = "Kay-Steph Youth Network Workshop 2.0";

export const submitYouthNetworkRegistration = createServerFn({ method: "POST" })
  .validator((input: unknown) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    // A bot filled the hidden field. Answer as though it worked so it learns
    // nothing, but record nothing.
    if (data.company) {
      return {
        ok: true as const,
        reference: "KSYN-00000",
        email: data.email,
        alreadyRegistered: false,
      };
    }

    const email = data.email.trim().toLowerCase();
    const now = new Date().toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- workshop_registrations enters the generated types after the migration runs.
    const sb = supabaseAdmin as any;

    // One registration per person per workshop. A repeat submission returns
    // the original reference rather than erroring: the participant most likely
    // lost the email, and a second row would give them a second reference for
    // the same seat.
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
      };
    }

    // Save first. Everything after this point is a side effect that must not
    // be able to lose the registration.
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

    // The CRM lead is the follow-up record. A failure here must not cost the
    // registration either, so it is recorded and moved past.
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
        // Brevo sends the confirmation for this form, so the CRM's own
        // acknowledgement is suppressed — two emails for one sign-up reads as
        // a system fault to the participant.
        suppressAcknowledgement: true,
      });
      leadId = capture.leadId;
    } catch (error) {
      console.error("[youth-network] CRM capture failed:", error);
    }

    // Brevo: contact, confirmation, admin notice. Each records its own outcome.
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
      // Logged, not thrown: the seat is booked and the participant gets their
      // reference. Undelivered mail is retried from the registrations list.
      console.error(`[youth-network] ${reference} saved, delivery issues:`, errors.join(" | "));
    }

    return {
      ok: true as const,
      reference,
      email: data.email.trim(),
      alreadyRegistered: false,
      confirmationSent: confirmationStatus === "sent",
    };
  });
