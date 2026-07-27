import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const investmentTypes = [
  "full_purchase",
  "group_purchase",
  "fractional",
  "tokenized",
  "land_purchase",
  "residential_property",
  "commercial_property",
  "rental_income",
  "not_decided",
] as const;

export const getPublicCrmEvent = createServerFn({ method: "GET" })
  .validator((input) => z.object({ eventId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event, error } = await supabaseAdmin
      .from("crm_events")
      .select(
        "id, name, event_type, property_name, starts_at, ends_at, venue, meeting_url, capacity, description, status",
      )
      .eq("id", data.eventId)
      .eq("status", "published")
      .maybeSingle();
    if (error || !event) throw new Error("This event is not available for registration.");
    const { count } = await supabaseAdmin
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", data.eventId)
      .neq("status", "cancelled");
    return { event, registrations: count ?? 0 };
  });

export const registerForCrmEvent = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        eventId: z.string().uuid(),
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(160),
        phone: z.string().trim().min(7).max(30),
        whatsappNumber: z.string().trim().max(30).optional(),
        location: z.string().trim().max(120).optional(),
        countryOfResidence: z.string().trim().max(100),
        propertyInterest: z.string().trim().max(160).optional(),
        budgetMin: z.number().nonnegative().optional(),
        budgetMax: z.number().nonnegative().optional(),
        investmentType: z.enum(investmentTypes),
        heardAbout: z.string().trim().max(100).optional(),
        preferredContactMethod: z.enum(["whatsapp", "phone", "email"]),
        consentGiven: z.boolean().refine(Boolean),
        company: z.string().max(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event } = await supabaseAdmin
      .from("crm_events")
      .select("id, name, event_type, property_name, status, capacity")
      .eq("id", data.eventId)
      .eq("status", "published")
      .maybeSingle();
    if (!event) throw new Error("This event is not accepting registrations.");
    if (event.capacity) {
      const { count } = await supabaseAdmin
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .neq("status", "cancelled");
      if ((count ?? 0) >= event.capacity) throw new Error("This event has reached capacity.");
    }

    const source =
      event.event_type === "workshop"
        ? ("workshop_registration" as const)
        : ("event_registration" as const);
    const now = new Date().toISOString();
    // The shared pipeline owns contact matching, the fill-only merge, the
    // acknowledgement and adviser routing. No submissionId: the event id is
    // shared by every registrant, so it must not act as a de-duplication key —
    // the event_registrations upsert below makes a repeat registration a no-op.
    const { captureLead } = await import("@/lib/crm-capture.server");
    const capture = await captureLead({
      source,
      sourceReference: event.id,
      sourceDetail: event.name,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber || data.phone,
      location: data.location,
      countryOfResidence: data.countryOfResidence,
      propertyName: data.propertyInterest || event.property_name,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      investmentType: data.investmentType,
      preferredContactMethod: data.preferredContactMethod,
      consentGiven: true,
      capturedAt: now,
      interestMetadata: { event_name: event.name, heard_about: data.heardAbout ?? null },
      acknowledgement: { eventName: event.name },
    });
    const leadId = capture.leadId;
    const existing = capture.merged;

    const { error: registrationError } = await supabaseAdmin.from("event_registrations").upsert(
      {
        event_id: event.id,
        lead_id: leadId,
        status: "registered",
        preferred_contact_method: data.preferredContactMethod,
        consent_given: true,
        consent_at: now,
        notes: data.heardAbout ? `Source: ${data.heardAbout}` : null,
      },
      { onConflict: "event_id,lead_id" },
    );
    if (registrationError) throw new Error("Registration could not be saved.");
    await supabaseAdmin.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "event_registration",
      body: `Registered for ${event.name}.`,
      meta: { event_id: event.id },
    });

    return { ok: true, leadId, merged: existing, eventName: event.name };
  });
