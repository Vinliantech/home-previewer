import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Affiliate referral intake.
 *
 * A referral is two records, not one. client_leads is the affiliate's own
 * record — commissions reference it — and the CRM lead is what puts a person
 * in front of an adviser. Writing only the first is what used to happen, and
 * it meant referrals were never assigned, never followed up and never
 * acknowledged.
 *
 * The affiliate id is resolved from the caller's session, never taken from the
 * request, so an affiliate cannot file a referral under someone else's code and
 * claim their commission.
 */
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

export const submitAffiliateReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => referralSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Read through the caller's own RLS-scoped client: this can only ever
    // return the profile that belongs to them.
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliate_profiles")
      .select("id, status, affiliate_code")
      .eq("user_id", userId)
      .maybeSingle();

    if (affiliateError) throw new Error(affiliateError.message);
    if (!affiliate) throw new Error("No affiliate profile is linked to this account.");
    // "active" is what admin approval sets; "pending" and "suspended" are the
    // other states, and the portal already hides the form for both.
    if (affiliate.status !== "active") {
      throw new Error("Your affiliate account is not active, so referrals cannot be filed.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();

    const { data: clientLead, error: insertError } = await supabaseAdmin
      .from("client_leads")
      .insert({
        affiliate_id: affiliate.id,
        client_full_name: data.clientFullName,
        client_email: data.clientEmail,
        client_phone: data.clientPhone,
        property_of_interest: data.propertyOfInterest || null,
        client_budget_min: data.clientBudgetMin ?? null,
        client_budget_max: data.clientBudgetMax ?? null,
        client_requirements: data.clientRequirements || null,
        contact_method: data.contactMethod,
      })
      .select("id")
      .single();

    if (insertError || !clientLead) {
      throw new Error(insertError?.message ?? "The referral could not be saved.");
    }

    // The referral is already safely recorded. If the CRM hand-off fails the
    // affiliate must still see success and keep their commission claim, so the
    // failure is logged for the team rather than thrown back.
    try {
      const { captureLead } = await import("@/lib/crm-capture.server");
      const result = await captureLead({
        source: "affiliate",
        sourceReference: affiliate.affiliate_code,
        sourceDetail: `Affiliate referral (${affiliate.affiliate_code})`,
        fullName: data.clientFullName,
        email: data.clientEmail,
        phone: data.clientPhone,
        propertyName: data.propertyOfInterest,
        budgetMin: data.clientBudgetMin ?? null,
        budgetMax: data.clientBudgetMax ?? null,
        preferredContactMethod: data.contactMethod,
        message: data.clientRequirements,
        // The client did not fill this form, so no consent is implied on their
        // behalf; the acknowledgement copy treats it as an introduction.
        consentGiven: false,
        capturedAt: now,
        rawPayload: {
          source: "affiliate",
          affiliate_code: affiliate.affiliate_code,
          client_lead_id: clientLead.id,
          submitted_at: now,
        },
        interestMetadata: { referred_by_affiliate: affiliate.affiliate_code },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- crm_lead_id and referred_by_affiliate_id enter the generated types after the migration runs.
      const sb = supabaseAdmin as any;
      await Promise.all([
        sb.from("client_leads").update({ crm_lead_id: result.leadId }).eq("id", clientLead.id),
        sb
          .from("leads")
          .update({ referred_by_affiliate_id: affiliate.id })
          .eq("id", result.leadId)
          .is("referred_by_affiliate_id", null),
      ]);

      return {
        ok: true,
        clientLeadId: clientLead.id,
        leadId: result.leadId,
        merged: result.merged,
      };
    } catch (error) {
      console.error("[affiliate] referral saved but CRM hand-off failed:", error);
      return { ok: true, clientLeadId: clientLead.id, leadId: null, merged: false };
    }
  });
