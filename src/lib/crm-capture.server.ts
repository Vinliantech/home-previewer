import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import type { InvestmentType, LeadSource } from "@/lib/crm";

/**
 * Minimal lead intake wired to the current `leads` schema (full_name, email,
 * phone, property_name, investment_type, notes, raw_payload). Historical CRM
 * enrichment (interests, activities, assignment) is not connected in this
 * build; captureLead persists the enquiry and returns.
 */

type Text = string | null | undefined;

export type LeadCaptureInput = {
  source: LeadSource;
  submissionId?: Text;
  sourceReference?: Text;
  sourceDetail?: Text;
  fullName: string;
  email?: Text;
  phone?: Text;
  whatsappNumber?: Text;
  location?: Text;
  countryOfResidence?: Text;
  propertyName?: Text;
  propertyType?: Text;
  preferredLocation?: Text;
  budgetMin?: number | null;
  budgetMax?: number | null;
  investmentType?: InvestmentType | null;
  preferredContactMethod?: Text;
  expectedTimeline?: Text;
  message?: Text;
  consentGiven?: boolean;
  capturedAt?: Text;
  rawPayload?: Json;
  facebook?: {
    leadId?: Text;
    pageId?: Text;
    campaignId?: Text;
    campaignName?: Text;
    adsetId?: Text;
    adsetName?: Text;
    adId?: Text;
    adName?: Text;
    formId?: Text;
  };
  interestMetadata?: Json;
  acknowledgement?: {
    investmentLabel?: Text;
    eventName?: Text;
  };
  suppressAcknowledgement?: boolean;
};

export type LeadCaptureResult = {
  leadId: string;
  merged: boolean;
  acknowledgementSent: boolean;
  duplicateSubmission: boolean;
};

function clean(value: Text): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

export async function captureLead(input: LeadCaptureInput): Promise<LeadCaptureResult> {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      full_name: clean(input.fullName) ?? "Unknown lead",
      email: clean(input.email) ?? "",
      phone: clean(input.phone) ?? clean(input.whatsappNumber),
      property_name: clean(input.propertyName),
      investment_type: input.investmentType ?? null,
      notes: clean(input.message),
      raw_payload: (input.rawPayload ?? (input as unknown as Json)) ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Lead creation failed.");
  return {
    leadId: data.id,
    merged: false,
    acknowledgementSent: false,
    duplicateSubmission: false,
  };
}

export async function recordCaptureFailure(input: LeadCaptureInput, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[crm-capture] capture failed:", message, "| source:", input.source);
}
