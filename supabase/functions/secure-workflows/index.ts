import { z } from "npm:zod@3.24.2";
import {
  HttpError,
  enforceRateLimit,
  requireUser,
  runJsonEndpoint,
  serviceClient,
} from "../_shared/platform.ts";
import { captureLead } from "../_shared/crm.ts";

const referralSchema = z.object({
  clientFullName: z.string().trim().min(2).max(120),
  clientEmail: z.string().trim().email().max(160),
  clientPhone: z.string().trim().min(7).max(24),
  propertyOfInterest: z.string().trim().max(160).optional(),
  clientBudgetMin: z.number().nonnegative().nullable().optional(),
  clientBudgetMax: z.number().nonnegative().nullable().optional(),
  clientRequirements: z.string().trim().max(2000).optional(),
  contactMethod: z.string().trim().min(1).max(40),
});

Deno.serve((request) =>
  runJsonEndpoint(request, "secure-workflows", async (body) => {
    enforceRateLimit(request, "secure-workflows", 30, 10 * 60_000);
    const action = String(body.action ?? "");
    if (action !== "affiliate_referral") throw new HttpError(404, "Unknown workflow action.");
    const parsed = referralSchema.safeParse(body.input);
    if (!parsed.success)
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    const data = parsed.data;
    const { user } = await requireUser(request);
    const admin = serviceClient();

    const { data: affiliate, error: affiliateError } = await admin
      .from("affiliate_profiles")
      .select("id, status, affiliate_code")
      .eq("user_id", user.id)
      .maybeSingle();
    if (affiliateError) throw new Error(affiliateError.message);
    if (!affiliate) throw new HttpError(403, "No affiliate profile is linked to this account.");
    if (affiliate.status !== "active") {
      throw new HttpError(403, "Your affiliate account is not active.");
    }

    const { data: clientLead, error } = await admin
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
    if (error || !clientLead) throw new Error(error?.message ?? "Referral could not be saved.");

    try {
      const capture = await captureLead(admin, {
        source: "affiliate",
        sourceReference: affiliate.affiliate_code,
        sourceDetail: `Affiliate referral (${affiliate.affiliate_code})`,
        fullName: data.clientFullName,
        email: data.clientEmail,
        phone: data.clientPhone,
        propertyName: data.propertyOfInterest,
        budgetMin: data.clientBudgetMin,
        budgetMax: data.clientBudgetMax,
        preferredContactMethod: data.contactMethod,
        message: data.clientRequirements,
        consentGiven: false,
        rawPayload: {
          source: "affiliate",
          affiliate_code: affiliate.affiliate_code,
          client_lead_id: clientLead.id,
        },
        interestMetadata: { referred_by_affiliate: affiliate.affiliate_code },
      });
      await Promise.all([
        admin.from("client_leads").update({ crm_lead_id: capture.leadId }).eq("id", clientLead.id),
        admin
          .from("leads")
          .update({ referred_by_affiliate_id: affiliate.id })
          .eq("id", capture.leadId)
          .is("referred_by_affiliate_id", null),
      ]);
      return {
        ok: true,
        clientLeadId: clientLead.id,
        leadId: capture.leadId,
        merged: capture.merged,
      };
    } catch (captureError) {
      console.error("[affiliate-referral] CRM hand-off failed", captureError);
      return { ok: true, clientLeadId: clientLead.id, leadId: null, merged: false };
    }
  }),
);
