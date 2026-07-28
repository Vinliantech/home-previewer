import { z } from "zod";
import { createEdgeFn } from "@/integrations/supabase/edge";

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

export const submitEnquiry = createEdgeFn<
  EnquiryInput,
  {
    ok: true;
    leadId: string;
    merged: boolean;
    acknowledgementSent: boolean;
  }
>("public-workflows", "enquiry", (input) => enquirySchema.parse(input));
