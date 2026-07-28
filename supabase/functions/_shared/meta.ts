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

function firstOf(map: Map<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = map.get(key);
    if (value?.trim()) return value.trim();
  }
  return null;
}

function parseInvestment(value: string | null): string {
  const text = value?.toLowerCase() ?? "";
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

function parseBudget(value: string | null): [number | null, number | null] {
  if (!value) return [null, null];
  const multiplier = /\d\s*m(?:illion)?\b/i.test(value) ? 1_000_000 : 1;
  const numbers =
    value
      .replaceAll(",", "")
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number) ?? [];
  if (numbers.length >= 2) return [numbers[0] * multiplier, numbers[1] * multiplier];
  if (numbers.length === 1) return [numbers[0] * multiplier, numbers[0] * multiplier];
  return [null, null];
}

export function parseMetaLead(
  payload: MetaLeadPayload,
  context: {
    leadgenId: string;
    pageId?: string | null;
    formId?: string | null;
    adId?: string | null;
  },
) {
  const fields = new Map<string, string>();
  for (const field of payload.field_data ?? []) {
    if (field.name) fields.set(field.name.toLowerCase().trim(), field.values?.[0] ?? "");
  }
  const phone = firstOf(fields, "phone_number", "phone", "mobile_number", "mobile");
  const email = firstOf(fields, "email", "email_address");
  const splitName = [firstOf(fields, "first_name"), firstOf(fields, "last_name")]
    .filter(Boolean)
    .join(" ");
  const fullName =
    firstOf(fields, "full_name", "full name", "name") ?? (splitName || "Unknown lead");
  const investmentLabel = firstOf(fields, "investment_type", "investment");
  const [budgetMin, budgetMax] = parseBudget(firstOf(fields, "budget", "budget_range"));
  return {
    source: "facebook_lead_ads",
    submissionId: context.leadgenId,
    fullName,
    email,
    phone,
    whatsappNumber: firstOf(fields, "whatsapp_number", "whatsapp") ?? phone,
    location: firstOf(fields, "location", "city"),
    countryOfResidence: firstOf(fields, "country", "country_of_residence"),
    propertyName: firstOf(fields, "property", "property_interest"),
    preferredLocation: firstOf(fields, "preferred_location", "property_location"),
    budgetMin,
    budgetMax,
    investmentType: parseInvestment(investmentLabel),
    preferredContactMethod: firstOf(fields, "preferred_contact_method", "contact_method"),
    expectedTimeline: firstOf(fields, "expected_investment_timeline", "timeline"),
    consentGiven: true,
    capturedAt: payload.created_time ?? new Date().toISOString(),
    rawPayload: payload,
    facebook: {
      leadId: context.leadgenId,
      pageId: context.pageId,
      campaignId: payload.campaign_id,
      campaignName: payload.campaign_name,
      adsetId: payload.adset_id,
      adsetName: payload.adset_name,
      adId: payload.ad_id ?? context.adId,
      adName: payload.ad_name,
      formId: payload.form_id ?? context.formId,
    },
    interestMetadata: {
      campaign_name: payload.campaign_name ?? null,
      adset_name: payload.adset_name ?? null,
      ad_name: payload.ad_name ?? null,
      form_id: payload.form_id ?? context.formId ?? null,
    },
    acknowledgement: { investmentLabel },
  };
}
