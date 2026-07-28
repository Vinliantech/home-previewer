import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// Public (SSR) client
function publicClient(): any {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// ============= PUBLIC =============

export const listPublicPropertyCatalogue = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  // is_public must be filtered here, not in the browser. RLS on
  // tokenized_properties is USING (true), so anything selected is served to
  // anonymous visitors — an unlisted project was previously hidden only by
  // mergeCatalogueProperties dropping it after it had already been sent.
  const { data, error } = await sb
    .from("tokenized_properties")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return { properties: data ?? [] };
});

export const getPublicCatalogueProperty = createServerFn({ method: "GET" })
  .validator((input) => z.object({ slug: z.string().min(1).max(180) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Same reason as the catalogue: an unlisted project with a slug must not
    // be fetchable by guessing or reusing that slug.
    const { data: property, error } = await sb
      .from("tokenized_properties")
      .select("*")
      .eq("public_slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { property: property ?? null };
  });

export const listOpenProperties = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("tokenized_properties")
    .select("*")
    .in("status", [
      "open",
      "partially_funded",
      "fully_funded",
      "under_review",
      "approved",
      "acquisition_in_progress",
    ])
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((property) => property.id);
  const funding: Record<string, { approved: number; pending: number; investors: number }> = {};
  for (const property of data ?? []) {
    funding[property.id] = { approved: 0, pending: 0, investors: 0 };
  }
  if (ids.length) {
    const { data: rows, error: fundingError } = await sb.rpc("get_public_property_funding", {
      _property_ids: ids,
    });
    // Funding totals are enrichment; if the RPC is unavailable (e.g. migration
    // not yet applied), fall back to zeroed totals instead of failing the page.
    if (fundingError) {
      console.error("[invest] funding RPC failed:", fundingError.message);
      return { properties: data ?? [], funding };
    }
    for (const row of rows ?? []) {
      funding[row.property_id] = {
        approved: Number(row.approved ?? 0),
        pending: Number(row.pending ?? 0),
        investors: Number(row.investors ?? 0),
      };
    }
  }
  return { properties: data ?? [], funding };
});

export const getPropertyDetail = createServerFn({ method: "GET" })
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: prop, error: propertyError } = await sb
      .from("tokenized_properties")
      .select("*, spvs(name)")
      .eq("id", data.id)
      .eq("is_public", true)
      .maybeSingle();
    if (propertyError) throw new Error(propertyError.message);
    if (!prop) throw new Error("Property not found");
    const { data: docs, error: documentError } = await sb
      .from("property_documents")
      .select("*")
      .eq("property_id", data.id)
      .eq("is_public", true);
    if (documentError) throw new Error(documentError.message);
    const { data: rows, error: fundingError } = await sb.rpc("get_public_property_funding", {
      _property_ids: [data.id],
    });
    if (fundingError) throw new Error(fundingError.message);
    const row = rows?.[0];
    return {
      property: prop,
      documents: docs ?? [],
      funding: {
        approved: Number(row?.approved ?? 0),
        pending: Number(row?.pending ?? 0),
        investors: Number(row?.investors ?? 0),
      },
    };
  });

export const verifyCertificate = createServerFn({ method: "GET" })
  .validator((i) => z.object({ token: z.string().min(4) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb.rpc("verify_investment_certificate", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) return { valid: false as const };
    return {
      valid: true as const,
      certificate: {
        certificate_number: row.certificate_number,
        issued_at: row.issued_at,
      },
      investment: {
        ownership_pct: row.ownership_pct,
        tokens_count: row.tokens_count,
        approved_amount: row.approved_amount,
        tokenized_properties: {
          name: row.property_name,
          location: row.property_location,
        },
      },
    };
  });

// ============= INVESTOR =============

export const getMyKyc = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("investor_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { kyc: data ?? null };
  });

