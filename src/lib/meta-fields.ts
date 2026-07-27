import type { Json } from "@/integrations/supabase/types";
import type { InvestmentType } from "@/lib/crm";

/**
 * Turning a Meta lead into a CRM capture.
 *
 * Shared by the webhook and the form importer so a lead recovered days later
 * lands identically to one delivered live — the two drifting would mean the
 * same person captured with different fields depending on which path found
 * them. Pure and dependency-free so it can be unit tested.
 */

export type MetaLeadPayload = {
  field_data?: Array<{ name: string; values?: string[] }>;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
  created_time?: string;
};

export type MetaLeadContext = {
  leadgenId: string;
  pageId?: string | null;
  formId?: string | null;
  adId?: string | null;
};

export function parseInvestment(value: string | undefined): InvestmentType {
  if (!value) return "not_decided";
  const text = value.toLowerCase();
  if (text.includes("group")) return "group_purchase";
  if (text.includes("fraction")) return "fractional";
  if (text.includes("token")) return "tokenized";
  if (text.includes("rental") || text.includes("income")) return "rental_income";
  if (text.includes("land")) return "land_purchase";
  if (text.includes("commercial")) return "commercial_property";
  if (text.includes("residential")) return "residential_property";
  if (text.includes("full") || text.includes("outright")) return "full_purchase";
  return "not_decided";
}

export function parseBudget(value: string | undefined): [number | null, number | null] {
  if (!value) return [null, null];
  // The unit is usually written against the figure ("₦250m", "50-100 million").
  // A \b before the m never matches the attached form, because digit-to-letter
  // is not a word boundary — that read "₦250m" as a budget of 250.
  const multiplier = /\d\s*m(?:illion)?\b/i.test(value) ? 1_000_000 : 1;
  const numbers =
    value
      .replace(/,/g, "")
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number) ?? [];
  if (numbers.length >= 2) return [numbers[0] * multiplier, numbers[1] * multiplier];
  if (numbers.length === 1) return [numbers[0] * multiplier, numbers[0] * multiplier];
  return [null, null];
}

/**
 * Meta lowercases standard field names but a form's custom questions keep
 * whatever the advertiser typed, so every lookup goes through a lowercased map
 * and each value is tried under the several names Meta forms use in practice.
 */
export function buildFieldMap(payload: MetaLeadPayload): Map<string, string> {
  const map = new Map<string, string>();
  for (const field of payload.field_data ?? []) {
    if (!field?.name) continue;
    map.set(field.name.toLowerCase().trim(), field.values?.[0] ?? "");
  }
  return map;
}

function firstOf(map: Map<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = map.get(key);
    if (value && value.trim() !== "") return value.trim();
  }
  return null;
}

export function parseMetaLeadFields(payload: MetaLeadPayload, ctx: MetaLeadContext) {
  const map = buildFieldMap(payload);

  const phone = firstOf(map, "phone_number", "phone", "mobile_number", "mobile");
  const email = firstOf(map, "email", "email_address");
  // Meta forms can split the name across two questions; a lead with a phone
  // number and no full_name is still worth calling, so rebuild it rather than
  // filing everyone as "Unknown lead".
  const splitName = [firstOf(map, "first_name"), firstOf(map, "last_name")]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName =
    firstOf(map, "full_name", "full name", "name") ??
    (splitName === "" ? "Unknown lead" : splitName);

  const [budgetMin, budgetMax] = parseBudget(firstOf(map, "budget", "budget_range") ?? undefined);

  return {
    source: "facebook_lead_ads" as const,
    // Meta redelivers; the leadgen id is what keeps capture idempotent, and it
    // is why re-importing a form cannot duplicate anyone.
    submissionId: ctx.leadgenId,
    fullName,
    email,
    phone,
    whatsappNumber: firstOf(map, "whatsapp_number", "whatsapp") ?? phone,
    location: firstOf(map, "location", "city"),
    countryOfResidence: firstOf(map, "country", "country_of_residence"),
    propertyName: firstOf(map, "property", "property_interest"),
    preferredLocation: firstOf(map, "preferred_location", "property_location"),
    budgetMin,
    budgetMax,
    investmentType: parseInvestment(firstOf(map, "investment_type", "investment") ?? undefined),
    preferredContactMethod: firstOf(map, "preferred_contact_method", "contact_method"),
    expectedTimeline: firstOf(map, "expected_investment_timeline", "timeline"),
    // Meta collects the consent statement inside the lead form itself.
    consentGiven: true,
    capturedAt: payload.created_time ?? new Date().toISOString(),
    rawPayload: payload as unknown as Json,
    facebook: {
      leadId: ctx.leadgenId,
      pageId: ctx.pageId ?? undefined,
      campaignId: payload.campaign_id,
      campaignName: payload.campaign_name,
      adsetId: payload.adset_id,
      adsetName: payload.adset_name,
      adId: payload.ad_id ?? ctx.adId ?? undefined,
      adName: payload.ad_name,
      formId: payload.form_id ?? ctx.formId ?? undefined,
    },
    interestMetadata: {
      campaign_name: payload.campaign_name ?? null,
      adset_name: payload.adset_name ?? null,
      ad_name: payload.ad_name ?? null,
      form_id: payload.form_id ?? ctx.formId ?? null,
    },
    acknowledgement: { investmentLabel: firstOf(map, "investment_type") },
  };
}
