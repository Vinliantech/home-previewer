import { z } from "zod";
import { createEdgeFn } from "@/integrations/supabase/edge";

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

const eventRegistrationSchema = z.object({
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
});

type PublicEvent = {
  id: string;
  name: string;
  event_type: string;
  property_name: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  meeting_url: string | null;
  capacity: number | null;
  description: string | null;
  status: string;
};

export const getPublicCrmEvent = createEdgeFn<
  { eventId: string },
  { event: PublicEvent; registrations: number }
>("public-workflows", "event_get", (input) =>
  z.object({ eventId: z.string().uuid() }).parse(input),
);

export const registerForCrmEvent = createEdgeFn<
  z.infer<typeof eventRegistrationSchema>,
  { ok: true; leadId: string; merged: boolean; eventName: string }
>("public-workflows", "event_register", (input) => eventRegistrationSchema.parse(input));