export const submitKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        full_name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(6),
        address: z.string().min(3),
        country: z.string().min(2),
        nationality: z.string().min(2),
        dob: z.string().min(1),
        id_type: z.string().min(2),
        id_number: z.string().min(3),
        id_doc_url: z.string().min(3),
        photo_url: z.string().min(3),
        next_of_kin: z
          .object({ name: z.string(), phone: z.string(), relationship: z.string() })
          .partial()
          .optional(),
        bank_details: z
          .object({ bank_name: z.string(), account_name: z.string(), account_number: z.string() })
          .partial()
          .optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("submit_investor_kyc", {
      _profile: data,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        property_id: z.string().uuid(),
        proposed_amount: z.number().positive(),
        agreement_accepted: z.literal(true),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    // KYC required
    const { data: kyc } = await context.supabase
      .from("investor_profiles")
      .select("kyc_status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!kyc || kyc.kyc_status !== "verified")
      throw new Error("KYC verification required before investing.");
    const { data: prop } = await context.supabase
      .from("tokenized_properties")
      .select("*")
      .eq("id", data.property_id)
      .maybeSingle();
    if (!prop) throw new Error("Property not found");
    if (!["open", "partially_funded"].includes(prop.status))
      throw new Error("This property is not open for investment.");
    if (
      prop.funding_deadline &&
      new Date(prop.funding_deadline) < new Date(new Date().toISOString().slice(0, 10))
    ) {
      throw new Error("The funding deadline has passed.");
    }
    if (data.proposed_amount < Number(prop.min_investment))
      throw new Error(`Minimum investment is ${prop.min_investment}`);
    if (prop.max_investment && data.proposed_amount > Number(prop.max_investment)) {
      throw new Error(`Maximum investment is ${prop.max_investment}`);
    }
    if (data.proposed_amount % Number(prop.token_value) !== 0) {
      throw new Error(`Contribution must be in multiples of ${prop.token_value}`);
    }
    const { data: ins, error } = await context.supabase
      .from("investments")
      .insert({
        investor_id: context.userId,
        property_id: data.property_id,
        proposed_amount: data.proposed_amount,
        agreement_accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const uploadPaymentEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        investment_id: z.string().uuid(),
        evidence_url: z.string().min(3),
        reference: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("submit_investment_payment_evidence", {
      _investment_id: data.investment_id,
      _evidence_url: data.evidence_url,
      _reference: data.reference ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: investments } = await context.supabase
      .from("investments")
      .select(
        "*, tokenized_properties(name, location, images, current_value, initial_value, status)",
      )
      .eq("investor_id", context.userId)
      .order("created_at", { ascending: false });
    const { data: tokens } = await context.supabase
      .from("property_tokens")
      .select("*")
      .eq("investor_id", context.userId);
    const { data: payouts } = await context.supabase
      .from("rental_payouts")
      .select("*, tokenized_properties(name)")
      .eq("investor_id", context.userId)
      .order("created_at", { ascending: false });
    const { data: wallet } = await context.supabase
      .from("investor_wallets")
      .select("*")
      .eq("investor_id", context.userId)
      .maybeSingle();
    return {
      investments: investments ?? [],
      tokens: tokens ?? [],
      payouts: payouts ?? [],
      wallet: wallet ?? null,
    };
  });

export const getMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("wallet_transactions")
      .select("*, tokenized_properties(name)")
      .eq("investor_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    return { transactions: data ?? [] };
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        amount: z.number().positive(),
        bank_details: z.object({
          bank_name: z.string().min(2),
          account_name: z.string().min(2),
          account_number: z.string().min(6),
        }),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: wal } = await context.supabase
      .from("investor_wallets")
      .select("available_balance")
      .eq("investor_id", context.userId)
      .maybeSingle();
    if (!wal || Number(wal.available_balance) < data.amount)
      throw new Error("Insufficient available balance.");
    const { error } = await context.supabase.from("withdrawal_requests").insert({
      investor_id: context.userId,
      amount: data.amount,
      bank_details: data.bank_details ?? {},
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const requestExit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        property_id: z.string().uuid(),
        tokens_to_sell: z.number().int().positive(),
        asking_price: z.number().positive(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("request_property_token_exit", {
      _property_id: data.property_id,
      _tokens_to_sell: data.tokens_to_sell,
      _asking_price: data.asking_price,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: certs } = await context.supabase
      .from("investment_certificates")
      .select(
        "*, investments!inner(investor_id, ownership_pct, tokens_count, approved_amount, tokenized_properties(name, location))",
      )
      .eq("investments.investor_id", context.userId);
    return { certificates: certs ?? [] };
  });

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("investor_notifications")
      .select("*")
      .eq("investor_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { notifications: data ?? [] };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("investor_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("investor_id", context.userId);
    return { ok: true };
  });

// ============= ADMIN =============

type AuthenticatedContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

async function ensureAdmin(context: AuthenticatedContext) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Forbidden");
}

async function getInvestorSummaries(context: AuthenticatedContext, investorIds: string[]) {
  const uniqueIds = [...new Set(investorIds)];
  if (!uniqueIds.length) return new Map();

  const { data, error } = await context.supabase
    .from("investor_profiles")
    .select("user_id, full_name, email, phone, kyc_status")
    .in("user_id", uniqueIds);
  if (error) throw new Error(error.message);

  return new Map((data ?? []).map((profile) => [profile.user_id, profile]));
}

export const adminListKyc = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("investor_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { kyc: data ?? [] };
  });

export const adminReviewKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["verified", "rejected", "more_info", "pending"]),
        notes: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_review_investor_kyc", {
      _profile_id: data.id,
      _status: data.status,
      _notes: data.notes ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const adminPropertyInput = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  description: z.string().optional(),
  property_type: z.string().optional(),
  images: z.array(z.string()).optional(),
  initial_value: z.number().positive(),
  min_investors: z.number().int().min(1),
  max_investors: z.number().int().optional(),
  min_investment: z.number().positive(),
  max_investment: z.number().optional(),
  token_value: z.number().positive(),
  funding_deadline: z.string().optional(),
  expected_rental_yield: z.number().optional(),
  expected_appreciation: z.number().optional(),
  legal_title: z.string().optional(),
  management_fee_pct: z.number().optional(),
  exit_terms: z.string().optional(),
  risk_disclosure: z.string().optional(),
  spv_id: z.string().uuid().optional(),
  status: z
    .enum([
      "open",
      "partially_funded",
      "fully_funded",
      "under_review",
      "approved",
      "acquisition_in_progress",
      "acquired",
      "income_generating",
      "available_for_resale",
      "sold",
      "closed",
    ])
    .default("open"),
  public_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  public_tag: z.string().optional(),
  tagline: z.string().optional(),
  price_label: z.string().optional(),
  price_note: z.string().optional(),
  highlight: z.string().optional(),
  features: z.array(z.string()).optional(),
  overview: z.array(z.string()).optional(),
  public_units: z
    .array(z.object({ label: z.string().min(1), price: z.string().optional().default("") }))
    .optional(),
  public_property_types: z.array(z.string()).optional(),
  investment_models: z.array(
    z.enum(["full_purchase", "group_purchase", "fractional", "spv", "tokenized"]),
  ),
  public_funding_status: z.enum([
    "available",
    "selling",
    "funding_open",
    "fully_funded",
    "coming_soon",
  ]),
  is_public: z.boolean(),
  show_on_home: z.boolean(),
  home_order: z.number().int().min(0),
});

