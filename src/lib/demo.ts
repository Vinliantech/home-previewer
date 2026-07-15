import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PoolDetailResult, PoolListResult } from "@/lib/pools";
import rubysImg from "@/assets/rubys-apartment.jpg";
import terraceImg from "@/assets/lillycrest-terrace.jpg";
import plotsImg from "@/assets/estate-plots.jpg";

/**
 * Demo access for the client dashboard.
 *
 * Lets a reviewer open the portal with sample data and no real account.
 * All data is mock and lives only in the browser's query cache; server
 * functions still require real authentication, so nothing sensitive is
 * exposed. Set DEMO_ENABLED to false to switch the whole feature off.
 */
export const DEMO_ENABLED = true;
export const DEMO_PASSWORD = "KaySteph2026";
export const DEMO_EMAIL = "demo@kaystephgroup.com";
export const DEMO_NAME = "Demo Client";

/** Which portal a demo session was opened for. */
export type DemoRole = "client" | "affiliate" | "admin";

const DEMO_FLAG = "ks-demo-session";

export function getDemoRole(): DemoRole | null {
  if (!DEMO_ENABLED || typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(DEMO_FLAG);
  if (value === "affiliate" || value === "admin") return value;
  if (value === "client" || value === "1") return "client";
  return null;
}

export function isDemoActive(): boolean {
  return getDemoRole() !== null;
}

export function enableDemo(role: DemoRole = "client") {
  window.sessionStorage.setItem(DEMO_FLAG, role);
}

export function disableDemo() {
  window.sessionStorage.removeItem(DEMO_FLAG);
}

/**
 * Returns true (and tells the user why) when a write action should be
 * skipped because the session is a demo. Call at the top of mutations:
 * `if (blockInDemo()) return;`
 */
export function blockInDemo(): boolean {
  if (!isDemoActive()) return false;
  toast.info("Demo mode — this action is disabled. Sign in with a real account to use it.");
  return true;
}

/* ------------------------------------------------------------------ */
/* Sample dataset                                                      */
/* ------------------------------------------------------------------ */

const P1 = "demo-prop-rubys";
const P2 = "demo-prop-terrace";
const P3 = "demo-prop-plots";

const rubys = {
  id: P1,
  name: "Ruby's Apartment",
  location: "Jahi, Abuja",
  images: [rubysImg],
  status: "income_generating",
  initial_value: 140_000_000,
  current_value: 154_000_000,
  min_investment: 5_000_000,
  expected_rental_yield: 6,
  expected_appreciation: 9,
};

const terrace = {
  id: P2,
  name: "Lillycrest Terrace",
  location: "Life Camp, Abuja",
  images: [terraceImg],
  status: "acquired",
  initial_value: 250_000_000,
  current_value: 262_500_000,
  min_investment: 10_000_000,
  expected_rental_yield: 5,
  expected_appreciation: 11,
};

const plots = {
  id: P3,
  name: "Estate Plots — Phase II",
  location: "Behind Abacha Barracks, Abuja",
  images: [plotsImg],
  status: "open",
  initial_value: 180_000_000,
  current_value: 180_000_000,
  min_investment: 2_000_000,
  expected_rental_yield: 0,
  expected_appreciation: 14,
};

function monthsAgo(n: number, day = 15): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d.toISOString();
}

const investments = [
  {
    id: "demo-inv-1",
    property_id: P1,
    investor_id: "demo-user",
    status: "approved",
    proposed_amount: 14_000_000,
    approved_amount: 14_000_000,
    ownership_pct: 10,
    tokens_count: 14,
    certificate_number: "KS-CERT-2026-0142",
    created_at: monthsAgo(8),
    tokenized_properties: rubys,
  },
  {
    id: "demo-inv-2",
    property_id: P2,
    investor_id: "demo-user",
    status: "approved",
    proposed_amount: 12_500_000,
    approved_amount: 12_500_000,
    ownership_pct: 5,
    tokens_count: 12,
    certificate_number: "KS-CERT-2026-0217",
    created_at: monthsAgo(5),
    tokenized_properties: terrace,
  },
  {
    id: "demo-inv-3",
    property_id: P3,
    investor_id: "demo-user",
    status: "submitted",
    proposed_amount: 4_000_000,
    approved_amount: null,
    ownership_pct: 0,
    tokens_count: 0,
    certificate_number: null,
    created_at: monthsAgo(0, 2),
    tokenized_properties: plots,
  },
];

const payouts = [0, 1, 2, 3, 4, 5].map((n) => ({
  id: `demo-payout-${n}`,
  property_id: P1,
  amount: 205_000 + (n % 3) * 15_000,
  status: n === 0 ? "pending" : "paid",
  ownership_pct_snapshot: 10,
  paid_at: n === 0 ? null : monthsAgo(n, 28),
  created_at: monthsAgo(n, 25),
  tokenized_properties: { name: rubys.name },
}));

