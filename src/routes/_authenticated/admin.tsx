import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, PageHeader, Card } from "@/components/portal/PortalShell";
import { StatusBadge, fmtDate } from "@/components/portfolio/kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminListPools, adminReviewPool } from "@/lib/pools.functions";
import { POOL_STATUS_LABEL, poolProgressPct, type PoolStatus } from "@/lib/pools";
import { fmtNGN } from "@/lib/invest";
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


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin | Kay-Steph" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Admin"
        subtitle="Manage pools, estates, plots, allocations, applications and reservations."
      />

      <Tabs defaultValue="pools" className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-cream">
          <TabsTrigger value="pools">Group pools</TabsTrigger>
          <TabsTrigger value="estates">Estates</TabsTrigger>
          <TabsTrigger value="plots">Plots</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="mt-6 space-y-6">
          <PoolsSection />
        </TabsContent>
        <TabsContent value="estates" className="mt-6">
          <EstatesModule />
        </TabsContent>
        <TabsContent value="plots" className="mt-6">
          <PlotsModule />
        </TabsContent>
        <TabsContent value="allocations" className="mt-6">
          <AllocationsModule />
        </TabsContent>
        <TabsContent value="applications" className="mt-6">
          <ApplicationsModule />
        </TabsContent>
        <TabsContent value="reservations" className="mt-6">
          <ReservationsModule />
        </TabsContent>
      </Tabs>
    </PortalShell>
  );
}

function PoolsSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pools"],
    queryFn: () => adminListPools(),
  });

  const review = useMutation({
    mutationFn: (v: { pool_id: string; approve: boolean; notes?: string }) =>
      adminReviewPool({ data: v }),
    onSuccess: () => {
      toast.success("Pool updated");
      qc.invalidateQueries({ queryKey: ["admin", "pools"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not update pool"),
  });

  const pools = data?.pools ?? [];
  const pending = pools.filter((p) => p.status === "pending_approval");
  const other = pools.filter((p) => p.status !== "pending_approval");

  return (
    <>
      <Card>
        <h2 className="font-serif text-lg font-bold text-navy">
          Pending approval ({pending.length})
        </h2>
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading pools…
          </div>
        ) : pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No pools awaiting review.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((p) => (
              <ReviewCard
                key={p.id}
                pool={p}
                onDecide={(approve, notes) =>
                  review.mutate({ pool_id: p.id, approve, notes })
                }
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between p-6">
          <h2 className="font-serif text-lg font-bold text-navy">All pools</h2>
          <span className="text-xs text-slate-500">{other.length} recorded</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-cream text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-5 py-3 text-left">Pool</th>
              <th className="px-5 py-3 text-left">Progress</th>
              <th className="px-5 py-3 text-left">Created</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {other.map((p) => {
              const pct = poolProgressPct(p.summary.committed, p.target_amount);
              return (
                <tr key={p.id}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-navy">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.property_name ?? "Property TBC"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-navy">
                      {fmtNGN(p.summary.committed)} / {fmtNGN(p.target_amount)}
                    </p>
                    <div className="mt-1 h-1.5 w-40 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{fmtDate(p.created_at)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      status={p.status}
                      label={POOL_STATUS_LABEL[p.status as PoolStatus]}
                    />
                  </td>
                </tr>
              );
            })}
            {other.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                  No pools yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function ReviewCard({
  pool,
  onDecide,
}: {
  pool: {
    id: string;
    name: string;
    property_name: string | null;
    description: string | null;
    target_amount: number;
    min_contribution: number;
    created_at: string;
  };
  onDecide: (approve: boolean, notes?: string) => void;
}) {
  const [notes, setNotes] = useState("");
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-navy">{pool.name}</p>
          <p className="text-xs text-slate-500">
            {pool.property_name ?? "Property TBC"} · target {fmtNGN(pool.target_amount)} · min{" "}
            {fmtNGN(pool.min_contribution)} · submitted {fmtDate(pool.created_at)}
          </p>
          {pool.description && (
            <p className="mt-2 text-sm text-navy/80">{pool.description}</p>
          )}
        </div>
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
      </div>
      <Textarea
        className="mt-3"
        placeholder="Notes to the founder (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={() => onDecide(true, notes || undefined)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => onDecide(false, notes || undefined)}
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          <XCircle className="mr-1.5 h-4 w-4" /> Reject
        </Button>
      </div>
    </div>
  );
}