export const adminCreateProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => adminPropertyInput.parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const payload = { ...data, current_value: data.initial_value, created_by: context.userId };
    const { error, data: ins } = await context.supabase
      .from("tokenized_properties")
      .insert(payload as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const adminUpdateProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => adminPropertyInput.extend({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { id, ...payload } = data;
    const { error } = await context.supabase
      .from("tokenized_properties")
      .update(payload as any)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  });

export const adminListProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("tokenized_properties")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { properties: data ?? [] };
  });

export const adminListInvestments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("investments")
      .select("*, tokenized_properties(name, location, initial_value, current_value, token_value)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const profiles = await getInvestorSummaries(
      context,
      (data ?? []).map((investment) => investment.investor_id),
    );
    return {
      investments: (data ?? []).map((investment) => ({
        ...investment,
        investor_profile: profiles.get(investment.investor_id) ?? null,
      })),
    };
  });

export const adminApproveInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        approved_amount: z.number().positive(),
        notes: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_approve_investment", {
      _investment_id: data.id,
      _approved_amount: data.approved_amount,
      _notes: data.notes ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRejectInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid(), notes: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_reject_investment", {
      _investment_id: data.id,
      _notes: data.notes ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRecordValuation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        property_id: z.string().uuid(),
        new_value: z.number().positive(),
        valuation_date: z.string(),
        valuer: z.string().optional(),
        report_url: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: change, error } = await context.supabase.rpc("admin_record_property_valuation", {
      _property_id: data.property_id,
      _new_value: data.new_value,
      _valuation_date: data.valuation_date,
      _valuer: data.valuer ?? "",
      _report_url: data.report_url ?? "",
      _notes: data.notes ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true, change: Number(change ?? 0) };
  });

