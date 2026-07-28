import { z } from "zod";
import { createEdgeFn } from "@/integrations/supabase/edge";

const referralSchema = z.object({
  clientFullName: z.string().trim().min(2, "Enter the client's full name").max(120),
  clientEmail: z.string().trim().email("Enter a valid email address").max(160),
  clientPhone: z.string().trim().min(7, "Enter a valid phone number").max(24),
  propertyOfInterest: z.string().trim().max(160).optional(),
  clientBudgetMin: z.number().nonnegative().nullable().optional(),
  clientBudgetMax: z.number().nonnegative().nullable().optional(),
  clientRequirements: z.string().trim().max(2000).optional(),
  contactMethod: z.string().trim().min(1).max(40),
});

export type AffiliateReferralInput = z.infer<typeof referralSchema>;

export const submitAffiliateReferral = createEdgeFn<
  AffiliateReferralInput,
  {
    ok: true;
    clientLeadId: string;
    leadId: string | null;
    merged: boolean;
  }
>("secure-workflows", "affiliate_referral", (input) => referralSchema.parse(input));
