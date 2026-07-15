import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(160),
  phone: z.string().trim().min(7, "Please enter a valid phone number").max(24),
  subject: z.enum([
    "buy_property",
    "invest",
    "site_inspection",
    "existing_investment",
    "partnership",
    "other",
  ]),
  propertyInterest: z.string().trim().max(160).optional(),
  budget: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "Tell us a little more about your enquiry").max(2000),
  // Honeypot: hidden field real users never fill.
  company: z.string().max(0).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

const SUBJECT_INVESTMENT_TYPE: Record<string, "full_purchase" | "fractional" | null> = {
  buy_property: "full_purchase",
  invest: "fractional",
  site_inspection: null,
  existing_investment: null,
  partnership: null,
  other: null,
};

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((input) => enquirySchema.parse(input))
  .handler(async ({ data }) => {
    const FRIENDLY_ERROR =
      "We could not submit your enquiry. Please try again or contact us on WhatsApp.";

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("leads").insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        property_name: data.propertyInterest || null,
        investment_type: SUBJECT_INVESTMENT_TYPE[data.subject],
        notes: data.message,
        raw_payload: {
          source: "website_contact_form",
          subject: data.subject,
          property_interest: data.propertyInterest ?? null,
          budget: data.budget ?? null,
          submitted_at: new Date().toISOString(),
        },
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error("[enquiry] lead submission failed:", error);
      throw new Error(FRIENDLY_ERROR);
    }

    return { ok: true };
  });