export const adminRecordRentalIncome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        property_id: z.string().uuid(),
        gross_income: z.number().nonnegative(),
        mgmt_fee: z.number().nonnegative().default(0),
        maintenance: z.number().nonnegative().default(0),
        taxes: z.number().nonnegative().default(0),
        other_expenses: z.number().nonnegative().default(0),
        distribution_date: z.string(),
        notes: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const net =
      data.gross_income - data.mgmt_fee - data.maintenance - data.taxes - data.other_expenses;
    if (net <= 0) throw new Error("Net distributable must be positive.");
    const { error } = await context.supabase.rpc("admin_record_rental_distribution", {
      _property_id: data.property_id,
      _gross_income: data.gross_income,
      _management_fee: data.mgmt_fee,
      _maintenance: data.maintenance,
      _taxes: data.taxes,
      _other_expenses: data.other_expenses,
      _distribution_date: data.distribution_date,
      _notes: data.notes ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true, net };
  });

export const adminMarkPayoutPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid(), reference: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_mark_rental_payout_paid", {
      _payout_id: data.id,
      _reference: data.reference ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListRentalPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("rental_payouts")
      .select("*, tokenized_properties(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const profiles = await getInvestorSummaries(
      context,
      (data ?? []).map((payout) => payout.investor_id),
    );
    return {
      payouts: (data ?? []).map((payout) => ({
        ...payout,
        investor_profile: profiles.get(payout.investor_id) ?? null,
      })),
    };
  });

export const adminListWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const profiles = await getInvestorSummaries(
      context,
      (data ?? []).map((withdrawal) => withdrawal.investor_id),
    );
    return {
      withdrawals: (data ?? []).map((withdrawal) => ({
        ...withdrawal,
        investor_profile: profiles.get(withdrawal.investor_id) ?? null,
      })),
    };
  });

export const adminApproveWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) => z.object({ id: z.string().uuid(), reference: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_approve_withdrawal", {
      _withdrawal_id: data.id,
      _reference: data.reference ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRejectWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid(),
        notes: z.string().trim().min(3),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_reject_withdrawal", {
      _withdrawal_id: data.id,
      _notes: data.notes,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListExits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("exit_requests")
      .select("*, tokenized_properties(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const profiles = await getInvestorSummaries(
      context,
      (data ?? []).map((exitRequest) => exitRequest.investor_id),
    );
    return {
      exits: (data ?? []).map((exitRequest) => ({
        ...exitRequest,
        investor_profile: profiles.get(exitRequest.investor_id) ?? null,
      })),
    };
  });

export const adminUpdateExit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "submitted",
          "under_review",
          "approved_for_listing",
          "buyer_found",
          "payment_pending",
          "transfer_in_progress",
          "completed",
          "rejected",
          "cancelled",
        ]),
        notes: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase.rpc("admin_update_exit_request", {
      _exit_id: data.id,
      _status: data.status,
      _notes: data.notes ?? "",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const [{ count: propCount }, { count: invCount }, { count: pendKyc }, { count: pendInv }] =
      await Promise.all([
        context.supabase.from("tokenized_properties").select("*", { count: "exact", head: true }),
        context.supabase.from("investor_profiles").select("*", { count: "exact", head: true }),
        context.supabase
          .from("investor_profiles")
          .select("*", { count: "exact", head: true })
          .eq("kyc_status", "pending"),
        context.supabase
          .from("investments")
          .select("*", { count: "exact", head: true })
          .in("status", ["submitted", "payment_pending", "payment_received", "under_review"]),
      ]);
    const { data: sumApproved } = await context.supabase
      .from("investments")
      .select("approved_amount")
      .eq("status", "approved");
    const totalApproved = (sumApproved ?? []).reduce(
      (sum, investment) => sum + Number(investment.approved_amount ?? 0),
      0,
    );
    const { data: rentals } = await context.supabase
      .from("rental_distributions")
      .select("net_distributable");
    const totalRental = (rentals ?? []).reduce(
      (sum, rental) => sum + Number(rental.net_distributable ?? 0),
      0,
    );
    return {
      propCount,
      investorCount: invCount,
      pendingKyc: pendKyc,
      pendingInvestments: pendInv,
      totalApproved,
      totalRental,
    };
  });
