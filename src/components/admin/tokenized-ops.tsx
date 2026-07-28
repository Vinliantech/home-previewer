/* Tokenized-investment admin modules (ported from /admin-invest into the
   unified bank-UI admin): Investments, KYC, Properties, Valuations, Rental
   Income, Rental Payouts, Withdrawals, Exit Requests.
   Logic is a straight port; presentation matches estate-ops/finance-ops. */
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  Coins,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createSignedDocumentUrl } from "@/integrations/supabase/edge";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  adminAnalytics,
  adminApproveInvestment,
  adminApproveWithdrawal,
  adminCreateProperty,
  adminListExits,
  adminListInvestments,
  adminListKyc,
  adminListProperties,
  adminListRentalPayouts,
  adminListWithdrawals,
  adminMarkPayoutPaid,
  adminRecordRentalIncome,
  adminRecordValuation,
  adminRejectInvestment,
  adminRejectWithdrawal,
  adminReviewKyc,
  adminUpdateExit,
  adminUpdateProperty,
} from "@/lib/invest.functions";
import { properties as publicPropertyFallbacks } from "@/lib/properties";
import {
  EXIT_STATUS_LABEL,
  fmtNGN,
  fmtPct,
  INVESTMENT_STATUS_LABEL,
  KYC_STATUS_LABEL,
} from "@/lib/invest";
import { DashCard, EmptyState, StatCard, StatusBadge } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExitStatus = Database["public"]["Enums"]["exit_status"];
type PrivateBucket = "investor-kyc" | "payment-evidence";

const reviewableInvestmentStatuses = ["payment_pending", "payment_received", "under_review"];
const rentablePropertyStatuses = ["acquired", "income_generating", "available_for_resale"];
const exitStatusEntries = Object.entries(EXIT_STATUS_LABEL) as Array<[ExitStatus, string]>;
const exitTransitions: Record<ExitStatus, ExitStatus[]> = {
  submitted: ["under_review", "rejected", "cancelled"],
  under_review: ["approved_for_listing", "rejected", "cancelled"],
  approved_for_listing: ["under_review", "buyer_found", "cancelled"],
  buyer_found: ["approved_for_listing", "payment_pending", "cancelled"],
  payment_pending: ["buyer_found", "transfer_in_progress", "cancelled"],
  transfer_in_progress: ["payment_pending", "cancelled"],
  completed: [],
  rejected: [],
  cancelled: [],
};

/* ---------- shared bank-UI bits (same pattern as finance-ops) ---------- */
function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
function TableShell({
  head,
  children,
  min = 760,
}: {
  head: ReactNode;
  children: ReactNode;
  min?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: min }}>
        <thead>
          <tr className="border-b border-slate-100">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function ErrorPanel({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      {errorMessage(error)}
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The operation could not be completed.";
}
function notifyError(error: unknown) {
  toast.error(errorMessage(error));
}
function jsonText(value: Json | null, key: string) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return "";
  const field = value[key];
  return typeof field === "string" ? field : "";
}

async function openPrivateFile(bucket: PrivateBucket, path: string) {
  try {
    let url = path;
    if (!/^https?:\/\//i.test(path)) {
      url = await createSignedDocumentUrl(bucket, path, 60);
    }
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  } catch (error) {
    notifyError(error);
  }
}

function PrivateFileButton({
  label,
  bucket,
  path,
}: {
  label: string;
  bucket: PrivateBucket;
  path: string | null;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={!path}
      className="h-7 text-xs"
      onClick={() => path && openPrivateFile(bucket, path)}
    >
      {label} <ExternalLink className="ml-1 h-3 w-3" />
    </Button>
  );
}

