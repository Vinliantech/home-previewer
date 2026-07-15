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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { blockInDemo, demoAdmin, demoAdminPools, disableDemo, isDemoActive } from "@/lib/demo";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtNaira, fmtDate, statusPillClass, getYouTubeId } from "@/lib/affiliate";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Super Admin — Kay-Steph Group" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async ({ context }) => {
    // Demo sessions view sample data only; the real role check still guards live data.
    if (isDemoActive()) return;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: context.user.id });
    if (!isAdmin) throw redirect({ to: "/admin/auth" });
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [estateSummary, setEstateSummary] = useState<any>(null);

  const loadAll = useCallback(async () => {
    if (isDemoActive()) {
      setSummary(demoAdmin.summary);
      setAffiliates(demoAdmin.affiliates);
      setLeads(demoAdmin.leads);
      setCommissions(demoAdmin.commissions);
      setPayouts(demoAdmin.payouts);
      setVideos(demoAdmin.videos);
      setClients(demoAdmin.clients);
      setPools(demoAdminPools.pools);
      setEstateSummary({
        total_estates: 3,
        total_plots: 48,
        available_plots: 12,
        allocated_plots: 31,
        total_reservations: 27,
        pending_reservations: 6,
        pending_applications: 4,
        pending_receipts: 5,
        total_revenue: 512_000_000,
        open_tickets: 3,
      });
      return;
    }
    const sb = supabase as any;
    const [sumRes, affRes, leadRes, commRes, payRes, vidRes, cliRes] = await Promise.all([
      sb.rpc("get_admin_summary"),
      sb.from("affiliate_profiles").select("*").order("created_at", { ascending: false }),
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
    ]);
    if (sumRes.data && sumRes.data[0]) setSummary(sumRes.data[0]);
    if (affRes.data) setAffiliates(affRes.data);
    if (leadRes.data) setLeads(leadRes.data);
    if (commRes.data) setCommissions(commRes.data);
    if (payRes.data) setPayouts(payRes.data);
    if (vidRes.data) setVideos(vidRes.data);
    if (cliRes.data) setClients(cliRes.data);
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
    if (blockInDemo()) return;
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
    if (isDemoActive()) {
      disableDemo();
    } else {
      await supabase.auth.signOut();
    }
    toast.success("Signed out");
    navigate({ to: "/admin/auth", replace: true });
  }

  // Affiliate actions
  const setAffiliateStatus = async (id: string, status: string) => {
    if (blockInDemo()) return;
    const { error } = await (supabase as any)
      .from("affiliate_profiles")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Affiliate ${status}`);
    loadAll();
  };
  const setAffiliateRate = async (id: string, rate: number) => {
    if (blockInDemo()) return;
    const { error } = await (supabase as any)
      .from("affiliate_profiles")
      .update({ commission_rate: rate })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rate updated");
    loadAll();
  };
  const setLeadStatus = async (id: string, status: string) => {
    if (blockInDemo()) return;
    const { error } = await (supabase as any).from("client_leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    loadAll();
  };
  const createCommission = async (lead: any) => {
    if (blockInDemo()) return;
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
    if (blockInDemo()) return;
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
    if (blockInDemo()) return;
    const patch: any = { status };
    if (status === "completed") patch.processed_at = new Date().toISOString();
    const { error } = await (supabase as any).from("payout_requests").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Payout ${status}`);
    loadAll();
  };

  async function backup() {
    if (blockInDemo()) return;
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
      <Tabs defaultValue="overview" orientation="vertical" className="min-h-screen">
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
                to="/crm"
                onClick={(e) => {
                  if (isDemoActive()) {
                    e.preventDefault();
                    toast.info("The CRM workspace is not included in the demo.");
                  }
                }}
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

                <SideGroup label="Growth" />
                <SideItem
                  value="affiliates"
                  icon={Handshake}
                  label="Affiliates"
                  count={affiliates.length}
                />
                <SideItem value="leads" icon={ClipboardList} label="Leads" count={leads.length} />
                <SideItem value="training" icon={Video} label="Training" count={videos.length} />

                <SideGroup label="Support & System" />
                <SideItem value="support" icon={LifeBuoy} label="Support Tickets" />
                <SideItem value="documents" icon={Layers} label="Documents" />
                <SideItem value="roles" icon={UserCog} label="User Roles" />
                <SideItem value="backup" icon={Database} label="Data Backup" />
              </TabsList>

              {/* Separate admin apps (full pages, not in-page tabs) */}
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="hidden px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:block">
                  Platforms
                </div>
                <div className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
                  <Link
                    to="/admin-invest"
                    onClick={(e) => {
                      if (isDemoActive()) {
                        e.preventDefault();
                        toast.info("The tokenized investment admin is not included in the demo.");
                      }
                    }}
                    className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy lg:w-full"
                  >
                    <Coins className="h-4 w-4" />
                    <span className="flex-1 text-left">Tokenized Properties</span>
                  </Link>
                  <Link
                    to="/crm"
                    onClick={(e) => {
                      if (isDemoActive()) {
                        e.preventDefault();
                        toast.info("The CRM workspace is not included in the demo.");
                      }
                    }}
                    className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy lg:w-full"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="flex-1 text-left">CRM Workspace</span>
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
                            <span className={statusPillClass(a.status)}>{a.status}</span>
                          </TableCell>
                          <TableCell className="space-x-2 whitespace-nowrap">
                            {a.status !== "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAffiliateStatus(a.id, "active")}
                              >
                                Approve
                              </Button>
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
                            colSpan={7}
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
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>ID status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{fmtDate(c.created_at)}</TableCell>
                          <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.phone || "—"}
                          </TableCell>
                          <TableCell>
                            <span className={statusPillClass(c.id_verification_status)}>
                              {c.id_verification_status || "pending"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!clients.length && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
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
            <TabsContent value="documents" className="mt-0">
              <DocumentsModule />
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
    if (blockInDemo()) return;
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
    if (blockInDemo()) return;
    const { error } = await (supabase as any)
      .from("training_videos")
      .update({ is_published: !is_published })
      .eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };
  const remove = async (id: string) => {
    if (blockInDemo()) return;
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
