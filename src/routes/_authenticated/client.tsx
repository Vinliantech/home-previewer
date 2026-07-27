import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LogOut,
  Home,
  Sparkles,
  Phone,
  Calendar,
  Wallet,
  FileText,
  ShieldCheck,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { clientNumber } from "@/lib/client-number";

export const Route = createFileRoute("/_authenticated/client")({
  head: () => ({ meta: [{ title: "Members Lounge — Kay-Steph Group" }] }),
  component: ClientDashboard,
});

type Profile = {
  full_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  id_verification_status: string | null;
  created_at?: string | null;
  client_number?: number | null;
  id_rejection_reason?: string | null;
};

type TabKey = "overview" | "reservations" | "payments" | "documents" | "concierge";

const NAV: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: Sparkles },
  { key: "reservations", label: "Reservations", icon: Calendar },
  { key: "payments", label: "Payments", icon: Wallet },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "concierge", label: "Concierge", icon: Phone },
];

function ClientDashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");

  const refresh = useCallback(async () => {
    const sb = supabase as any;
    const [profileResult, reservationResult, planResult, documentResult] = await Promise.all([
      sb
        .from("profiles")
        .select(
          "full_name,email,phone,address,id_verification_status,created_at,client_number,id_rejection_reason",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      sb
        .from("reservations")
        .select("*, plots(plot_number, size_sqm, estates(name, location))")
        .eq("client_user_id", user.id)
        .order("created_at", { ascending: false }),
      sb
        .from("payment_requirements")
        .select(
          "*, available_properties(property_name, location), group_pools(name, property_name)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      sb
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setProfile(profileResult.data as Profile | null);
    setReservations(reservationResult.data ?? []);
    setPlans(planResult.data ?? []);
    setDocuments(documentResult.data ?? []);
  }, [user.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const firstName = (profile?.full_name || user.email || "Member").split(" ")[0];
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear();
  // Was derived from the user UUID, which looked official but was not the
  // number on their paperwork. profiles.client_number is the real one.
  const memberNo = clientNumber(profile?.client_number);
  const totalInvested = plans.reduce((sum, plan) => sum + Number(plan.amount_paid ?? 0), 0);
  const nextPlan = plans
    .filter((plan) => plan.next_due_date && Number(plan.amount_paid) < Number(plan.amount_required))
    .sort((a, b) => String(a.next_due_date).localeCompare(String(b.next_due_date)))[0];

  return (
    <div className="min-h-screen bg-[#0a0e2a] text-white">
      {/* Top bar */}
      <header className="border-b border-white/5 bg-black/30 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="font-serif text-xl tracking-wide text-[#f5f0e6]"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Kay-Steph
            </div>
            <span className="rounded-full border border-[#d4a53a]/40 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.3em] text-[#d4a53a]">
              Members
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white/70 hover:border-[#d4a53a] hover:text-[#d4a53a] sm:inline-flex"
            >
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <Button
              onClick={signOut}
              variant="ghost"
              className="text-white/80 hover:bg-white/5 hover:text-[#d4a53a]"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(1200px 400px at 20% 0%, rgba(212,165,58,0.18), transparent 60%), radial-gradient(900px 500px at 80% 100%, rgba(60,80,200,0.25), transparent 60%)",
          }}
        />
        <div className="container relative mx-auto px-6 py-16 md:py-20">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#d4a53a]">
            Member since {memberSince} · {memberNo}
          </p>
          <h1
            className="mt-4 font-serif text-4xl leading-tight text-[#f5f0e6] md:text-6xl"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/60 md:text-base">
            Your private lounge for reservations, allocations and concierge care.
          </p>
          <div className="mt-6 h-px w-24 bg-[#d4a53a]" />
        </div>
      </section>

      {/* KPI strip */}
      <section className="container mx-auto grid grid-cols-2 gap-3 px-6 py-8 md:grid-cols-4 md:gap-4">
        <Kpi
          label="Active Reservations"
          value={String(reservations.filter((item) => !["cancelled"].includes(item.status)).length)}
          hint="Plots currently linked"
        />
        <Kpi label="Total Invested" value={money(totalInvested)} hint="Across all active plans" />
        <Kpi
          label="Next Payment"
          value={nextPlan ? shortDate(nextPlan.next_due_date) : "—"}
          hint={
            nextPlan
              ? money(Number(nextPlan.amount_required) - Number(nextPlan.amount_paid)) +
                " outstanding"
              : "No schedule set"
          }
        />
        <Kpi label="Documents" value={String(documents.length)} hint="Contracts & receipts" />
      </section>

      {/* Body: side rail + content */}
      <section className="container mx-auto grid gap-8 px-6 pb-20 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-6 md:self-start">
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
            {NAV.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`group flex items-center gap-3 whitespace-nowrap border-l-2 px-4 py-3 text-left text-sm transition-all ${
                    active
                      ? "border-[#d4a53a] bg-white/[0.04] text-[#f5f0e6]"
                      : "border-transparent text-white/50 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${active ? "text-[#d4a53a]" : ""}`} />
                  <span className="uppercase tracking-[0.15em]">{item.label}</span>
                  {active && (
                    <ChevronRight className="ml-auto hidden h-4 w-4 text-[#d4a53a] md:block" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          {tab === "overview" && (
            <>
              <VipCard
                eyebrow="Profile"
                title="Your account"
                subtitle="Verify details to unlock allocations"
              >
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm md:grid-cols-2">
                  <Row label="Name" value={profile?.full_name || "—"} />
                  <Row label="Email" value={profile?.email || user.email || "—"} />
                  <Row label="Phone" value={profile?.phone || "—"} />
                  <Row label="Address" value={profile?.address || "—"} />
                  <Row
                    label="ID Verification"
                    value={
                      <span className="inline-flex items-center gap-1.5 text-[#d4a53a]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {profile?.id_verification_status || "pending"}
                      </span>
                    }
                  />
                  {profile?.id_verification_status === "rejected" &&
                  profile?.id_rejection_reason ? (
                    <p className="pt-1 text-xs leading-5 text-rose-300">
                      {profile.id_rejection_reason}
                    </p>
                  ) : null}
                </dl>
              </VipCard>

              <VipCard
                eyebrow="Concierge"
                title="Your Relationship Manager"
                subtitle="Direct line to your Kay-Steph advisor"
              >
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d4a53a]/40 bg-[#d4a53a]/10 text-lg font-medium text-[#d4a53a]">
                    KS
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-serif text-xl text-[#f5f0e6]"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      Concierge Desk
                    </p>
                    <p className="text-sm text-white/60">Mon–Sat · 9am – 7pm WAT</p>
                  </div>
                  <Button className="h-11 rounded-none bg-[#d4a53a] px-6 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:bg-[#c39a34]">
                    <Phone className="mr-2 h-3.5 w-3.5" /> Request Callback
                  </Button>
                </div>
              </VipCard>
            </>
          )}

          {tab === "reservations" && (
            <VipCard eyebrow="Portfolio" title="Reservations" subtitle="Plots you have secured">
              {reservations.length ? (
                <div className="space-y-3">
                  {reservations.map((item) => (
                    <PortalRecord
                      key={item.id}
                      title={
                        item.plots?.estates?.name ?? item.property_type ?? "Property reservation"
                      }
                      meta={
                        item.plots?.plot_number
                          ? `Plot ${item.plots.plot_number} · ${item.plots.estates?.location ?? "Abuja"}`
                          : (item.plot_size ?? "Plot selection pending")
                      }
                      status={item.status}
                      extra={
                        item.reserved_until
                          ? `Held until ${shortDate(item.reserved_until)}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No reservations yet"
                  body="Browse the estates and reserve your plot — it will appear here instantly."
                  cta={
                    <Link
                      to="/"
                      className="mt-6 inline-flex h-11 items-center border border-[#d4a53a] px-6 text-xs font-semibold uppercase tracking-[0.25em] text-[#d4a53a] hover:bg-[#d4a53a] hover:text-black"
                    >
                      Explore Estates
                    </Link>
                  }
                />
              )}
            </VipCard>
          )}

          {tab === "payments" && (
            <VipCard
              eyebrow="Ledger"
              title="Payments"
              subtitle="Deposits, instalments and receipts"
            >
              {plans.length ? (
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <PortalRecord
                      key={plan.id}
                      title={
                        plan.available_properties?.property_name ??
                        plan.group_pools?.name ??
                        plan.payment_category
                      }
                      meta={`${String(plan.purchase_model ?? "full_purchase").replace(/_/g, " ")} · ${plan.term_months ?? 3} months`}
                      status={plan.status}
                      extra={`${money(plan.amount_paid)} paid of ${money(plan.amount_required)}${plan.next_due_date ? ` · next ${shortDate(plan.next_due_date)}` : ""}`}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No payments recorded"
                  body="Your ledger will populate here once a reservation is confirmed."
                />
              )}
            </VipCard>
          )}

          {tab === "documents" && (
            <VipCard eyebrow="Vault" title="Documents" subtitle="Contracts, IDs and receipts">
              <DocumentUpload userId={user.id} onUploaded={refresh} />
              {documents.length ? (
                <div className="mt-6 space-y-3">
                  {documents.map((document) => (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => openClientDocument(document)}
                      className="block w-full border border-white/10 p-4 text-left transition hover:border-[#d4a53a]/60"
                    >
                      <p className="text-sm font-semibold text-[#f5f0e6]">{document.file_name}</p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-white/40">
                        {document.document_type} ·{" "}
                        <DocumentStatus status={document.approval_status} />
                      </p>
                      {document.approval_status === "rejected" && document.rejection_reason && (
                        <p className="mt-2 text-xs leading-5 text-rose-300">
                          {document.rejection_reason} — please upload a replacement.
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Vault is empty"
                  body="Signed contracts and receipts will be stored privately here."
                />
              )}
            </VipCard>
          )}

          {tab === "concierge" && (
            <VipCard eyebrow="Care" title="Concierge" subtitle="Open a private request">
              <EmptyState
                icon={Phone}
                title="Ticketing coming soon"
                body="In the meantime, contact your relationship manager directly."
              />
            </VipCard>
          )}
        </div>
      </section>
    </div>
  );
}

const DOCUMENT_KINDS = [
  { value: "receipt", label: "Payment receipt" },
  { value: "identification", label: "Identification" },
  { value: "proof_of_address", label: "Proof of address" },
  { value: "contract", label: "Signed contract" },
  { value: "other", label: "Other document" },
] as const;

/**
 * The bucket is private, so nothing here can be linked to directly. Rows store
 * the storage path and a short-lived signed URL is minted per click — the same
 * convention the investor KYC and payment-evidence screens use.
 */
async function openClientDocument(document: {
  storage_path?: string | null;
  file_url?: string | null;
}) {
  const reference = document.storage_path || document.file_url;
  if (!reference) return toast.error("This document has no file attached.");

  if (/^https?:\/\//i.test(reference)) {
    window.open(reference, "_blank", "noopener,noreferrer");
    return;
  }

  const { data, error } = await supabase.storage
    .from("client-documents")
    .createSignedUrl(reference, 60);
  if (error || !data) return toast.error("That document could not be opened.");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

function DocumentStatus({ status }: { status: string | null }) {
  const value = status ?? "pending";
  const tone =
    value === "approved"
      ? "text-emerald-300"
      : value === "rejected"
        ? "text-rose-300"
        : "text-amber-300";
  return <span className={tone}>{value}</span>;
}

function DocumentUpload({ userId, onUploaded }: { userId: string; onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<string>("receipt");
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      // First path segment must be the owner's id — the storage policy keys on it.
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(path, file);
      if (uploadError) throw uploadError;

      // approval_status is deliberately not sent: the database forces every
      // client upload to 'pending' regardless of what the browser claims.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- storage_path enters the generated types after the migration runs.
      const { error: rowError } = await (supabase as any).from("documents").insert({
        user_id: userId,
        document_type: kind,
        file_name: file.name,
        file_url: path,
        storage_path: path,
      });
      if (rowError) throw rowError;

      toast.success("Uploaded — Kay-Steph will review it shortly.");
      onUploaded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-semibold text-[#f5f0e6]">Upload a document</p>
      <p className="mt-1 text-xs leading-5 text-white/50">
        Payment receipts, identification or anything Kay-Steph has asked you for. It stays private
        to your account and is checked before it is marked approved.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          aria-label="Document type"
          className="h-10 border border-white/15 bg-[#0a0e2a] px-3 text-sm text-white/80"
        >
          {DOCUMENT_KINDS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          aria-label="Choose a file to upload"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          className="text-xs text-white/60 file:mr-3 file:border file:border-[#d4a53a]/40 file:bg-transparent file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-[#d4a53a]"
        />
        {busy && (
          <span className="inline-flex items-center gap-2 text-xs text-white/60">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading
          </span>
        )}
      </div>
    </div>
  );
}

function money(value: number | string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function PortalRecord({
  title,
  meta,
  status,
  extra,
}: {
  title: string;
  meta: string;
  status: string;
  extra?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-[#f5f0e6]">{title}</p>
        <p className="mt-1 text-sm capitalize text-white/50">{meta}</p>
        {extra && <p className="mt-1 text-xs text-[#d4a53a]">{extra}</p>}
      </div>
      <span className="self-start border border-[#d4a53a]/30 px-3 py-1 text-[10px] uppercase tracking-widest text-[#d4a53a] sm:self-auto">
        {String(status).replace(/_/g, " ")}
      </span>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function VipCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative border border-white/8 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-8"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a53a]/40 to-transparent" />
      <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-[#d4a53a]">{eyebrow}</p>
      <h3
        className="mt-2 font-serif text-2xl text-[#f5f0e6] md:text-3xl"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {title}
      </h3>
      {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-white/8 bg-white/[0.02] p-4 md:p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">{label}</p>
      <p
        className="mt-2 font-serif text-2xl text-[#f5f0e6] md:text-3xl"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-white/40">{hint}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-white/5 py-2 last:border-0">
      <dt className="text-[11px] uppercase tracking-[0.2em] text-white/40">{label}</dt>
      <dd className="text-right text-white/90">{value}</dd>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#d4a53a]/30 bg-[#d4a53a]/5">
        <Icon className="h-6 w-6 text-[#d4a53a]" />
      </div>
      <p
        className="font-serif text-xl text-[#f5f0e6]"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {title}
      </p>
      <p className="mt-2 max-w-sm text-sm text-white/50">{body}</p>
      {cta}
    </div>
  );
}
