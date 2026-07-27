import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  LogOut,
  Home,
  Users,
  Building2,
  ClipboardList,
  CreditCard,
  LifeBuoy,
  Shield,
  Video,
  Database,
  Handshake,
  Wallet,
  BarChart3,
  UsersRound,
  Banknote,
  DoorOpen,
  MapPin,
  Landmark,
  FileText,
  Receipt,
  UserCog,
  ScrollText,
  Layers,
  CalendarCheck,
  TrendingUp,
  Coins,
  Newspaper,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resetClientPassword } from "@/lib/client-admin.functions";
import { adminListPools, adminReviewPool } from "@/lib/pools.functions";
import { POOL_STATUS_LABEL, poolProgressPct, type PoolStatus } from "@/lib/pools";
import { fmtNGN } from "@/lib/invest";
import { DashCard, PageHeader, StatCard } from "@/components/portfolio/kit";
import {
  AllocationsModule,
  ApplicationsModule,
  EstatesModule,
  PlotsModule,
  ReservationsModule,
} from "@/components/admin/estate-ops";
import {
  CompanyAccountsModule,
  PaymentPlansModule,
  ReceiptsModule,
} from "@/components/admin/finance-ops";
import { DocumentsModule, SupportModule, UserRolesModule } from "@/components/admin/support-ops";
import { StaffModule } from "@/components/admin/staff-ops";
import {
  TokenizedExitsModule,
  TokenizedInvestmentsModule,
  TokenizedKycModule,
  TokenizedPayoutsModule,
  TokenizedPropertiesModule,
  TokenizedRentalModule,
  TokenizedValuationsModule,
  TokenizedWithdrawalsModule,
} from "@/components/admin/tokenized-ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtNaira, fmtDate, statusPillClass, getYouTubeId } from "@/lib/affiliate";
import { clientNumber } from "@/lib/client-number";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Super Admin — Kay-Steph Group" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  beforeLoad: async ({ context }) => {
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: context.user.id });
    if (!isAdmin) throw redirect({ to: "/admin/auth" });
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { tab: initialTab } = Route.useSearch();
  const [section, setSection] = useState(initialTab ?? "overview");
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [editClient, setEditClient] = useState<any | null>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [estateSummary, setEstateSummary] = useState<any>(null);

  const loadAll = useCallback(async () => {
    const sb = supabase as any;
    const [sumRes, affRes, leadRes, commRes, payRes, vidRes, cliRes, staffRes] = await Promise.all([
      sb.rpc("get_admin_summary"),
      sb
        .from("affiliate_profiles")
        .select("*, supervisor:staff_members!affiliate_profiles_supervisor_staff_id_fkey(id, full_name, position, department, status)")
        .order("created_at", { ascending: false }),
      sb
        .from("client_leads")
        .select("*, affiliate_profiles(full_name, affiliate_code)")
        .order("submission_date", { ascending: false }),
      sb
        .from("commissions")
        .select("*, affiliate_profiles(full_name, affiliate_code)")
        .order("created_at", { ascending: false }),
      sb
        .from("payout_requests")
        .select(
          "*, affiliate_profiles(full_name, affiliate_code, bank_name, account_name, account_number)",
        )
        .order("requested_at", { ascending: false }),
      sb.from("training_videos").select("*").order("created_at", { ascending: false }),
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("staff_members").select("id, full_name, position, department, status").order("full_name"),
    ]);
    if (sumRes.data && sumRes.data[0]) setSummary(sumRes.data[0]);
    if (affRes.data) setAffiliates(affRes.data);
    if (leadRes.data) setLeads(leadRes.data);
    if (commRes.data) setCommissions(commRes.data);
    if (payRes.data) setPayouts(payRes.data);
    if (vidRes.data) setVideos(vidRes.data);
    if (cliRes.data) setClients(cliRes.data);
    if (staffRes.data) setStaff(staffRes.data);
    // Group pools are a newer feature; tolerate a missing migration gracefully.
    try {
      const pr = await adminListPools();
      setPools(pr.pools ?? []);
    } catch (err) {
      console.warn("[admin] group pools not available:", err);
    }
    // Estate-ops summary; tolerate a missing migration gracefully.
    try {
      const { data } = await (supabase as any).rpc("get_estate_ops_summary");
      if (data && data[0]) setEstateSummary(data[0]);
    } catch (err) {
      console.warn("[admin] estate operations not available:", err);
    }
  }, []);

  const reviewPool = async (id: string, approve: boolean) => {
    try {
      await adminReviewPool({ data: { pool_id: id, approve } });
      toast.success(approve ? "Pool approved and opened" : "Pool rejected");
      loadAll();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    }
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/admin/auth", replace: true });
  }

  // Affiliate actions
  /**
   * Verification is set through an RPC, not a table write: the profiles UPDATE
   * policy has no WITH CHECK, so the RPC is what actually proves the caller is
   * an admin and records the decision in the audit log.
   */
  const reviewClient = async (userId: string, decision: "approved" | "rejected") => {
    let reason: string | null = null;
    if (decision === "rejected") {
      reason =
        window.prompt("Why is this account being rejected? The client will see this.")?.trim() ||
        null;
      if (!reason) return toast.error("A rejection needs a reason the client can act on.");
    }
    const { error } = await (supabase as any).rpc("review_client_verification", {
      _user_id: userId,
      _decision: decision,
      _reason: reason,
    });
    if (error) return toast.error(error.message);
    toast.success(decision === "approved" ? "Client approved" : "Client rejected");
    loadAll();
  };
  const setAffiliateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any)
      .from("affiliate_profiles")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Affiliate ${status}`);
    loadAll();
  };
  const setAffiliateRate = async (id: string, rate: number) => {
    const { error } = await (supabase as any)
      .from("affiliate_profiles")
      .update({ commission_rate: rate })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rate updated");
    loadAll();
  };
  const setAffiliateSupervisor = async (id: string, staffId: string | null) => {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("affiliate_profiles")
      .update({
        supervisor_staff_id: staffId,
        supervisor_assigned_at: staffId ? new Date().toISOString() : null,
        supervisor_assigned_by: staffId ? auth.user?.id ?? null : null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(staffId ? "Supervisor assigned" : "Supervisor removed");
    loadAll();
  };
  const setLeadStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("client_leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    loadAll();
  };
  const createCommission = async (lead: any) => {
    const saleStr = window.prompt(`Sale amount (₦) for ${lead.client_full_name}:`);
    if (!saleStr) return;
    const sale = Number(saleStr.replace(/[^\d.]/g, ""));
    if (!sale || sale <= 0) return toast.error("Invalid amount");
    const aff = affiliates.find((a) => a.id === lead.affiliate_id);
    const rate = aff?.commission_rate ?? 5;
    const amount = (sale * rate) / 100;
    const { error } = await (supabase as any).from("commissions").insert({
      affiliate_id: lead.affiliate_id,
      client_lead_id: lead.id,
      sale_amount: sale,
      commission_rate: rate,
      commission_amount: amount,
      status: "pending",
    });
    if (error) return toast.error(error.message);
    await (supabase as any).from("client_leads").update({ status: "closed" }).eq("id", lead.id);
    toast.success("Commission created");
    loadAll();
  };
  const setCommissionStatus = async (
    id: string,
    status: "pending" | "approved" | "paid" | "rejected",
  ) => {
    const patch: any = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await (supabase as any).from("commissions").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Commission ${status}`);
    loadAll();
  };
  const setPayoutStatus = async (
    id: string,
    status: "pending" | "processing" | "completed" | "rejected",
  ) => {
    const patch: any = { status };
    if (status === "completed") patch.processed_at = new Date().toISOString();
    const { error } = await (supabase as any).from("payout_requests").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Payout ${status}`);
    loadAll();
  };

  async function backup() {
    const sb = supabase as any;
    toast.info("Building backup…");
    const tables = [
      "affiliate_profiles",
      "client_leads",
      "commissions",
      "payout_requests",
      "available_properties",
      "training_videos",
      "user_roles",
      "profiles",
    ];
    const out: Record<string, any> = { generated_at: new Date().toISOString() };
    for (const t of tables) {
      const { data } = await sb.from(t).select("*");
      out[t] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kay-steph-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800">
      <Tabs
        value={section}
        onValueChange={setSection}
        activationMode="manual"
        orientation="vertical"
        className="min-h-screen"
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-gold">
                <Shield className="h-4.5 w-4.5" />
              </span>
              <span className="leading-tight">
                <span className="block font-serif text-base font-bold text-navy">Kay-Steph</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Super Admin
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/content"
                className="hidden items-center gap-2 rounded-full border border-navy/20 px-4 py-1.5 text-sm font-medium text-navy hover:border-gold hover:text-gold lg:inline-flex"
              >
                <Newspaper className="h-4 w-4" /> Blog & Content
              </Link>
              <Link
                to="/crm"
                className="hidden items-center gap-2 rounded-full border border-navy/20 px-4 py-1.5 text-sm font-medium text-navy hover:border-gold hover:text-gold sm:inline-flex"
              >
                CRM Workspace
              </Link>
              <Link
                to="/"
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 sm:inline-flex"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-60 lg:shrink-0">
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-20 lg:p-3">
              <TabsList className="flex h-auto w-full gap-1 overflow-x-auto bg-transparent p-0 lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-visible">
                <SideItem value="overview" icon={BarChart3} label="Overview" />

                <SideGroup label="Sales" />
                <SideItem value="estates" icon={Building2} label="Estates" />
                <SideItem value="plots" icon={MapPin} label="Plots" />
                <SideItem value="allocations" icon={Landmark} label="Allocations" />
                <SideItem value="applications" icon={FileText} label="Applications" />
                <SideItem value="reservations" icon={CalendarCheck} label="Reservations" />

                <SideGroup label="Finance" />
                <SideItem value="receipts" icon={Receipt} label="Pending Receipts" />
                <SideItem value="requirements" icon={ScrollText} label="Payment Plans" />
                <SideItem value="accounts" icon={Landmark} label="Company Accounts" />
                <SideItem
                  value="commissions"
                  icon={CreditCard}
                  label="Commissions"
                  count={commissions.length}
                />
                <SideItem value="payouts" icon={Wallet} label="Payouts" count={payouts.length} />

                <SideGroup label="Investors" />
                <SideItem value="clients" icon={Users} label="Clients" count={clients.length} />
                <SideItem
                  value="pools"
                  icon={UsersRound}
                  label="Group Pools"
                  count={pools.length}
                />

                <SideGroup label="Property Investments" />
                <SideItem value="tk-investments" icon={Coins} label="Investments" />
                <SideItem value="tk-kyc" icon={Shield} label="Investor KYC" />
                <SideItem value="tk-properties" icon={Building2} label="Properties" />
                <SideItem value="tk-valuations" icon={TrendingUp} label="Valuations" />
                <SideItem value="tk-rental" icon={Banknote} label="Rental Income" />
                <SideItem value="tk-payouts" icon={Wallet} label="Rental Payouts" />
                <SideItem value="tk-withdrawals" icon={CreditCard} label="Withdrawals" />
                <SideItem value="tk-exits" icon={DoorOpen} label="Exit Requests" />

                <SideGroup label="Growth" />
                <SideItem
                  value="affiliates"
                  icon={Handshake}
                  label="Affiliates"
                  count={affiliates.length}
                />
                <SideItem value="leads" icon={ClipboardList} label="Leads" count={leads.length} />
                <SideItem value="training" icon={Video} label="Training" count={videos.length} />

                <SideGroup label="People & System" />
                <SideItem value="staff" icon={UsersRound} label="Staff" />
                <SideItem value="roles" icon={UserCog} label="User Roles" />
                <SideItem value="support" icon={LifeBuoy} label="Support Tickets" />
                <SideItem value="documents" icon={Layers} label="Documents" />
                <SideItem value="backup" icon={Database} label="Data Backup" />
              </TabsList>

              {/* Separate admin apps (full pages, not in-page tabs) */}
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="hidden px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:block">
                  Platforms
                </div>
                <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
                  <Link
                    to="/crm"
                    className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy lg:w-full"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="flex-1 text-left">CRM Workspace</span>
                  </Link>
                  <Link
                    to="/content"
                    className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy lg:w-full"
                  >
                    <Newspaper className="h-4 w-4" />
                    <span className="flex-1 text-left">Blog & Content</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1 space-y-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <PageHeader
                title="Control Centre"
                description="Live view across estate sales, finance, investors and growth."
              />

              {/* Estate operations */}
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Estate operations
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    icon={Building2}
                    label="Estates"
                    value={String(estateSummary?.total_estates ?? 0)}
                  />
                  <StatCard
                    icon={MapPin}
                    label="Plots"
                    value={String(estateSummary?.total_plots ?? 0)}
                    sub={`${estateSummary?.available_plots ?? 0} available · ${estateSummary?.allocated_plots ?? 0} allocated`}
                  />
                  <StatCard
                    icon={CalendarCheck}
                    label="Reservations"
                    value={String(estateSummary?.total_reservations ?? 0)}
                    sub={`${estateSummary?.pending_reservations ?? 0} pending`}
                    subTone={estateSummary?.pending_reservations ? "negative" : "neutral"}
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Revenue (confirmed)"
                    value={fmtNGN(estateSummary?.total_revenue ?? 0)}
                  />
                </div>
              </div>

              {/* Action queue */}
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Needs attention
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    icon={FileText}
                    label="Applications"
                    value={String(estateSummary?.pending_applications ?? 0)}
                    sub="pending review"
                    subTone={estateSummary?.pending_applications ? "negative" : "neutral"}
                  />
                  <StatCard
                    icon={Receipt}
                    label="Receipts"
                    value={String(estateSummary?.pending_receipts ?? 0)}
                    sub="awaiting approval"
                    subTone={estateSummary?.pending_receipts ? "negative" : "neutral"}
                  />
                  <StatCard
                    icon={CreditCard}
                    label="Commissions"
                    value={fmtNaira(summary?.pending_commissions_amount ?? 0)}
                    sub={`${summary?.pending_commissions_count ?? 0} pending`}
                  />
                  <StatCard
                    icon={Wallet}
                    label="Payouts"
                    value={fmtNaira(summary?.pending_payouts_amount ?? 0)}
                    sub={`${summary?.pending_payouts_count ?? 0} pending`}
                    subTone={summary?.pending_payouts_count ? "negative" : "neutral"}
                  />
                </div>
              </div>

              {/* Growth & investors */}
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Growth & investors
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    icon={Handshake}
                    label="Affiliates"
                    value={String(summary?.total_affiliates ?? affiliates.length)}
                    sub={`${summary?.pending_affiliates ?? 0} pending approval`}
                  />
                  <StatCard
                    icon={ClipboardList}
                    label="Leads"
                    value={String(summary?.total_leads ?? leads.length)}
                  />
                  <StatCard
                    icon={Users}
                    label="Registered clients"
                    value={String(clients.length)}
                  />
                  <StatCard icon={UsersRound} label="Group pools" value={String(pools.length)} />
                </div>
              </div>

              <DashCard title="Getting around">
                <p className="text-sm leading-6 text-slate-500">
                  Use the sidebar to move between sections. <b>Sales</b> covers estates, plots,
                  allocations, applications and reservations. <b>Finance</b> handles receipts,
                  payment plans, company accounts, commissions and payouts.{" "}
                  <b>Support &amp; System</b> holds tickets, documents, roles and the full data
                  backup.
                </p>
              </DashCard>
            </TabsContent>

            <TabsContent value="affiliates">
              <Card className="border-gold/30">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Staff supervisor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs text-gold">
                            {a.affiliate_code}
                          </TableCell>
                          <TableCell className="font-medium">{a.full_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.email}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {a.phone || "—"}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              defaultValue={a.commission_rate}
                              className="w-20"
                              onBlur={(e) => {
                                const v = Number(e.target.value);
                                if (v !== a.commission_rate) setAffiliateRate(a.id, v);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={a.supervisor_staff_id ?? "__unassigned__"}
                              onValueChange={(value) =>
                                setAffiliateSupervisor(
                                  a.id,
                                  value === "__unassigned__" ? null : value,
                                )
                              }
                            >
                              <SelectTrigger className="h-9 min-w-48" aria-label="Affiliate supervisor">
                                <SelectValue placeholder="Assign staff" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* A live affiliate must keep a supervisor —
                                    the database rejects clearing it — so the
                                    option is only offered before approval. */}
                                {a.status !== "active" && (
                                  <SelectItem value="__unassigned__">Not assigned</SelectItem>
                                )}
                                {staff
                                  .filter((member) => member.status === "active")
                                  .map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.full_name}
                                      {member.position ? ` — ${member.position}` : ""}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <span className={statusPillClass(a.status)}>{a.status}</span>
                          </TableCell>
                          <TableCell className="space-x-2 whitespace-nowrap">
                            {a.status !== "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!a.supervisor_staff_id}
                                title={
                                  a.supervisor_staff_id
                                    ? undefined
                                    : "Assign a staff supervisor first"
                                }
                                onClick={() => setAffiliateStatus(a.id, "active")}
                              >
                                Approve
                              </Button>
                            )}
                            {a.status !== "active" && !a.supervisor_staff_id && (
                              <span className="text-xs text-muted-foreground">
                                Assign a supervisor to approve
                              </span>
                            )}
                            {a.status !== "suspended" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => setAffiliateStatus(a.id, "suspended")}
                              >
                                Suspend
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!affiliates.length && (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No affiliates yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads">
              <Card className="border-gold/30">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>{fmtDate(l.submission_date)}</TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-navy">
                              {l.affiliate_profiles?.full_name || "—"}
                            </div>
                            <div className="text-gold">{l.affiliate_profiles?.affiliate_code}</div>
                          </TableCell>
                          <TableCell className="font-medium">{l.client_full_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {l.client_email}
                            <br />
                            {l.client_phone}
                          </TableCell>
                          <TableCell>{l.property_of_interest || "—"}</TableCell>
                          <TableCell>
                            <span className={statusPillClass(l.status)}>{l.status}</span>
                          </TableCell>
                          <TableCell className="space-x-2 whitespace-nowrap">
                            {l.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLeadStatus(l.id, "contacted")}
                              >
                                Mark contacted
                              </Button>
                            )}
                            {l.status !== "closed" && (
                              <Button
                                size="sm"
                                className="bg-gold text-gold-foreground hover:bg-gold/90"
                                onClick={() => createCommission(l)}
                              >
                                Convert → sale
                              </Button>
                            )}
                            {l.status !== "lost" && l.status !== "closed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => setLeadStatus(l.id, "lost")}
                              >
                                Lost
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!leads.length && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No leads yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions">
              <Card className="border-gold/30">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sale date</TableHead>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Sale</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{fmtDate(c.sale_date)}</TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-navy">
                              {c.affiliate_profiles?.full_name || "—"}
                            </div>
                            <div className="text-gold">{c.affiliate_profiles?.affiliate_code}</div>
                          </TableCell>
                          <TableCell>{fmtNaira(c.sale_amount)}</TableCell>
                          <TableCell className="font-medium text-navy">
                            {fmtNaira(c.commission_amount)}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({c.commission_rate}%)
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={statusPillClass(c.status)}>{c.status}</span>
                          </TableCell>
                          <TableCell className="space-x-2 whitespace-nowrap">
                            {c.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCommissionStatus(c.id, "approved")}
                              >
                                Approve
                              </Button>
                            )}
                            {c.status === "approved" && (
                              <Button
                                size="sm"
                                className="bg-gold text-gold-foreground"
                                onClick={() => setCommissionStatus(c.id, "paid")}
                              >
                                Mark paid
                              </Button>
                            )}
                            {c.status !== "rejected" && c.status !== "paid" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => setCommissionStatus(c.id, "rejected")}
                              >
                                Reject
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!commissions.length && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No commissions yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts">
              <Card className="border-gold/30">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requested</TableHead>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{fmtDate(p.requested_at)}</TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-navy">
                              {p.affiliate_profiles?.full_name}
                            </div>
                            <div className="text-gold">{p.affiliate_profiles?.affiliate_code}</div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {fmtNaira(p.requested_amount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {p.affiliate_profiles?.bank_name || "—"}
                            <br />
                            {p.affiliate_profiles?.account_name || ""}
                            <br />
                            {p.affiliate_profiles?.account_number || ""}
                          </TableCell>
                          <TableCell>
                            <span className={statusPillClass(p.status)}>{p.status}</span>
                          </TableCell>
                          <TableCell className="space-x-2 whitespace-nowrap">
                            {p.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPayoutStatus(p.id, "processing")}
                              >
                                Processing
                              </Button>
                            )}
                            {p.status !== "completed" && p.status !== "rejected" && (
                              <Button
                                size="sm"
                                className="bg-gold text-gold-foreground"
                                onClick={() => setPayoutStatus(p.id, "completed")}
                              >
                                Mark paid
                              </Button>
                            )}
                            {p.status !== "rejected" && p.status !== "completed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => setPayoutStatus(p.id, "rejected")}
                              >
                                Reject
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!payouts.length && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No payout requests yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training">
              <TrainingAdmin videos={videos} reload={loadAll} />
            </TabsContent>

            <TabsContent value="clients">
              <Card className="border-gold/30">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registered</TableHead>
                        <TableHead>Client no.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>ID status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{fmtDate(c.created_at)}</TableCell>
                          <TableCell className="font-mono text-xs text-navy">
                            {clientNumber(c.client_number)}
                          </TableCell>
                          <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.phone || "—"}
                          </TableCell>
                          <TableCell>
                            <span className={statusPillClass(c.id_verification_status)}>
                              {c.id_verification_status || "pending"}
                            </span>
                            {c.id_verification_status === "rejected" && c.id_rejection_reason ? (
                              <p className="mt-1 max-w-56 text-xs text-red-600">
                                {c.id_rejection_reason}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="space-x-1 whitespace-nowrap">
                            {c.id_verification_status !== "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reviewClient(c.user_id, "approved")}
                              >
                                Approve
                              </Button>
                            )}
                            {c.id_verification_status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => reviewClient(c.user_id, "rejected")}
                              >
                                Reject
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditClient(c);
                              }}
                            >
                              View details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!clients.length && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No client accounts yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <ClientEditDialog
                client={editClient}
                onClose={() => setEditClient(null)}
                onSaved={loadAll}
              />
            </TabsContent>

            <TabsContent value="pools">
              <Card className="border-gold/30">
                <CardHeader>
                  <CardTitle className="font-serif text-navy">Group buy pools</CardTitle>
                  <CardDescription>
                    Approve new pools to open them for members. Approving sets the pool status to
                    Open; rejecting closes it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pool</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Committed / target</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pools.map((p) => {
                        const pct = poolProgressPct(
                          Number(p.summary?.committed ?? 0),
                          Number(p.target_amount),
                        );
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {p.property_name ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs capitalize text-muted-foreground">
                              {p.visibility}
                            </TableCell>
                            <TableCell className="text-xs">
                              {fmtNaira(p.summary?.committed ?? 0)} / {fmtNaira(p.target_amount)}
                              <span className="ml-1 text-muted-foreground">({pct}%)</span>
                            </TableCell>
                            <TableCell>{p.summary?.members ?? 0}</TableCell>
                            <TableCell>
                              <span className={statusPillClass(p.status)}>
                                {POOL_STATUS_LABEL[p.status as PoolStatus] ?? p.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {p.status === "pending_approval" ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    onClick={() => reviewPool(p.id, true)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => reviewPool(p.id, false)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {!pools.length && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No pools yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estates" className="mt-0">
              <EstatesModule />
            </TabsContent>

            <TabsContent value="support" className="mt-0">
              <SupportModule />
            </TabsContent>

            <TabsContent value="backup">
              <Card className="border-gold/30">
                <CardHeader>
                  <CardTitle className="font-serif text-navy">Download full backup</CardTitle>
                  <CardDescription>
                    Exports every table (affiliates, leads, commissions, payouts, properties,
                    training, clients, roles) as a single JSON file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={backup} className="bg-navy text-white hover:bg-navy/90">
                    <Database className="mr-2 h-4 w-4" /> Download JSON backup
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Store the file safely — anyone with it can restore your data.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="plots" className="mt-0">
              <PlotsModule />
            </TabsContent>
            <TabsContent value="allocations" className="mt-0">
              <AllocationsModule />
            </TabsContent>
            <TabsContent value="applications" className="mt-0">
              <ApplicationsModule />
            </TabsContent>
            <TabsContent value="reservations" className="mt-0">
              <ReservationsModule />
            </TabsContent>
            <TabsContent value="receipts" className="mt-0">
              <ReceiptsModule />
            </TabsContent>
            <TabsContent value="requirements" className="mt-0">
              <PaymentPlansModule />
            </TabsContent>
            <TabsContent value="accounts" className="mt-0">
              <CompanyAccountsModule />
            </TabsContent>
            <TabsContent value="tk-investments" className="mt-0">
              <TokenizedInvestmentsModule />
            </TabsContent>
            <TabsContent value="tk-kyc" className="mt-0">
              <TokenizedKycModule />
            </TabsContent>
            <TabsContent value="tk-properties" className="mt-0">
              <TokenizedPropertiesModule />
            </TabsContent>
            <TabsContent value="tk-valuations" className="mt-0">
              <TokenizedValuationsModule />
            </TabsContent>
            <TabsContent value="tk-rental" className="mt-0">
              <TokenizedRentalModule />
            </TabsContent>
            <TabsContent value="tk-payouts" className="mt-0">
              <TokenizedPayoutsModule />
            </TabsContent>
            <TabsContent value="tk-withdrawals" className="mt-0">
              <TokenizedWithdrawalsModule />
            </TabsContent>
            <TabsContent value="tk-exits" className="mt-0">
              <TokenizedExitsModule />
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <DocumentsModule />
            </TabsContent>
            <TabsContent value="staff" className="mt-0 space-y-6">
              <PageHeader
                title="Staff"
                description="The people behind Kay-Steph: their position, department and platform access."
              />
              <StaffModule />
            </TabsContent>

            <TabsContent value="roles" className="mt-0">
              <UserRolesModule />
            </TabsContent>
          </main>
        </div>
      </Tabs>
    </div>
  );
}

function SideGroup({ label }: { label: string }) {
  return (
    <div className="mt-3 hidden px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 first:mt-0 lg:block">
      {label}
    </div>
  );
}

function SideItem({
  value,
  icon: Icon,
  label,
  count,
}: {
  value: string;
  icon: typeof Home;
  label: string;
  count?: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className="shrink-0 justify-start gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-none lg:w-full"
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}

function PlaceholderTab({ value, title }: { value: string; title: string }) {
  return (
    <TabsContent value={value} className="mt-0">
      <DashCard title={title}>
        <p className="text-sm leading-6 text-slate-500">
          This module is being wired into the bank-UI admin. The database is ready — the interface
          arrives in the next build phase.
        </p>
      </DashCard>
    </TabsContent>
  );
}

function TrainingAdmin({ videos, reload }: { videos: any[]; reload: () => void }) {
  const [form, setForm] = useState({
    title: "",
    youtube_url: "",
    category: "general",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.youtube_url.trim())
      return toast.error("Title and YouTube URL required");
    if (!getYouTubeId(form.youtube_url)) return toast.error("Enter a valid YouTube URL");
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("training_videos").insert({
      title: form.title.trim(),
      youtube_url: form.youtube_url.trim(),
      category: form.category.trim() || "general",
      description: form.description.trim() || null,
      created_by: user?.id,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Video added");
    setForm({ title: "", youtube_url: "", category: "general", description: "" });
    reload();
  }

  const toggle = async (id: string, is_published: boolean) => {
    const { error } = await (supabase as any)
      .from("training_videos")
      .update({ is_published: !is_published })
      .eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this video?")) return;
    const { error } = await (supabase as any).from("training_videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Video removed");
    reload();
  };

  return (
    <div className="space-y-6">
      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="font-serif text-navy">Add training video</CardTitle>
          <CardDescription>
            Paste a YouTube URL. Published videos appear in every affiliate's Training tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              placeholder="Category (e.g. sales, onboarding)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              className="md:col-span-2"
              placeholder="YouTube URL"
              value={form.youtube_url}
              onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
              required
            />
            <Textarea
              className="md:col-span-2"
              rows={2}
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Button
              type="submit"
              disabled={submitting}
              className="md:col-span-2 bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {submitting ? "Adding…" : "Add Video"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {videos.map((v) => {
          const id = getYouTubeId(v.youtube_url);
          return (
            <Card key={v.id} className="overflow-hidden border-gold/30">
              {id && (
                <div className="aspect-video bg-black">
                  <iframe
                    title={v.title}
                    src={`https://www.youtube.com/embed/${id}`}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-serif text-lg text-navy">{v.title}</CardTitle>
                <CardDescription className="text-xs uppercase tracking-widest text-gold">
                  {v.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {v.description && <p className="text-sm text-muted-foreground">{v.description}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(v.id, v.is_published)}>
                    {v.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => remove(v.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!videos.length && (
          <p className="text-sm text-muted-foreground md:col-span-2">No training videos yet.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Edits a client's account record. profiles is the source of truth for who a
 * client is: the sync_client_details trigger propagates name/phone changes to
 * the CRM lead and any affiliate-submitted record, so a correction made here
 * shows up everywhere. The login email is deliberately read-only — it is the
 * auth identity and the key those records are matched on.
 */
function ClientEditDialog({
  client,
  onClose,
  onSaved,
}: {
  client: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [related, setRelated] = useState<{
    applications: any[];
    reservations: any[];
    plans: any[];
    allocations: any[];
  }>({ applications: [], reservations: [], plans: [], allocations: [] });

  useEffect(() => {
    if (client) {
      setFullName(client.full_name ?? "");
      setPhone(client.phone ?? "");
      setAddress(client.address ?? "");
      setResetLink("");
      const sb = supabase as any;
      Promise.all([
        sb.from("client_applications").select("*").eq("email", client.email).order("created_at", { ascending: false }),
        sb.from("reservations").select("*, plots(plot_number, estates(name))").eq("email", client.email).order("created_at", { ascending: false }),
        sb.from("payment_requirements").select("*").eq("user_id", client.user_id).order("created_at", { ascending: false }),
        sb.from("plot_allocations").select("*, plots(plot_number, estates(name))").eq("user_id", client.user_id).order("allocation_date", { ascending: false }),
      ]).then(([applications, reservations, plans, allocations]) => {
        setRelated({
          applications: applications.data ?? [],
          reservations: reservations.data ?? [],
          plans: plans.data ?? [],
          allocations: allocations.data ?? [],
        });
      });
    }
  }, [client]);

  async function issuePasswordReset() {
    if (!client) return;
    setResetting(true);
    try {
      const result = await resetClientPassword({ data: { profileId: client.id } });
      setResetLink(result.resetLink);
      toast.success(
        result.emailSent
          ? `Password reset emailed to ${client.email}`
          : "Reset link created. Copy it below and send it securely to the client.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the reset link.");
    }
    setResetting(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    if (!fullName.trim()) return void toast.error("Enter the client's full name.");
    setSaving(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      })
      .eq("id", client.id);
    setSaving(false);
    if (error) return void toast.error(error.message);
    // Best-effort audit record; the update itself already succeeded.
    await (supabase as any)
      .rpc("log_admin_action", {
        _action: "client_profile_updated",
        _entity_type: "profile",
        _entity_id: client.id,
        _details: { full_name: fullName.trim(), phone: phone.trim() || null },
      })
      .then(null, () => undefined);
    toast.success("Client updated — CRM and affiliate records synced");
    onClose();
    onSaved();
  }

  return (
    <Dialog open={Boolean(client)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Client details</DialogTitle>
          <DialogDescription>
            One connected view of the account, applications, reservations, allocations and plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Full name *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">
              Email (login — read only)
            </Label>
            <Input value={client?.email ?? ""} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div><span className="block text-xs text-slate-500">Registered</span>{fmtDate(client?.created_at)}</div>
            <div><span className="block text-xs text-slate-500">ID verification</span><span className="capitalize">{client?.id_verification_status ?? "pending"}</span></div>
            <div><span className="block text-xs text-slate-500">Client ID</span><span className="font-mono text-xs">{client?.user_id?.slice(0, 12)}…</span></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-navy text-white hover:bg-navy/90">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>

        <div className="space-y-4 border-t pt-5">
          <h3 className="font-serif text-lg font-semibold text-navy">Connected records</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <RelatedBlock title={`Applications (${related.applications.length})`}>
              {related.applications.length ? related.applications.map((item) => (
                <p key={item.id}><b>{item.application_ref_no ?? "Application"}</b> · {item.payment_mode ?? "—"} · <span className="capitalize">{item.status}</span></p>
              )) : <p>No application linked.</p>}
            </RelatedBlock>
            <RelatedBlock title={`Reservations (${related.reservations.length})`}>
              {related.reservations.length ? related.reservations.map((item) => (
                <p key={item.id}><b>{item.plots?.estates?.name ?? item.property_type ?? "Property"}</b>{item.plots?.plot_number ? ` · Plot ${item.plots.plot_number}` : ""} · <span className="capitalize">{item.status}</span></p>
              )) : <p>No reservation linked.</p>}
            </RelatedBlock>
            <RelatedBlock title={`Payment plans (${related.plans.length})`}>
              {related.plans.length ? related.plans.map((item) => (
                <p key={item.id}><b>{String(item.purchase_model ?? "full_purchase").replace(/_/g, " ")}</b> · {item.term_months ?? 3} months · {fmtNGN(item.amount_paid)} / {fmtNGN(item.amount_required)}</p>
              )) : <p>No payment plan linked.</p>}
            </RelatedBlock>
            <RelatedBlock title={`Allocations (${related.allocations.length})`}>
              {related.allocations.length ? related.allocations.map((item) => (
                <p key={item.id}><b>{item.plots?.estates?.name ?? "Estate"}</b> · Plot {item.plots?.plot_number ?? "—"} · <span className="capitalize">{item.status}</span></p>
              )) : <p>No plot allocated.</p>}
            </RelatedBlock>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div>
            <h3 className="font-semibold text-navy">Account security</h3>
            <p className="text-xs leading-5 text-slate-600">Send a one-time recovery link. The admin never sees or sets the client's password.</p>
          </div>
          <Button type="button" variant="outline" onClick={issuePasswordReset} disabled={resetting}>
            {resetting ? "Creating secure link…" : "Send password reset"}
          </Button>
          {resetLink && (
            <div className="flex gap-2">
              <Input value={resetLink} readOnly aria-label="Password reset link" />
              <Button type="button" onClick={() => navigator.clipboard.writeText(resetLink).then(() => toast.success("Reset link copied"))}>Copy</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RelatedBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gold">{title}</p>
      <div className="space-y-1 text-xs leading-5 text-slate-600">{children}</div>
    </div>
  );
}
