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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { blockInDemo, demoAdmin, demoAdminPools, disableDemo, isDemoActive } from "@/lib/demo";
import { adminListPools, adminReviewPool } from "@/lib/pools.functions";
import { POOL_STATUS_LABEL, poolProgressPct, type PoolStatus } from "@/lib/pools";
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-navy text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="font-serif text-xl font-semibold">Kay-Steph</div>
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
              Super Admin
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
              className="hidden items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20 sm:inline-flex"
            >
              CRM Workspace
            </Link>
            <Link
              to="/"
              className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:text-gold sm:inline-flex"
            >
              <Home className="h-4 w-4" /> Home
            </Link>
            <Button
              onClick={signOut}
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-gold"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-gold" />
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Administration</p>
            <h1 className="font-serif text-3xl font-semibold text-navy">
              Kay-Steph Control Centre
            </h1>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total affiliates" value={summary?.total_affiliates ?? 0} />
          <Stat label="Pending approval" value={summary?.pending_affiliates ?? 0} highlight />
          <Stat label="Total leads" value={summary?.total_leads ?? 0} />
          <Stat label="Registered clients" value={clients.length} />
          <Stat label="Pending commissions" value={summary?.pending_commissions_count ?? 0} />
          <Stat
            label="Pending commission value"
            value={fmtNaira(summary?.pending_commissions_amount ?? 0)}
          />
          <Stat label="Pending payouts" value={summary?.pending_payouts_count ?? 0} highlight />
          <Stat
            label="Pending payout value"
            value={fmtNaira(summary?.pending_payouts_amount ?? 0)}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap bg-navy/5">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="affiliates">
              <Handshake className="mr-2 h-4 w-4" />
              Affiliates ({affiliates.length})
            </TabsTrigger>
            <TabsTrigger value="leads">
              <ClipboardList className="mr-2 h-4 w-4" />
              Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <CreditCard className="mr-2 h-4 w-4" />
              Commissions ({commissions.length})
            </TabsTrigger>
            <TabsTrigger value="payouts">
              <Wallet className="mr-2 h-4 w-4" />
              Payouts ({payouts.length})
            </TabsTrigger>
            <TabsTrigger value="training">
              <Video className="mr-2 h-4 w-4" />
              Training ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="mr-2 h-4 w-4" />
              Clients ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="pools">
              <UsersRound className="mr-2 h-4 w-4" />
              Pools ({pools.length})
            </TabsTrigger>
            <TabsTrigger value="estates">
              <Building2 className="mr-2 h-4 w-4" />
              Estates
            </TabsTrigger>
            <TabsTrigger value="support">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Database className="mr-2 h-4 w-4" />
              Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border-gold/30">
              <CardHeader>
                <CardTitle className="font-serif text-navy">Programme snapshot</CardTitle>
                <CardDescription>
                  Live counts across the estate and affiliate operation.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use the tabs above to approve affiliates, convert leads into commissions, and
                process payouts. The Backup tab downloads a full JSON of every table for
                safekeeping.
              </CardContent>
            </Card>
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
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
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
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
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
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
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
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          No pools yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estates">
            <Card className="border-gold/30">
              <CardHeader>
                <CardTitle className="font-serif text-navy">Estates & properties</CardTitle>
                <CardDescription>Estate management module coming online.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Reservations for the five signature estates flow into this tab. Wiring in the next
                pass.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="border-gold/30">
              <CardHeader>
                <CardTitle className="font-serif text-navy">Support tickets</CardTitle>
                <CardDescription>Coming online next.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Client-side ticketing surfaces here once wired.
              </CardContent>
            </Card>
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
        </Tabs>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${highlight ? "border-gold" : "border-gold/30"}`}
    >
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-serif text-2xl font-semibold md:text-3xl ${highlight ? "text-gold" : "text-navy"}`}
      >
        {value}
      </div>
    </div>
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
