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
  consentGiven: z.boolean().refine(Boolean, "Please agree to the contact and privacy notice."),
  company: z.string().max(0).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

const SUBJECT_INVESTMENT_TYPE: Record<
  EnquiryInput["subject"],
  "full_purchase" | "fractional" | "not_decided"
> = {
  buy_property: "full_purchase",
  invest: "fractional",
  site_inspection: "full_purchase",
  existing_investment: "not_decided",
  partnership: "not_decided",
  other: "not_decided",
};

const SUBJECT_SOURCE: Record<
  EnquiryInput["subject"],
  "website_contact_form" | "website_property_enquiry" | "website_investment_form"
> = {
  buy_property: "website_property_enquiry",
  invest: "website_investment_form",
  site_inspection: "website_property_enquiry",
  existing_investment: "website_contact_form",
  partnership: "website_contact_form",
  other: "website_contact_form",
};

const BUDGETS: Record<string, [number | null, number | null]> = {
  "Below ₦50M": [null, 50_000_000],
  "₦50M – ₦100M": [50_000_000, 100_000_000],
  "₦100M – ₦250M": [100_000_000, 250_000_000],
  "₦250M – ₦500M": [250_000_000, 500_000_000],
  "Above ₦500M": [500_000_000, null],
  "Not sure yet": [null, null],
};

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((input) => enquirySchema.parse(input))
  .handler(async ({ data }) => {
    const friendlyError =
      "We could not submit your enquiry. Please try again or contact us on WhatsApp.";

    try {
      const source = SUBJECT_SOURCE[data.subject];
      const investmentType = SUBJECT_INVESTMENT_TYPE[data.subject];
      const [budgetMin, budgetMax] = data.budget
        ? (BUDGETS[data.budget] ?? [null, null])
        : [null, null];
      const now = new Date().toISOString();

      const { captureLead } = await import("@/lib/crm-capture.server");
      const result = await captureLead({
        source,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        propertyName: data.propertyInterest,
        budgetMin,
        budgetMax,
        investmentType,
        message: data.message,
        consentGiven: data.consentGiven,
        capturedAt: now,
        rawPayload: {
          source,
          subject: data.subject,
          property_interest: data.propertyInterest ?? null,
          budget: data.budget ?? null,
          submitted_at: now,
        },
        interestMetadata: { subject: data.subject },
        acknowledgement: {
          investmentLabel:
            data.subject === "invest" ? "fractional or group property investment" : null,
        },
      });

      return {
        ok: true,
        leadId: result.leadId,
        merged: result.merged,
        acknowledgementSent: result.acknowledgementSent,
      };
    } catch (error) {
      console.error("[enquiry] lead submission failed:", error);
      throw new Error(friendlyError);
    }
  });
