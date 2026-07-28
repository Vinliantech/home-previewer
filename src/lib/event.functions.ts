import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * The events CRM (crm_events, event_registrations) is not provisioned in this
 * build. These placeholders keep the public event page importing without
 * error and surface a friendly message if the form is submitted.
 */

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
  .handler(async () => {
    throw new Error("Event registration is not available in this environment yet.");
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
  .handler(async () => {
    throw new Error("Event registration is not available in this environment yet.");
  });