const transactions = [
  {
    id: "demo-tx-1",
    created_at: monthsAgo(8, 4),
    type: "contribution",
    amount: -14_000_000,
    reference: "KS-A1B2C3D4",
    tokenized_properties: { name: rubys.name },
  },
  {
    id: "demo-tx-2",
    created_at: monthsAgo(5, 9),
    type: "contribution",
    amount: -12_500_000,
    reference: "KS-E5F6G7H8",
    tokenized_properties: { name: terrace.name },
  },
  ...payouts
    .filter((p) => p.status === "paid")
    .map((p, i) => ({
      id: `demo-tx-po-${i}`,
      created_at: p.paid_at as string,
      type: "rental_distribution",
      amount: p.amount,
      reference: `payout-${i + 1}0f3a2`,
      tokenized_properties: { name: rubys.name },
    })),
  {
    id: "demo-tx-wd",
    created_at: monthsAgo(2, 6),
    type: "withdrawal",
    amount: -350_000,
    reference: "WD-93K2L1",
    tokenized_properties: null,
  },
];

export const demoData = {
  portfolio: {
    investments,
    tokens: [
      {
        id: "demo-tok-1",
        property_id: P1,
        tokens_count: 14,
        unit_value: 1_000_000,
        status: "active",
      },
      {
        id: "demo-tok-2",
        property_id: P2,
        tokens_count: 12,
        unit_value: 1_041_667,
        status: "active",
      },
    ],
    payouts,
    wallet: { available_balance: 745_000, total_returns: 1_095_000, total_withdrawn: 350_000 },
  },
  transactions: { transactions },
  certificates: {
    certificates: investments
      .filter((i) => i.certificate_number)
      .map((i, n) => ({
        id: `demo-cert-${n}`,
        certificate_number: i.certificate_number,
        issued_at: i.created_at,
        qr_token: `demo-token-${n}`,
        investments: {
          approved_amount: i.approved_amount,
          ownership_pct: i.ownership_pct,
          tokens_count: i.tokens_count,
          tokenized_properties: {
            name: i.tokenized_properties.name,
            location: i.tokenized_properties.location,
          },
        },
      })),
  },
  notifications: {
    notifications: [
      {
        id: "demo-n-1",
        title: "Rental distribution pending",
        body: "A rental distribution of ₦205,000 for Ruby's Apartment is being processed.",
        created_at: monthsAgo(0, 25),
        read_at: null,
      },
      {
        id: "demo-n-2",
        title: "Quarterly valuation updated",
        body: "Ruby's Apartment was revalued to ₦154,000,000 (+10% since acquisition).",
        created_at: monthsAgo(1, 12),
        read_at: null,
      },
      {
        id: "demo-n-3",
        title: "Certificate issued",
        body: "Your certificate KS-CERT-2026-0217 for Lillycrest Terrace is ready to download.",
        created_at: monthsAgo(5, 10),
        read_at: monthsAgo(5, 11),
      },
    ],
  },
  kyc: {
    kyc: {
      kyc_status: "verified",
      full_name: DEMO_NAME,
      email: DEMO_EMAIL,
      phone: "0816 000 0000",
      address: "12 Sample Street, Wuse II",
      country: "Nigeria",
      nationality: "Nigerian",
      dob: "1990-01-01",
      id_type: "National ID (NIN)",
      id_number: "12345678901",
      next_of_kin: { name: "Ada Demo", phone: "0816 000 0001", relationship: "Sibling" },
      bank_details: {
        bank_name: "GTBank",
        account_name: DEMO_NAME,
        account_number: "0123456789",
      },
      kyc_notes: null,
      id_doc_url: "demo/on-file",
      photo_url: "demo/on-file",
    },
  },
  investList: {
    properties: [plots, { ...rubys, status: "partially_funded" }],
    funding: {
      [P3]: { approved: 68_400_000, pending: 6_000_000, investors: 19 },
      [P1]: { approved: 126_000_000, pending: 4_000_000, investors: 11 },
    },
  },
  exits: [
    {
      id: "demo-exit-1",
      status: "under_review",
      tokens_to_sell: 3,
      asking_price: 3_450_000,
      created_at: monthsAgo(0, 5),
      admin_notes: null,
      tokenized_properties: { name: terrace.name },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Affiliate portal sample data                                        */
/* ------------------------------------------------------------------ */

export const DEMO_AFFILIATE_NAME = "Demo Affiliate";
const AFF_ID = "demo-aff-1";

export const demoAffiliate = {
  profile: {
    id: AFF_ID,
    user_id: "demo-user",
    affiliate_code: "KS-DEMO24",
    member_number: 24,
    full_name: DEMO_AFFILIATE_NAME,
    email: "affiliate.demo@kaystephgroup.com",
    phone: "0803 000 0000",
    avatar_url: null,
    bank_name: "GTBank",
    account_name: DEMO_AFFILIATE_NAME,
    account_number: "0123456789",
    sort_code: null,
    commission_rate: 5,
    status: "active",
  },
  properties: [
    {
      id: "demo-ap-1",
      property_name: "Guzape Dream Homes",
      location: "Guzape, Abuja",
      is_active: true,
    },
    {
      id: "demo-ap-2",
      property_name: "Ruby's Apartment",
      location: "Jahi, Abuja",
      is_active: true,
    },
    {
      id: "demo-ap-3",
      property_name: "Lillycrest Terrace",
      location: "Life Camp, Abuja",
      is_active: true,
    },
    {
      id: "demo-ap-4",
      property_name: "Estate Plots — Phase II",
      location: "Behind Abacha Barracks, Abuja",
      is_active: true,
    },
  ],
  leads: [
    {
      id: "demo-ld-1",
      affiliate_id: AFF_ID,
      client_full_name: "Chinedu Okeke",
      client_email: "chinedu@example.com",
      client_phone: "0805 111 2233",
      property_of_interest: "Ruby's Apartment",
      status: "closed",
      submission_date: monthsAgo(3, 4),
    },
    {
      id: "demo-ld-2",
      affiliate_id: AFF_ID,
      client_full_name: "Amina Bello",
      client_email: "amina@example.com",
      client_phone: "0803 222 3344",
      property_of_interest: "Guzape Dream Homes",
      status: "contacted",
      submission_date: monthsAgo(1, 18),
    },
    {
      id: "demo-ld-3",
      affiliate_id: AFF_ID,
      client_full_name: "Tunde Ajayi",
      client_email: "tunde@example.com",
      client_phone: "0807 333 4455",
      property_of_interest: "Estate Plots — Phase II",
      status: "pending",
      submission_date: monthsAgo(0, 6),
    },
  ],
  commissions: [
    {
      id: "demo-cm-1",
      affiliate_id: AFF_ID,
      sale_amount: 140_000_000,
      commission_rate: 5,
      commission_amount: 7_000_000,
      sale_date: monthsAgo(3, 10),
      status: "paid",
      created_at: monthsAgo(3, 10),
    },
    {
      id: "demo-cm-2",
      affiliate_id: AFF_ID,
      sale_amount: 32_500_000,
      commission_rate: 5,
      commission_amount: 1_625_000,
      sale_date: monthsAgo(0, 8),
      status: "pending",
      created_at: monthsAgo(0, 8),
    },
  ],
  payouts: [
    {
      id: "demo-po-1",
      affiliate_id: AFF_ID,
      requested_amount: 7_000_000,
      status: "completed",
      requested_at: monthsAgo(2, 20),
      processed_at: monthsAgo(2, 24),
    },
    {
      id: "demo-po-2",
      affiliate_id: AFF_ID,
      requested_amount: 800_000,
      status: "pending",
      requested_at: monthsAgo(0, 3),
      processed_at: null,
    },
  ],
  earnings: { total_earned: 8_625_000, pending_payout: 1_625_000 },
  leaderboard: [
    {
      id: "demo-lb-1",
      affiliate_id: "demo-aff-9",
      full_name: "Ngozi E.",
      member_number: 7,
      rank: 1,
      successful_sales: 6,
      total_earned: 21_400_000,
      total_sales_amount: 428_000_000,
    },
    {
      id: "demo-lb-2",
      affiliate_id: "demo-aff-8",
      full_name: "Ibrahim S.",
      member_number: 11,
      rank: 2,
      successful_sales: 4,
      total_earned: 13_050_000,
      total_sales_amount: 261_000_000,
    },
    {
      id: "demo-lb-3",
      affiliate_id: AFF_ID,
      full_name: DEMO_AFFILIATE_NAME,
      member_number: 24,
      rank: 3,
      successful_sales: 2,
      total_earned: 8_625_000,
      total_sales_amount: 172_500_000,
    },
  ],
  videos: [] as unknown[],
};

/* ------------------------------------------------------------------ */
/* Super-admin dashboard sample data                                   */
/* ------------------------------------------------------------------ */

const affJoin = { full_name: DEMO_AFFILIATE_NAME, affiliate_code: "KS-DEMO24" };

export const demoAdmin = {
  summary: {
    total_affiliates: 24,
    pending_affiliates: 3,
    total_leads: 57,
    pending_commissions_count: 2,
    pending_commissions_amount: 2_425_000,
    pending_payouts_count: 1,
    pending_payouts_amount: 800_000,
  },
  affiliates: [
    demoAffiliate.profile,
    {
      ...demoAffiliate.profile,
      id: "demo-aff-8",
      user_id: "demo-user-8",
      affiliate_code: "KS-DEMO11",
      member_number: 11,
      full_name: "Ibrahim S.",
      email: "ibrahim.demo@example.com",
      commission_rate: 5,
      status: "active",
    },
    {
      ...demoAffiliate.profile,
      id: "demo-aff-7",
      user_id: "demo-user-7",
      affiliate_code: "KS-DEMO31",
      member_number: null,
      full_name: "Blessing A.",
      email: "blessing.demo@example.com",
      commission_rate: 4,
      status: "pending",
    },
  ],
  leads: demoAffiliate.leads.map((lead) => ({ ...lead, affiliate_profiles: affJoin })),
  commissions: demoAffiliate.commissions.map((commission) => ({
    ...commission,
    affiliate_profiles: affJoin,
  })),
  payouts: demoAffiliate.payouts.map((payout) => ({
    ...payout,
    affiliate_profiles: {
      ...affJoin,
      bank_name: "GTBank",
      account_name: DEMO_AFFILIATE_NAME,
      account_number: "0123456789",
    },
  })),
  videos: [] as unknown[],
  clients: [
    {
      id: "demo-cl-1",
      full_name: DEMO_NAME,
      email: DEMO_EMAIL,
      phone: "0816 000 0000",
      id_verification_status: "approved",
      created_at: monthsAgo(8, 2),
    },
    {
      id: "demo-cl-2",
      full_name: "Ada Nwosu",
      email: "ada.demo@example.com",
      phone: "0802 555 6677",
      id_verification_status: "pending",
      created_at: monthsAgo(1, 14),
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Group Buy pool engine (Phase 2) sample data                         */
/* ------------------------------------------------------------------ */

const POOL_A = "demo-pool-a";
const POOL_B = "demo-pool-b";

const poolA = {
  id: POOL_A,
  name: "Guzape Dream Homes Syndicate",
  property_id: null,
  property_name: "Guzape Dream Homes — Guzape, Abuja",
  created_by: "demo-user",
  visibility: "private" as const,
  target_amount: 240_000_000,
  min_contribution: 20_000_000,
  member_cap: 8,
  closing_date: monthsAgo(-2, 15).slice(0, 10),
  status: "open" as const,
  description:
    "A private syndicate of family and close friends targeting a Guzape Dream Homes unit.",
  admin_notes: null,
  created_at: monthsAgo(1, 8),
  updated_at: monthsAgo(0, 2),
};

const poolB = {
  id: POOL_B,
  name: "Jahi Apartments Open Pool",
  property_id: null,
  property_name: "Ruby's Apartment — Jahi, Abuja",
  created_by: "demo-user-8",
  visibility: "open" as const,
  target_amount: 140_000_000,
  min_contribution: 10_000_000,
  member_cap: 10,
  closing_date: monthsAgo(-1, 20).slice(0, 10),
  status: "open" as const,
  description: "An open pool for verified investors to co-acquire a Jahi serviced apartment.",
  admin_notes: null,
  created_at: monthsAgo(0, 12),
  updated_at: monthsAgo(0, 1),
};

const poolAMembers = [
  {
    id: "demo-pm-a1",
    pool_id: POOL_A,
    user_id: "demo-user",
    invited_email: null,
    committed_amount: 30_000_000,
    status: "approved" as const,
    is_founder: true,
    joined_at: monthsAgo(1, 8),
    created_at: monthsAgo(1, 8),
    display_name: DEMO_NAME,
  },
  {
    id: "demo-pm-a2",
    pool_id: POOL_A,
    user_id: "demo-u2",
    invited_email: null,
    committed_amount: 30_000_000,
    status: "approved" as const,
    is_founder: false,
    joined_at: monthsAgo(1, 12),
    created_at: monthsAgo(1, 12),
    display_name: "Chidi O.",
  },
  {
    id: "demo-pm-a3",
    pool_id: POOL_A,
    user_id: "demo-u3",
    invited_email: null,
    committed_amount: 25_000_000,
    status: "committed" as const,
    is_founder: false,
    joined_at: monthsAgo(0, 20),
    created_at: monthsAgo(0, 20),
    display_name: "Ngozi E.",
  },
  {
    id: "demo-pm-a4",
    pool_id: POOL_A,
    user_id: "demo-u4",
    invited_email: null,
    committed_amount: 15_400_000,
    status: "committed" as const,
    is_founder: false,
    joined_at: monthsAgo(0, 10),
    created_at: monthsAgo(0, 10),
    display_name: "Bola A.",
  },
  {
    id: "demo-pm-a5",
    pool_id: POOL_A,
    user_id: null,
    invited_email: "cousin@example.com",
    committed_amount: 10_000_000,
    status: "invited" as const,
    is_founder: false,
    joined_at: null,
    created_at: monthsAgo(0, 4),
    display_name: null,
  },
];

const poolBMembers = [
  {
    id: "demo-pm-b1",
    pool_id: POOL_B,
    user_id: "demo-user-8",
    invited_email: null,
    committed_amount: 20_000_000,
    status: "approved" as const,
    is_founder: true,
    joined_at: monthsAgo(0, 12),
    created_at: monthsAgo(0, 12),
    display_name: "Ibrahim S.",
  },
  {
    id: "demo-pm-b2",
    pool_id: POOL_B,
    user_id: "demo-u6",
    invited_email: null,
    committed_amount: 15_000_000,
    status: "committed" as const,
    is_founder: false,
    joined_at: monthsAgo(0, 9),
    created_at: monthsAgo(0, 9),
    display_name: "Amara N.",
  },
  {
    id: "demo-pm-b3",
    pool_id: POOL_B,
    user_id: "demo-u7",
    invited_email: null,
    committed_amount: 12_000_000,
    status: "pending" as const,
    is_founder: false,
    joined_at: monthsAgo(0, 5),
    created_at: monthsAgo(0, 5),
    display_name: "Tunde K.",
  },
];

const poolASummary = {
  pool_id: POOL_A,
  committed: 110_400_000,
  approved: 60_000_000,
  members: 5,
  approved_members: 2,
};
const poolBSummary = {
  pool_id: POOL_B,
  committed: 47_000_000,
  approved: 20_000_000,
  members: 3,
  approved_members: 1,
};

export const demoPools: {
  mine: PoolListResult;
  open: PoolListResult;
  detail: Record<string, PoolDetailResult>;
} = {
  mine: {
    pools: [
      { ...poolA, summary: poolASummary, my_membership: { is_founder: true, status: "approved" } },
    ],
  },
  open: {
    pools: [{ ...poolB, summary: poolBSummary }],
  },
  detail: {
    [POOL_A]: {
      pool: poolA,
      members: poolAMembers,
      summary: poolASummary,
      is_founder: true,
      i_am_member: true,
    },
    [POOL_B]: {
      pool: poolB,
      members: poolBMembers,
      summary: poolBSummary,
      is_founder: false,
      i_am_member: false,
    },
    __first: {
      pool: poolA,
      members: poolAMembers,
      summary: poolASummary,
      is_founder: true,
      i_am_member: true,
    },
  },
};

/** Sample pools shown in the admin dashboard's Pools tab. */
export const demoAdminPools = {
  pools: [
    { ...poolA, summary: poolASummary },
    { ...poolB, summary: poolBSummary },
    {
      id: "demo-pool-c",
      name: "Karsana Family Homes Pool",
      property_id: null,
      property_name: "Lillycrest Residence — Karsana, Abuja",
      created_by: "demo-user-9",
      visibility: "private" as const,
      target_amount: 180_000_000,
      min_contribution: 15_000_000,
      member_cap: 6,
      closing_date: monthsAgo(-3, 1).slice(0, 10),
      status: "pending_approval" as const,
      description: "Awaiting Kay-Steph approval.",
      admin_notes: null,
      created_at: monthsAgo(0, 2),
      updated_at: monthsAgo(0, 2),
      summary: {
        pool_id: "demo-pool-c",
        committed: 45_000_000,
        approved: 0,
        members: 3,
        approved_members: 0,
      },
    },
  ],
};

const seededClients = new WeakSet<QueryClient>();

/** Pre-seed every dashboard query with fresh sample data so no server call runs. */
export function seedDemoData(queryClient: QueryClient) {
  if (seededClients.has(queryClient)) return;
  seededClients.add(queryClient);

  const entries: [readonly unknown[], unknown][] = [
    [["portfolio"], demoData.portfolio],
    [["txns"], demoData.transactions],
    [["certs"], demoData.certificates],
    [["notifs"], demoData.notifications],
    [["kyc"], demoData.kyc],
    [["invest", "list"], demoData.investList],
    [["exits", "mine"], demoData.exits],
  ];
  for (const [key, data] of entries) {
    queryClient.setQueryDefaults(key, {
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
    queryClient.setQueryData(key, data);
  }
}
/* ------------------------------------------------------------------ */
/* Estate operations (sales-ops) sample data                          */
/* ------------------------------------------------------------------ */

const estE1 = {
  id: "demo-est-1",
  name: "Guzape Heights Estate",
  location: "Guzape, Abuja",
  total_land_size: "12 hectares",
  description: "Flagship residential estate on Kenneth Minimah Crescent.",
  created_at: monthsAgo(10, 3),
};
const estE2 = {
  id: "demo-est-2",
  name: "Karsana Green Estate",
  location: "Karsana, Abuja",
  total_land_size: "8 hectares",
  description: "Value-tier family plots with completed road network.",
  created_at: monthsAgo(6, 8),
};
const estE3 = {
  id: "demo-est-3",
  name: "Abacha Barracks Phase II",
  location: "Behind Abacha Barracks, Abuja",
  total_land_size: "20 hectares",
  description: "Surveyed estate land, title-verified.",
  created_at: monthsAgo(3, 12),
};

const demoProfiles = [
  {
    id: "demo-pf-1",
    user_id: "demo-user",
    full_name: DEMO_NAME,
    email: DEMO_EMAIL,
    phone: "0816 000 0000",
  },
  {
    id: "demo-pf-2",
    user_id: "demo-u2",
    full_name: "Chidi Okafor",
    email: "chidi.demo@example.com",
    phone: "0803 111 2222",
  },
  {
    id: "demo-pf-3",
    user_id: "demo-u3",
    full_name: "Ngozi Eze",
    email: "ngozi.demo@example.com",
    phone: "0805 333 4444",
  },
];

const plotRow = (
  id: string,
  plot_number: string,
  est: typeof estE1,
  size: number,
  type: string,
  price: number,
  status: string,
  block: string | null = null,
) => ({
  id,
  plot_number,
  block_number: block,
  estate_id: est.id,
  estates: { id: est.id, name: est.name },
  location: est.location,
  size_sqm: size,
  property_type: type,
  price,
  status,
  created_at: monthsAgo(5, 5),
});

const demoPlots = [
  plotRow("demo-plt-1", "A-012", estE1, 650, "residential", 95_000_000, "available", "A"),
  plotRow("demo-plt-2", "A-013", estE1, 700, "residential", 110_000_000, "allocated", "A"),
  plotRow("demo-plt-3", "B-004", estE2, 500, "residential", 42_000_000, "available", "B"),
  plotRow("demo-plt-4", "B-005", estE2, 500, "residential", 42_000_000, "sold", "B"),
  plotRow("demo-plt-5", "P2-118", estE3, 450, "land", 29_250_000, "available", null),
  plotRow("demo-plt-6", "P2-119", estE3, 450, "land", 29_250_000, "reserved", null),
];

export const demoEstateOps = {
  estates: [estE1, estE2, estE3],
  profiles: demoProfiles,
  plots: demoPlots,
  allocations: [
    {
      id: "demo-alloc-1",
      plot_id: "demo-plt-2",
      user_id: "demo-u2",
      status: "active",
      approval_status: "approved",
      allocation_date: monthsAgo(2, 14),
      plots: {
        plot_number: "A-013",
        location: estE1.location,
        block_number: "A",
        estates: { name: estE1.name },
      },
      profiles: {
        full_name: "Chidi Okafor",
        email: "chidi.demo@example.com",
        phone: "0803 111 2222",
      },
    },
    {
      id: "demo-alloc-2",
      plot_id: "demo-plt-4",
      user_id: "demo-u3",
      status: "active",
      approval_status: "approved",
      allocation_date: monthsAgo(1, 6),
      plots: {
        plot_number: "B-005",
        location: estE2.location,
        block_number: "B",
        estates: { name: estE2.name },
      },
      profiles: { full_name: "Ngozi Eze", email: "ngozi.demo@example.com", phone: "0805 333 4444" },
    },
  ],
  applications: [
    {
      id: "demo-app-1",
      application_ref_no: "KS-APP-0231",
      status: "pending",
      title: "Mr",
      surname: "Bello",
      first_name: "Ibrahim",
      other_names: null,
      email: "ibrahim.demo@example.com",
      phone_number_1: "0807 555 6666",
      gender: "Male",
      payment_mode: "installment",
      building_categories: ["Residential"],
      created_at: monthsAgo(0, 6),
      admin_notes: null,
    },
    {
      id: "demo-app-2",
      application_ref_no: "KS-APP-0230",
      status: "approved",
      title: "Mrs",
      surname: "Adeyemi",
      first_name: "Folake",
      other_names: null,
      email: "folake.demo@example.com",
      phone_number_1: "0809 777 8888",
      gender: "Female",
      payment_mode: "outright",
      building_categories: ["Residential"],
      created_at: monthsAgo(1, 20),
      admin_notes: "Allocated plot A-013.",
    },
    {
      id: "demo-app-3",
      application_ref_no: "KS-APP-0229",
      status: "rejected",
      title: "Mr",
      surname: "Musa",
      first_name: "Sadiq",
      other_names: null,
      email: "sadiq.demo@example.com",
      phone_number_1: "0812 999 0000",
      gender: "Male",
      payment_mode: "installment",
      building_categories: ["Land"],
      created_at: monthsAgo(2, 2),
      admin_notes: "Incomplete documentation.",
    },
  ],
  reservations: [
    {
      id: "demo-res-1",
      full_name: "Amaka Obi",
      email: "amaka.demo@example.com",
      phone: "0803 222 3333",
      property_type: "Residential",
      plot_size: "500 sqm",
      message: "Interested in Karsana Green.",
      status: "pending",
      admin_notes: null,
      created_at: monthsAgo(0, 4),
    },
    {
      id: "demo-res-2",
      full_name: "Tunde Bakare",
      email: "tunde.demo@example.com",
      phone: "0805 444 5555",
      property_type: "Land",
      plot_size: "450 sqm",
      message: "Phase II land enquiry.",
      status: "contacted",
      admin_notes: "Called; sending brochure.",
      created_at: monthsAgo(0, 9),
    },
    {
      id: "demo-res-3",
      full_name: "Grace Nnamdi",
      email: "grace.demo@example.com",
      phone: "0807 666 7777",
      property_type: "Residential",
      plot_size: "700 sqm",
      message: "Guzape Heights, corner plot preferred.",
      status: "confirmed",
      admin_notes: "Reserved A-012.",
      created_at: monthsAgo(1, 15),
    },
  ],
};

export const demoFinanceOps = {
  accounts: [
    {
      id: "demo-acct-1",
      bank_name: "GTBank",
      account_name: "Kay-Steph Group Ltd",
      account_number: "0123456789",
      account_type: "Current",
      purpose: "Land & plot payments",
    },
    {
      id: "demo-acct-2",
      bank_name: "Zenith Bank",
      account_name: "Kay-Steph Group Ltd",
      account_number: "1011223344",
      account_type: "Current",
      purpose: "Infrastructure & development",
    },
    {
      id: "demo-acct-3",
      bank_name: "Access Bank",
      account_name: "Kay-Steph Investments SPV",
      account_number: "0987654321",
      account_type: "Escrow",
      purpose: "Fractional & pool contributions",
    },
  ],
  receipts: [
    {
      id: "demo-rcpt-1",
      file_name: "gtbank-transfer-A013.pdf",
      file_url: "#",
      payment_category: "Land",
      approval_status: "pending",
      notes: "Transfer for plot A-013",
      created_at: monthsAgo(0, 3),
      user_id: "demo-u2",
      profiles: { full_name: "Chidi Okafor", email: "chidi.demo@example.com" },
    },
    {
      id: "demo-rcpt-2",
      file_name: "search-fee-receipt.jpg",
      file_url: "#",
      payment_category: "Search Fee",
      approval_status: "pending",
      notes: null,
      created_at: monthsAgo(0, 6),
      user_id: "demo-u3",
      profiles: { full_name: "Ngozi Eze", email: "ngozi.demo@example.com" },
    },
    {
      id: "demo-rcpt-3",
      file_name: "infra-dev-part1.pdf",
      file_url: "#",
      payment_category: "Infrastructure Development",
      approval_status: "approved",
      notes: "First instalment",
      created_at: monthsAgo(1, 12),
      user_id: "demo-u2",
      profiles: { full_name: "Chidi Okafor", email: "chidi.demo@example.com" },
    },
    {
      id: "demo-rcpt-4",
      file_name: "wrong-amount.jpg",
      file_url: "#",
      payment_category: "Fencing",
      approval_status: "rejected",
      notes: "Amount did not match",
      created_at: monthsAgo(2, 4),
      user_id: "demo-u3",
      profiles: { full_name: "Ngozi Eze", email: "ngozi.demo@example.com" },
    },
  ],
  requirements: [
    {
      id: "demo-req-1",
      user_id: "demo-u2",
      profiles: { full_name: "Chidi Okafor", email: "chidi.demo@example.com" },
      payment_category: "Land",
      amount_required: 110_000_000,
      amount_paid: 110_000_000,
      status: "paid",
    },
    {
      id: "demo-req-2",
      user_id: "demo-u2",
      profiles: { full_name: "Chidi Okafor", email: "chidi.demo@example.com" },
      payment_category: "Infrastructure Development",
      amount_required: 8_000_000,
      amount_paid: 4_000_000,
      status: "partial",
    },
    {
      id: "demo-req-3",
      user_id: "demo-u2",
      profiles: { full_name: "Chidi Okafor", email: "chidi.demo@example.com" },
      payment_category: "Fencing",
      amount_required: 2_500_000,
      amount_paid: 0,
      status: "pending",
    },
    {
      id: "demo-req-4",
      user_id: "demo-u3",
      profiles: { full_name: "Ngozi Eze", email: "ngozi.demo@example.com" },
      payment_category: "Land",
      amount_required: 42_000_000,
      amount_paid: 21_000_000,
      status: "partial",
    },
    {
      id: "demo-req-5",
      user_id: "demo-u3",
      profiles: { full_name: "Ngozi Eze", email: "ngozi.demo@example.com" },
      payment_category: "Search Fee",
      amount_required: 250_000,
      amount_paid: 250_000,
      status: "paid",
    },
  ],
};
export const demoSupportOps = {
  tickets: [
    {
      id: "demo-tkt-1",
      user_id: "demo-u2",
      subject: "Plot A-013 allocation letter",
      category: "documentation",
      priority: "high",
      status: "open",
      created_at: monthsAgo(0, 4),
      user_name: "Chidi Okafor",
      user_email: "chidi.demo@example.com",
    },
    {
      id: "demo-tkt-2",
      user_id: "demo-u3",
      subject: "Payment not reflecting",
      category: "payments",
      priority: "urgent",
      status: "open",
      created_at: monthsAgo(0, 6),
      user_name: "Ngozi Eze",
      user_email: "ngozi.demo@example.com",
    },
    {
      id: "demo-tkt-3",
      user_id: "demo-user",
      subject: "How do I download my certificate?",
      category: "general",
      priority: "normal",
      status: "resolved",
      created_at: monthsAgo(1, 10),
      user_name: DEMO_NAME,
      user_email: DEMO_EMAIL,
    },
  ],
  messages: {
    "demo-tkt-1": [
      {
        id: "demo-msg-1",
        ticket_id: "demo-tkt-1",
        sender_id: "demo-u2",
        message: "Please can I get the allocation letter for plot A-013?",
        is_internal: false,
        created_at: monthsAgo(0, 4),
        sender_name: "Chidi Okafor",
      },
      {
        id: "demo-msg-2",
        ticket_id: "demo-tkt-1",
        sender_id: "admin",
        message:
          "Hello Chidi — your allocation letter is being prepared and will be uploaded to your documents within 24 hours.",
        is_internal: false,
        created_at: monthsAgo(0, 3),
        sender_name: "Kay-Steph Support",
      },
    ],
    "demo-tkt-2": [
      {
        id: "demo-msg-3",
        ticket_id: "demo-tkt-2",
        sender_id: "demo-u3",
        message: "I transferred ₦21M yesterday but my payment plan still shows a balance.",
        is_internal: false,
        created_at: monthsAgo(0, 6),
        sender_name: "Ngozi Eze",
      },
    ],
    "demo-tkt-3": [
      {
        id: "demo-msg-4",
        ticket_id: "demo-tkt-3",
        sender_id: "demo-user",
        message: "Where do I find my investment certificate?",
        is_internal: false,
        created_at: monthsAgo(1, 10),
        sender_name: DEMO_NAME,
      },
      {
        id: "demo-msg-5",
        ticket_id: "demo-tkt-3",
        sender_id: "admin",
        message: "Go to Documents → Certificates in your portal. Each has a download link.",
        is_internal: false,
        created_at: monthsAgo(1, 9),
        sender_name: "Kay-Steph Support",
      },
    ],
  } as Record<string, unknown[]>,
  documents: [
    {
      id: "demo-doc-1",
      file_name: "allocation-letter-A013.pdf",
      file_url: "#",
      document_type: "allocation_letter",
      payment_category: null,
      approval_status: "approved",
      created_at: monthsAgo(1, 20),
      user_id: "demo-u2",
      profiles: { full_name: "Chidi Okafor", email: "chidi.demo@example.com" },
    },
    {
      id: "demo-doc-2",
      file_name: "gtbank-transfer-A013.pdf",
      file_url: "#",
      document_type: "receipt",
      payment_category: "Land",
      approval_status: "pending",
      created_at: monthsAgo(0, 3),
      user_id: "demo-u2",
      profiles: { full_name: "Chidi Okafor", email: "chidi.demo@example.com" },
    },
    {
      id: "demo-doc-3",
      file_name: "national-id-ngozi.jpg",
      file_url: "#",
      document_type: "identity",
      payment_category: null,
      approval_status: "approved",
      created_at: monthsAgo(2, 5),
      user_id: "demo-u3",
      profiles: { full_name: "Ngozi Eze", email: "ngozi.demo@example.com" },
    },
    {
      id: "demo-doc-4",
      file_name: "deed-of-assignment.pdf",
      file_url: "#",
      document_type: "contract",
      payment_category: null,
      approval_status: "approved",
      created_at: monthsAgo(1, 2),
      user_id: "demo-user",
      profiles: { full_name: DEMO_NAME, email: DEMO_EMAIL },
    },
  ],
  roles: [
    {
      user_id: "demo-admin-1",
      role: "super_admin",
      created_at: monthsAgo(12, 1),
      email: "founder@kaystephgroup.com",
    },
    {
      user_id: "demo-admin-2",
      role: "admin",
      created_at: monthsAgo(8, 3),
      email: "ops@kaystephgroup.com",
    },
    {
      user_id: "demo-admin-3",
      role: "manager",
      created_at: monthsAgo(4, 10),
      email: "sales@kaystephgroup.com",
    },
  ],
};