/* ============================ INVESTMENTS (+ stats) ============================ */
export function TokenizedInvestmentsModule() {
  const queryClient = useQueryClient();
  const { data: stats } = useQuery({
    queryKey: ["invest_stats"],
    queryFn: () =>
      adminAnalytics(),
  });
  const { data, error } = useQuery({
    queryKey: ["admin_inv"],
    queryFn: () =>
      adminListInvestments(),
  });
  const approve = useMutation({
    mutationFn: adminApproveInvestment,
    onSuccess: () => {
      toast.success("Investment approved.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });
  const reject = useMutation({
    mutationFn: adminRejectInvestment,
    onSuccess: () => {
      toast.success("Investment rejected.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });
  const [amountMap, setAmountMap] = useState<Record<string, number>>({});

  if (error) return <ErrorPanel error={error} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Building2} label="Properties" value={String(stats?.propCount ?? 0)} />
        <StatCard icon={Users} label="Investors" value={String(stats?.investorCount ?? 0)} />
        <StatCard
          icon={ShieldCheck}
          label="Pending KYC"
          value={String(stats?.pendingKyc ?? 0)}
          subTone={stats?.pendingKyc ? "negative" : "neutral"}
        />
        <StatCard
          icon={Coins}
          label="Pending Investments"
          value={String(stats?.pendingInvestments ?? 0)}
          subTone={stats?.pendingInvestments ? "negative" : "neutral"}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Approved"
          value={fmtNGN(stats?.totalApproved ?? 0)}
        />
        <StatCard icon={Banknote} label="Total Rental" value={fmtNGN(stats?.totalRental ?? 0)} />
      </div>

      <DashCard
        title="Investment applications"
        description="Contributions to tokenized properties, pending and approved."
        noPadding
      >
        <TableShell
          min={960}
          head={
            <>
              <Th>Investor</Th>
              <Th>Property</Th>
              <Th>Proposed</Th>
              <Th>Approved</Th>
              <Th>Status</Th>
              <Th>Evidence</Th>
              <Th>Actions</Th>
            </>
          }
        >
          {(data?.investments ?? []).map((investment) => {
            const profile = investment.investor_profile;
            const canApprove = Boolean(
              investment.payment_evidence_url &&
              profile?.kyc_status === "verified" &&
              reviewableInvestmentStatuses.includes(investment.status),
            );
            return (
              <tr key={investment.id} className="border-b border-slate-50 last:border-0">
                <Td>
                  <div className="font-medium text-navy">{profile?.full_name ?? "Investor"}</div>
                  <div className="text-xs text-slate-500">
                    {profile?.email ?? investment.investor_id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-slate-500">
                    KYC: {KYC_STATUS_LABEL[profile?.kyc_status ?? "not_submitted"]}
                  </div>
                </Td>
                <Td className="text-slate-600">{investment.tokenized_properties?.name}</Td>
                <Td className="tabular-nums text-navy">{fmtNGN(investment.proposed_amount)}</Td>
                <Td className="tabular-nums text-navy">
                  {investment.approved_amount ? fmtNGN(investment.approved_amount) : "—"}
                </Td>
                <Td>
                  <StatusBadge
                    status={investment.status}
                    label={INVESTMENT_STATUS_LABEL[investment.status]}
                  />
                </Td>
                <Td>
                  {investment.payment_evidence_url ? (
                    <div className="space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          openPrivateFile("payment-evidence", investment.payment_evidence_url!)
                        }
                      >
                        View evidence <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                      {investment.payment_reference && (
                        <div className="max-w-40 truncate text-xs text-slate-400">
                          Ref: {investment.payment_reference}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Not uploaded</span>
                  )}
                </Td>
                <Td>
                  {investment.status !== "approved" && investment.status !== "rejected" && (
                    <div className="flex min-w-36 flex-col gap-1">
                      <Input
                        aria-label={`Approved amount for ${investment.tokenized_properties?.name ?? "investment"}`}
                        type="number"
                        min={Number(investment.tokenized_properties?.token_value ?? 1)}
                        step={Number(investment.tokenized_properties?.token_value ?? 1)}
                        defaultValue={investment.proposed_amount}
                        onChange={(event) =>
                          setAmountMap({
                            ...amountMap,
                            [investment.id]: Number(event.target.value),
                          })
                        }
                        className="h-8 w-36 text-xs"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={!canApprove || approve.isPending}
                          title={
                            canApprove
                              ? undefined
                              : "Verified KYC and payment evidence are required."
                          }
                          className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => {
                            approve.mutate({
                              data: {
                                id: investment.id,
                                approved_amount:
                                  amountMap[investment.id] ?? Number(investment.proposed_amount),
                              },
                            });
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            const notes = window.prompt("Reason for rejection?");
                            if (notes == null) return;
                            reject.mutate({ data: { id: investment.id, notes } });
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </Td>
              </tr>
            );
          })}
        </TableShell>
        {(data?.investments ?? []).length === 0 && (
          <EmptyState icon={Coins} title="No investment applications" />
        )}
      </DashCard>
    </div>
  );
}

/* ============================ KYC ============================ */
export function TokenizedKycModule() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin_kyc"],
    queryFn: () =>
      adminListKyc(),
  });
  const review = useMutation({
    mutationFn: adminReviewKyc,
    onSuccess: () => {
      toast.success("KYC review updated.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });

  if (error) return <ErrorPanel error={error} />;

  function reviewWithNote(id: string, status: "rejected" | "more_info") {
    const promptText =
      status === "rejected" ? "Reason for rejection?" : "What information is required?";
    const notes = window.prompt(promptText);
    if (!notes?.trim()) return;
    review.mutate({ data: { id, status, notes } });
  }

  return (
    <DashCard
      title="Investor KYC"
      description="Identity verification for tokenized investors."
      noPadding
    >
      <TableShell
        min={880}
        head={
          <>
            <Th>Investor</Th>
            <Th>Identity</Th>
            <Th>Documents</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </>
        }
      >
        {(data?.kyc ?? []).map((profile) => (
          <tr key={profile.id} className="border-b border-slate-50 last:border-0">
            <Td>
              <div className="font-medium text-navy">{profile.full_name}</div>
              <div className="text-xs text-slate-500">{profile.email}</div>
            </Td>
            <Td>
              <div className="text-xs text-navy">{profile.id_type}</div>
              <div className="text-xs text-slate-500">{profile.id_number}</div>
            </Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                <PrivateFileButton
                  label="View ID"
                  bucket="investor-kyc"
                  path={profile.id_doc_url}
                />
                <PrivateFileButton
                  label="View photo"
                  bucket="investor-kyc"
                  path={profile.photo_url}
                />
              </div>
            </Td>
            <Td>
              <StatusBadge
                status={profile.kyc_status}
                label={KYC_STATUS_LABEL[profile.kyc_status]}
              />
              {profile.kyc_notes && (
                <div className="mt-1 max-w-52 text-xs text-amber-600">{profile.kyc_notes}</div>
              )}
            </Td>
            <Td>
              <div className="flex min-w-52 flex-wrap gap-1">
                <Button
                  size="sm"
                  disabled={!profile.id_doc_url || !profile.photo_url || review.isPending}
                  className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    review.mutate({ data: { id: profile.id, status: "verified" } });
                  }}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => reviewWithNote(profile.id, "rejected")}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => reviewWithNote(profile.id, "more_info")}
                >
                  Ask for more
                </Button>
              </div>
            </Td>
          </tr>
        ))}
      </TableShell>
      {(data?.kyc ?? []).length === 0 && (
        <EmptyState icon={ShieldCheck} title="No KYC submissions" />
      )}
    </DashCard>
  );
}

/* ============================ PROPERTIES ============================ */
const PROPERTY_TYPES = [
  "Detached home",
  "Semi-detached home",
  "Apartment",
  "Terrace",
  "Estate land",
];
const INVESTMENT_MODELS = [
  ["full_purchase", "Full purchase"],
  ["group_purchase", "Group purchase"],
  ["fractional", "Fractional ownership"],
  ["spv", "SPV co-ownership"],
  ["tokenized", "Tokenized units"],
] as const;
const PROPERTY_STATUSES = [
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
] as const;

const initialPropertyForm = {
  name: "",
  public_slug: "",
  location: "",
  description: "",
  property_type: "Apartment",
  public_property_types: ["Apartment"] as string[],
  images: "",
  initial_value: 0,
  min_investors: 1,
  min_investment: 500000,
  token_value: 10000,
  expected_rental_yield: 0,
  expected_appreciation: 0,
  status: "open" as (typeof PROPERTY_STATUSES)[number],
  public_tag: "Available",
  tagline: "",
  price_label: "",
  price_note: "starting price",
  highlight: "",
  features: "",
  overview: "",
  units: "",
  investment_models: ["full_purchase"] as string[],
  public_funding_status: "available" as
    | "available"
    | "selling"
    | "funding_open"
    | "fully_funded"
    | "coming_soon",
  is_public: true,
  show_on_home: true,
  home_order: 100,
};

type PropertyForm = typeof initialPropertyForm;

function slugifyProperty(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitPropertyList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePropertyUnits(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...price] = line.split("|");
      return { label: label.trim(), price: price.join("|").trim() };
    })
    .filter((unit) => unit.label);
}

function unitsText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .flatMap((unit) => {
      if (!unit || typeof unit !== "object") return [];
      const label = "label" in unit && typeof unit.label === "string" ? unit.label : "";
      const price = "price" in unit && typeof unit.price === "string" ? unit.price : "";
      return label ? [`${label}${price ? ` | ${price}` : ""}`] : [];
    })
    .join("\n");
}

function formFromProperty(property: Database["public"]["Tables"]["tokenized_properties"]["Row"]) {
  const fallback = publicPropertyFallbacks.find(
    (item) =>
      item.id === property.public_slug ||
      item.title.toLowerCase() === property.name.toLowerCase(),
  );
  return {
    ...initialPropertyForm,
    name: property.name,
    public_slug: property.public_slug || fallback?.id || slugifyProperty(property.name),
    location: property.location,
    description: property.description ?? "",
    property_type: property.property_type || fallback?.propertyTypes[0] || "Apartment",
    public_property_types:
      property.public_property_types?.length
        ? property.public_property_types
        : (fallback?.propertyTypes ?? ["Apartment"]),
    images: (property.images ?? []).join("\n"),
    initial_value: Number(property.initial_value),
    min_investors: Number(property.min_investors),
    min_investment: Number(property.min_investment),
    token_value: Number(property.token_value),
    expected_rental_yield: Number(property.expected_rental_yield ?? 0),
    expected_appreciation: Number(property.expected_appreciation ?? 0),
    status: property.status,
    public_tag: property.public_tag || fallback?.tag || "Available",
    tagline: property.tagline || fallback?.tagline || "",
    price_label: property.price_label || fallback?.price || "",
    price_note: property.price_note || fallback?.priceNote || "",
    highlight: property.highlight || fallback?.highlight || "",
    features: property.features?.length
      ? property.features.join("\n")
      : (fallback?.features.join("\n") ?? ""),
    overview: property.overview?.length
      ? property.overview.join("\n\n")
      : (fallback?.overview.join("\n\n") ?? ""),
    units: unitsText(property.public_units) || (fallback?.units.map((unit) => `${unit.label} | ${unit.price}`).join("\n") ?? ""),
    investment_models:
      property.investment_models?.length
        ? property.investment_models
        : (fallback?.investmentModels ?? ["full_purchase"]),
    public_funding_status:
      (property.public_funding_status as PropertyForm["public_funding_status"]) ||
      fallback?.fundingStatus ||
      "available",
    is_public: property.is_public ?? true,
    show_on_home: property.show_on_home ?? true,
    home_order: Number(property.home_order ?? 100),
  } satisfies PropertyForm;
}

export function TokenizedPropertiesModule() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PropertyForm>(initialPropertyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { data, error } = useQuery({
    queryKey: ["admin_properties"],
    queryFn: () =>
      adminListProperties(),
  });

  function finishSave(message: string) {
    toast.success(message);
    setForm(initialPropertyForm);
    setEditingId(null);
    setEditorOpen(false);
    queryClient.invalidateQueries({ queryKey: ["admin_properties"] });
    queryClient.invalidateQueries({ queryKey: ["invest", "list"] });
    queryClient.invalidateQueries({ queryKey: ["public-property-catalogue"] });
  }

  const createProperty = useMutation({
    mutationFn: adminCreateProperty,
    onSuccess: () => finishSave("Property created and shared across the portals."),
    onError: notifyError,
  });
  const updateProperty = useMutation({
    mutationFn: adminUpdateProperty,
    onSuccess: () => finishSave("Property updated across the website and portals."),
    onError: notifyError,
  });

  if (error) return <ErrorPanel error={error} />;

  function startCreate() {
    setEditingId(null);
    setForm(initialPropertyForm);
    setEditorOpen(true);
  }

  function startEdit(property: Database["public"]["Tables"]["tokenized_properties"]["Row"]) {
    setEditingId(property.id);
    setForm(formFromProperty(property));
    setEditorOpen(true);
  }

  function toggleList(field: "public_property_types" | "investment_models", value: string) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  }

  function saveProperty() {
    const payload = {
      name: form.name.trim(),
      public_slug: form.public_slug.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      property_type: form.property_type.trim(),
      public_property_types: form.public_property_types,
      images: splitPropertyList(form.images),
      initial_value: form.initial_value,
      min_investors: form.min_investors,
      min_investment: form.min_investment,
      token_value: form.token_value,
      expected_rental_yield: form.expected_rental_yield,
      expected_appreciation: form.expected_appreciation,
      status: form.status,
      public_tag: form.public_tag.trim(),
      tagline: form.tagline.trim(),
      price_label: form.price_label.trim(),
      price_note: form.price_note.trim(),
      highlight: form.highlight.trim(),
      features: splitPropertyList(form.features),
      overview: form.overview
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      public_units: parsePropertyUnits(form.units),
      investment_models: form.investment_models as Array<
        "full_purchase" | "group_purchase" | "fractional" | "spv" | "tokenized"
      >,
      public_funding_status: form.public_funding_status,
      is_public: form.is_public,
      show_on_home: form.show_on_home,
      home_order: form.home_order,
    };
    if (editingId) updateProperty.mutate({ data: { ...payload, id: editingId } });
    else createProperty.mutate({ data: payload });
  }

  const saving = createProperty.isPending || updateProperty.isPending;
  const valid =
    form.name.trim().length >= 2 &&
    form.public_slug.trim().length > 0 &&
    form.location.trim().length >= 2 &&
    form.initial_value > 0 &&
    form.investment_models.length > 0;

  return (
    <>
      <DashCard
        title="Kay-Steph property catalogue"
        description="One catalogue shared by the homepage, Properties page, client portal, affiliate portal and payment-plan selectors."
        noPadding
        action={
          <Button
            size="sm"
            onClick={startCreate}
            className="rounded-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            <Plus className="mr-1 h-4 w-4" /> New property
          </Button>
        }
      >
        <TableShell
          min={820}
          head={
            <>
              <Th>Property</Th>
              <Th>Location</Th>
              <Th>Value</Th>
              <Th>Website</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </>
          }
        >
          {(data?.properties ?? []).map((property) => (
            <tr key={property.id} className="border-b border-slate-50 last:border-0">
              <Td>
                <div className="font-medium text-navy">{property.name}</div>
                <div className="text-xs text-slate-400">/{property.public_slug ?? "not-published"}</div>
              </Td>
              <Td className="text-slate-600">{property.location}</Td>
              <Td className="tabular-nums text-navy">{fmtNGN(property.initial_value)}</Td>
              <Td>
                <div className="text-xs font-semibold text-slate-600">
                  {property.is_public ? "Public" : "Hidden"}
                </div>
                <div className="text-xs text-slate-400">
                  {property.show_on_home ? "Homepage" : "Properties page only"}
                </div>
              </Td>
              <Td>
                <StatusBadge status={property.status} />
              </Td>
              <Td>
                <Button size="sm" variant="outline" onClick={() => startEdit(property)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
              </Td>
            </tr>
          ))}
        </TableShell>
        {(data?.properties ?? []).length === 0 && (
          <EmptyState icon={Building2} title="No properties yet" />
        )}
      </DashCard>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingId(null);
            setForm(initialPropertyForm);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-navy">
              {editingId ? "Edit property" : "Add a new property"}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 text-sm text-slate-600">
            The public presentation fields control how this property looks on the homepage and
            Properties page. Investment fields control the client portal.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property name">
              <Input
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    public_slug: editingId ? current.public_slug : slugifyProperty(name),
                  }));
                }}
              />
            </Field>
            <Field label="Page URL slug">
              <Input
                value={form.public_slug}
                onChange={(event) =>
                  setForm({ ...form, public_slug: slugifyProperty(event.target.value) })
                }
                placeholder="daverek-luxury-apartments"
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </Field>
            <Field label="Public badge">
              <Input
                value={form.public_tag}
                onChange={(event) => setForm({ ...form, public_tag: event.target.value })}
                placeholder="Available, New, Selling…"
              />
            </Field>
            <Field label="Main property type">
              <Input
                value={form.property_type}
                onChange={(event) => setForm({ ...form, property_type: event.target.value })}
              />
            </Field>
            <Field label="Property value">
              <Input
                type="number"
                min={1}
                value={form.initial_value || ""}
                onChange={(event) =>
                  setForm({ ...form, initial_value: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Display price">
              <Input
                value={form.price_label}
                onChange={(event) => setForm({ ...form, price_label: event.target.value })}
                placeholder="From ₦90,000,000"
              />
            </Field>
            <Field label="Price note">
              <Input
                value={form.price_note}
                onChange={(event) => setForm({ ...form, price_note: event.target.value })}
                placeholder="per apartment"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Card tagline">
                <Input
                  value={form.tagline}
                  onChange={(event) => setForm({ ...form, tagline: event.target.value })}
                  placeholder="A concise sentence shown below the property name"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Short description">
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Property-page highlight">
                <Textarea
                  value={form.highlight}
                  onChange={(event) => setForm({ ...form, highlight: event.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Overview paragraphs (separate paragraphs with a blank line)">
                <Textarea
                  className="min-h-32"
                  value={form.overview}
                  onChange={(event) => setForm({ ...form, overview: event.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Cover and gallery image URLs (one per line)">
                <Textarea
                  className="min-h-28"
                  value={form.images}
                  onChange={(event) => setForm({ ...form, images: event.target.value })}
                  placeholder="/properties/property-cover.jpg"
                />
              </Field>
              {splitPropertyList(form.images)[0] && (
                <img
                  src={splitPropertyList(form.images)[0]}
                  alt="Property preview"
                  className="mt-3 aspect-[16/7] w-full rounded-xl border border-slate-200 object-cover"
                />
              )}
            </div>
            <div className="sm:col-span-2">
              <Field label="Features (one per line)">
                <Textarea
                  value={form.features}
                  onChange={(event) => setForm({ ...form, features: event.target.value })}
                  placeholder={"24/7 Security\nPrivate parking\nServiced"}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Units and prices (one per line: Unit name | Price)">
                <Textarea
                  value={form.units}
                  onChange={(event) => setForm({ ...form, units: event.target.value })}
                  placeholder={"3-Bedroom Apartment | ₦160,000,000\n2-Bedroom Apartment | ₦140,000,000"}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-sm font-semibold">Property types shown in filters</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.public_property_types.includes(type)}
                      onChange={() => toggleList("public_property_types", type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-semibold">Ownership routes</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INVESTMENT_MODELS.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.investment_models.includes(value)}
                      onChange={() => toggleList("investment_models", value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <Field label="Website availability">
              <Select
                value={form.public_funding_status}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    public_funding_status: value as PropertyForm["public_funding_status"],
                  })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available now</SelectItem>
                  <SelectItem value="selling">Selling</SelectItem>
                  <SelectItem value="funding_open">Funding open</SelectItem>
                  <SelectItem value="fully_funded">Fully funded</SelectItem>
                  <SelectItem value="coming_soon">Coming soon</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Investment status">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as PropertyForm["status"] })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Minimum investors">
              <Input
                type="number"
                min={1}
                value={form.min_investors}
                onChange={(event) =>
                  setForm({ ...form, min_investors: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Minimum investment">
              <Input
                type="number"
                min={1}
                value={form.min_investment}
                onChange={(event) =>
                  setForm({ ...form, min_investment: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Token value">
              <Input
                type="number"
                min={1}
                value={form.token_value}
                onChange={(event) => setForm({ ...form, token_value: Number(event.target.value) })}
              />
            </Field>
            <Field label="Homepage order">
              <Input
                type="number"
                min={0}
                value={form.home_order}
                onChange={(event) => setForm({ ...form, home_order: Number(event.target.value) })}
              />
            </Field>
            <Field label="Expected rental yield (%)">
              <Input
                type="number"
                min={0}
                value={form.expected_rental_yield}
                onChange={(event) =>
                  setForm({ ...form, expected_rental_yield: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Expected appreciation (%)">
              <Input
                type="number"
                min={0}
                value={form.expected_appreciation}
                onChange={(event) =>
                  setForm({ ...form, expected_appreciation: Number(event.target.value) })
                }
              />
            </Field>
            <div className="sm:col-span-2 flex flex-wrap gap-5 rounded-xl border border-slate-200 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-navy">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(event) => setForm({ ...form, is_public: event.target.checked })}
                />
                Publish on the website and portals
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-navy">
                <input
                  type="checkbox"
                  checked={form.show_on_home}
                  onChange={(event) => setForm({ ...form, show_on_home: event.target.checked })}
                />
                Feature on homepage
              </label>
            </div>
          </div>

          <Button
            disabled={!valid || saving}
            onClick={saveProperty}
            className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
          >
            {saving ? "Saving…" : editingId ? "Save property changes" : "Create and publish property"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============================ VALUATIONS ============================ */
export function TokenizedValuationsModule() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin_properties"],
    queryFn: () =>
      adminListProperties(),
  });
  const [form, setForm] = useState({
    property_id: "",
    new_value: 0,
    valuation_date: new Date().toISOString().slice(0, 10),
    valuer: "",
    notes: "",
  });
  const recordValuation = useMutation({
    mutationFn: adminRecordValuation,
    onSuccess: () => {
      toast.success("Valuation recorded.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });

  if (error) return <ErrorPanel error={error} />;

  return (
    <DashCard
      title="Record property valuation"
      description="Updates the property's current value; investor share values follow automatically."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Property">
          <Select
            value={form.property_id}
            onValueChange={(value) => setForm({ ...form, property_id: value })}
          >
            <SelectTrigger aria-label="Property">
              <SelectValue placeholder="Choose a property" />
            </SelectTrigger>
            <SelectContent>
              {(data?.properties ?? []).map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="New value (₦)">
          <Input
            type="number"
            min={1}
            value={form.new_value || ""}
            onChange={(event) => setForm({ ...form, new_value: Number(event.target.value) })}
          />
        </Field>
        <Field label="Valuation date">
          <Input
            type="date"
            value={form.valuation_date}
            onChange={(event) => setForm({ ...form, valuation_date: event.target.value })}
          />
        </Field>
        <Field label="Independent valuer">
          <Input
            value={form.valuer}
            onChange={(event) => setForm({ ...form, valuer: event.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>
        </div>
      </div>
      <Button
        disabled={!form.property_id || form.new_value <= 0 || !form.valuation_date}
        onClick={() => {
          recordValuation.mutate({ data: form });
        }}
        className="mt-4 rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
      >
        Save valuation
      </Button>
    </DashCard>
  );
}

/* ============================ RENTAL INCOME ============================ */
export function TokenizedRentalModule() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin_properties"],
    queryFn: () =>
      adminListProperties(),
  });
  const [form, setForm] = useState({
    property_id: "",
    gross_income: 0,
    mgmt_fee: 0,
    maintenance: 0,
    taxes: 0,
    other_expenses: 0,
    distribution_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const recordRental = useMutation({
    mutationFn: adminRecordRentalIncome,
    onSuccess: () => {
      toast.success("Rental distribution created.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });
  const eligibleProperties = (data?.properties ?? []).filter((property) =>
    rentablePropertyStatuses.includes(property.status),
  );
  const net =
    form.gross_income - form.mgmt_fee - form.maintenance - form.taxes - form.other_expenses;

  if (error) return <ErrorPanel error={error} />;

  const money = (label: string, key: keyof typeof form) => (
    <Field label={label}>
      <Input
        type="number"
        min={0}
        value={(form[key] as number) || ""}
        onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })}
      />
    </Field>
  );

  return (
    <DashCard
      title="Record rental income"
      description="Creates per-investor distributions in proportion to ownership."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Income-generating property">
          <Select
            value={form.property_id}
            onValueChange={(value) => setForm({ ...form, property_id: value })}
          >
            <SelectTrigger aria-label="Property">
              <SelectValue placeholder="Choose a property" />
            </SelectTrigger>
            <SelectContent>
              {eligibleProperties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {money("Gross income (₦)", "gross_income")}
        <Field label="Distribution date">
          <Input
            type="date"
            value={form.distribution_date}
            onChange={(event) => setForm({ ...form, distribution_date: event.target.value })}
          />
        </Field>
        {money("Management fee (₦)", "mgmt_fee")}
        {money("Maintenance (₦)", "maintenance")}
        {money("Taxes (₦)", "taxes")}
        {money("Other expenses (₦)", "other_expenses")}
        <div className="sm:col-span-2">
          <Field label="Distribution notes">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-600">
        Net distributable:{" "}
        <strong className={net > 0 ? "text-emerald-600" : "text-rose-600"}>{fmtNGN(net)}</strong>
      </div>
      <Button
        disabled={!form.property_id || net <= 0 || !form.distribution_date}
        onClick={() => {
          recordRental.mutate({ data: form });
        }}
        className="mt-4 rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
      >
        Create distribution
      </Button>
    </DashCard>
  );
}

/* ============================ RENTAL PAYOUTS ============================ */
export function TokenizedPayoutsModule() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin_rental_payouts"],
    queryFn: () =>
      adminListRentalPayouts(),
  });
  const markPaid = useMutation({
    mutationFn: adminMarkPayoutPaid,
    onSuccess: () => {
      toast.success("Return credited to the investor wallet.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });

  if (error) return <ErrorPanel error={error} />;

  return (
    <DashCard
      title="Rental payouts"
      description="Per-investor rental distributions awaiting settlement."
      noPadding
    >
      <TableShell
        min={800}
        head={
          <>
            <Th>Investor</Th>
            <Th>Property</Th>
            <Th>Ownership</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </>
        }
      >
        {(data?.payouts ?? []).map((payout) => (
          <tr key={payout.id} className="border-b border-slate-50 last:border-0">
            <Td>
              <div className="font-medium text-navy">
                {payout.investor_profile?.full_name ?? "Investor"}
              </div>
              <div className="text-xs text-slate-500">{payout.investor_profile?.email}</div>
            </Td>
            <Td className="text-slate-600">{payout.tokenized_properties?.name}</Td>
            <Td className="text-slate-600">{fmtPct(payout.ownership_pct_snapshot)}</Td>
            <Td className="tabular-nums text-navy">{fmtNGN(payout.amount)}</Td>
            <Td>
              <StatusBadge status={payout.status} />
            </Td>
            <Td>
              {payout.status === "pending" && (
                <Button
                  size="sm"
                  disabled={markPaid.isPending}
                  className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    const reference = window.prompt("Settlement note or reference?");
                    if (!reference?.trim()) return;
                    markPaid.mutate({ data: { id: payout.id, reference } });
                  }}
                >
                  Credit wallet
                </Button>
              )}
            </Td>
          </tr>
        ))}
      </TableShell>
      {(data?.payouts ?? []).length === 0 && <EmptyState icon={Wallet} title="No payouts yet" />}
    </DashCard>
  );
}

/* ============================ WITHDRAWALS ============================ */
export function TokenizedWithdrawalsModule() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin_wd"],
    queryFn: () =>
      adminListWithdrawals(),
  });
  const approve = useMutation({
    mutationFn: adminApproveWithdrawal,
    onSuccess: () => {
      toast.success("Withdrawal approved.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });
  const reject = useMutation({
    mutationFn: adminRejectWithdrawal,
    onSuccess: () => {
      toast.success("Withdrawal rejected.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });

  if (error) return <ErrorPanel error={error} />;

  return (
    <DashCard
      title="Wallet withdrawals"
      description="Investor withdrawal requests from wallet balances."
      noPadding
    >
      <TableShell
        min={800}
        head={
          <>
            <Th>Investor</Th>
            <Th>Amount</Th>
            <Th>Settlement account</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </>
        }
      >
        {(data?.withdrawals ?? []).map((withdrawal) => (
          <tr key={withdrawal.id} className="border-b border-slate-50 last:border-0">
            <Td>
              <div className="font-medium text-navy">
                {withdrawal.investor_profile?.full_name ?? "Investor"}
              </div>
              <div className="text-xs text-slate-500">{withdrawal.investor_profile?.email}</div>
            </Td>
            <Td className="tabular-nums text-navy">{fmtNGN(withdrawal.amount)}</Td>
            <Td className="text-xs">
              <div className="text-navy">{jsonText(withdrawal.bank_details, "account_name")}</div>
              <div className="text-slate-500">
                {jsonText(withdrawal.bank_details, "bank_name")} —{" "}
                {jsonText(withdrawal.bank_details, "account_number")}
              </div>
            </Td>
            <Td>
              <StatusBadge status={withdrawal.status} />
              {withdrawal.admin_notes && (
                <div className="mt-1 max-w-52 text-xs text-rose-600">{withdrawal.admin_notes}</div>
              )}
            </Td>
            <Td>
              {withdrawal.status === "pending" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    disabled={approve.isPending}
                    className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      const reference = window.prompt("Bank payment reference?");
                      if (!reference?.trim()) return;
                      approve.mutate({ data: { id: withdrawal.id, reference } });
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-rose-200 text-rose-600 hover:bg-rose-50"
                    onClick={() => {
                      const notes = window.prompt("Reason for rejection?");
                      if (!notes?.trim()) return;
                      reject.mutate({ data: { id: withdrawal.id, notes } });
                    }}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </Td>
          </tr>
        ))}
      </TableShell>
      {(data?.withdrawals ?? []).length === 0 && (
        <EmptyState icon={Wallet} title="No withdrawal requests" />
      )}
    </DashCard>
  );
}

/* ============================ EXIT REQUESTS ============================ */
export function TokenizedExitsModule() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ["admin_ex"],
    queryFn: () =>
      adminListExits(),
  });
  const updateExit = useMutation({
    mutationFn: adminUpdateExit,
    onSuccess: () => {
      toast.success("Exit request updated.");
      queryClient.invalidateQueries();
    },
    onError: notifyError,
  });

  if (error) return <ErrorPanel error={error} />;

  return (
    <DashCard
      title="Exit requests"
      description="Investor requests to sell tokens back to the market."
      noPadding
    >
      <TableShell
        min={840}
        head={
          <>
            <Th>Investor</Th>
            <Th>Property</Th>
            <Th>Tokens</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th>Update</Th>
          </>
        }
      >
        {(data?.exits ?? []).map((exitRequest) => (
          <tr key={exitRequest.id} className="border-b border-slate-50 last:border-0">
            <Td>
              <div className="font-medium text-navy">
                {exitRequest.investor_profile?.full_name ?? "Investor"}
              </div>
              <div className="text-xs text-slate-500">{exitRequest.investor_profile?.email}</div>
            </Td>
            <Td className="text-slate-600">{exitRequest.tokenized_properties?.name}</Td>
            <Td className="text-navy">{exitRequest.tokens_to_sell}</Td>
            <Td className="tabular-nums text-navy">{fmtNGN(exitRequest.asking_price)}</Td>
            <Td>
              <StatusBadge
                status={exitRequest.status}
                label={EXIT_STATUS_LABEL[exitRequest.status]}
              />
            </Td>
            <Td>
              <Select
                value={exitRequest.status}
                onValueChange={(status: ExitStatus) => {
                  if (status === exitRequest.status) return;
                  let notes: string | undefined;
                  if (status === "rejected" || status === "cancelled") {
                    const response = window.prompt("Reason for this status change?");
                    if (!response?.trim()) return;
                    notes = response;
                  }
                  updateExit.mutate({ data: { id: exitRequest.id, status, notes } });
                }}
              >
                <SelectTrigger className="h-8 w-44 text-xs" aria-label="Update status">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  {exitStatusEntries.map(([status, label]) => (
                    <SelectItem
                      key={status}
                      value={status}
                      disabled={
                        status === "completed" ||
                        (status !== exitRequest.status &&
                          !exitTransitions[exitRequest.status].includes(status))
                      }
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 max-w-44 text-[10px] text-slate-400">
                Completion requires the ownership-transfer workflow.
              </p>
            </Td>
          </tr>
        ))}
      </TableShell>
      {(data?.exits ?? []).length === 0 && <EmptyState icon={Coins} title="No exit requests" />}
    </DashCard>
  );
}
