import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Crown,
  Loader2,
  Lock,
  Mail,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getPoolDetail, invitePoolMember, joinPool } from "@/lib/pools.functions";
import {
  POOL_MEMBER_STATUS_LABEL,
  POOL_STATUS_LABEL,
  POOL_VISIBILITY_LABEL,
  poolProgressPct,
  type PoolMember,
  type PoolStatus,
} from "@/lib/pools";
import { fmtNGN } from "@/lib/invest";
import { blockInDemo, demoPools, isDemoActive } from "@/lib/demo";
import { DashCard, PageHeader, StatCard, StatusBadge, fmtDate } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/portfolio/pools/$id")({
  component: PoolDetailPage,
});

const MILESTONES: { key: PoolStatus; label: string }[] = [
  { key: "pending_approval", label: "Submitted" },
  { key: "open", label: "Open for members" },
  { key: "threshold_met", label: "Threshold met" },
  { key: "closing", label: "Closing" },
  { key: "completed", label: "Purchase completed" },
];

function PoolDetailPage() {
  const { id } = Route.useParams();
  const demo = isDemoActive();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pools", "detail", id],
    queryFn: () =>
      demo
        ? Promise.resolve(demoPools.detail[id] ?? demoPools.detail.__first)
        : getPoolDetail({ data: { pool_id: id } }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <DashCard>
          <p className="py-8 text-center text-sm text-slate-500">
            This pool could not be loaded. It may be private or no longer available.
          </p>
        </DashCard>
      </div>
    );
  }

  const { pool, members, summary, is_founder } = data;
  const pct = poolProgressPct(summary.committed, pool.target_amount);
  const typedMembers = members as PoolMember[];
  const iAmMember = demo ? Boolean(data.i_am_member) : false; // real membership is enforced server-side; join CTA covers non-members
  const canJoin =
    pool.visibility === "open" &&
    ["open", "threshold_met"].includes(pool.status) &&
    !is_founder &&
    !iAmMember;

  const activeIndex = MILESTONES.findIndex((m) => m.key === pool.status);

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={pool.name}
        description={pool.property_name ?? "Property to be confirmed"}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={pool.status}
              label={POOL_STATUS_LABEL[pool.status as PoolStatus]}
            />
            {is_founder && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                <Crown className="h-3.5 w-3.5 text-gold" /> Founder
              </span>
            )}
          </div>
        }
      />

      {pool.status === "rejected" && pool.admin_notes && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <span className="font-semibold">Not approved: </span>
          {pool.admin_notes}
        </div>
      )}

      {/* Progress */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Committed"
          value={fmtNGN(summary.committed)}
          sub={`${pct}% of ${fmtNGN(pool.target_amount)}`}
        />
        <StatCard icon={TrendingUp} label="Target" value={fmtNGN(pool.target_amount)} />
        <StatCard
          icon={Users}
          label="Members"
          value={String(summary.members)}
          sub={pool.member_cap ? `of ${pool.member_cap} places` : undefined}
        />
        <StatCard
          icon={BadgeCheck}
          label="Approved"
          value={fmtNGN(summary.approved)}
          sub={`${summary.approved_members} member(s)`}
        />
      </div>

      <DashCard noPadding>
        <div className="p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold text-navy">{fmtNGN(summary.committed)} committed</span>
            <span className="text-slate-500">Target {fmtNGN(pool.target_amount)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </DashCard>

      {/* Milestones */}
      <DashCard title="Milestones" description="Where this pool is in its journey.">
        <ol className="relative space-y-4 pl-6">
          <span
            className="absolute left-[9px] top-1 h-[calc(100%-0.5rem)] w-px bg-slate-200"
            aria-hidden
          />
          {MILESTONES.map((m, i) => {
            const done = pool.status === "completed" || i < activeIndex;
            const current = i === activeIndex;
            return (
              <li key={m.key} className="relative">
                <span
                  className={`absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-gold bg-gold"
                      : current
                        ? "border-gold bg-white"
                        : "border-slate-300 bg-white"
                  }`}
                />
                <span
                  className={`text-sm ${current ? "font-bold text-navy" : done ? "text-navy" : "text-slate-400"}`}
                >
                  {m.label}
                </span>
              </li>
            );
          })}
        </ol>
      </DashCard>

      {/* Join CTA */}
      {canJoin && (
        <JoinPanel
          poolId={pool.id}
          minContribution={Number(pool.min_contribution)}
          onJoined={() => qc.invalidateQueries({ queryKey: ["pools", "detail", id] })}
        />
      )}

      {/* Members */}
      <DashCard
        title="Members"
        description="Everyone in this pool sees the same contribution status — that's the point."
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Committed</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {typedMembers.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-navy">
                      {m.is_founder && <Crown className="h-3.5 w-3.5 text-gold" />}
                      {m.display_name ?? m.invited_email ?? "Verified member"}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-navy">{fmtNGN(m.committed_amount)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={m.status} label={POOL_MEMBER_STATUS_LABEL[m.status]} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">{fmtDate(m.joined_at)}</td>
                </tr>
              ))}
              {typedMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    No members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashCard>

      {/* Founder: invite */}
      {is_founder && (
        <InvitePanel
          poolId={pool.id}
          onInvited={() => qc.invalidateQueries({ queryKey: ["pools", "detail", id] })}
        />
      )}

      {/* SPV note */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-gold">
          <Lock className="h-5 w-5" />
        </span>
        <p className="text-sm leading-6 text-slate-600">
          <span className="font-semibold text-navy">SPV protection: </span>
          when this pool completes, the property is held by a dedicated Special Purpose Vehicle — a
          separate legal entity whose only asset is that property. Each member's interest is
          recorded against the SPV and ring-fenced from every other project.
        </p>
      </div>

      <p className="text-center text-xs text-slate-400">
        {POOL_VISIBILITY_LABEL[pool.visibility]}
        {pool.closing_date ? ` · closes ${fmtDate(pool.closing_date)}` : ""} · created{" "}
        {fmtDate(pool.created_at)}
      </p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/portfolio/pools"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy"
    >
      <ArrowLeft className="h-4 w-4" /> All pools
    </Link>
  );
}

function JoinPanel({
  poolId,
  minContribution,
  onJoined,
}: {
  poolId: string;
  minContribution: number;
  onJoined: () => void;
}) {
  const [amount, setAmount] = useState("");
  const mut = useMutation({
    mutationFn: joinPool,
    onSuccess: () => {
      toast.success("Request submitted — your contribution is pending approval.");
      setAmount("");
      onJoined();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not join the pool."),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (blockInDemo()) return;
    const value = Number(amount);
    if (!value) return void toast.error("Enter your intended contribution.");
    if (minContribution > 0 && value < minContribution) {
      return void toast.error(`Minimum contribution is ${fmtNGN(minContribution)}.`);
    }
    mut.mutate({ data: { pool_id: poolId, amount: value } });
  }

  return (
    <DashCard
      title="Join this pool"
      description="Reserve your place with an intended contribution."
    >
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="join-amount">
            Your contribution (₦){minContribution > 0 ? ` · min ${fmtNGN(minContribution)}` : ""}
          </Label>
          <Input
            id="join-amount"
            type="number"
            min={minContribution || 1}
            placeholder="30000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={mut.isPending}
          className="rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90 sm:min-w-40"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reserve my place"}
        </Button>
      </form>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Reserving costs nothing yet — Kay-Steph confirms the pool terms in writing before any funds
        move.
      </p>
    </DashCard>
  );
}

function InvitePanel({ poolId, onInvited }: { poolId: string; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const mut = useMutation({
    mutationFn: invitePoolMember,
    onSuccess: () => {
      toast.success("Invitation recorded.");
      setEmail("");
      onInvited();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not send the invite."),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (blockInDemo()) return;
    if (!email.trim()) return void toast.error("Enter an email address.");
    mut.mutate({ data: { pool_id: poolId, email: email.trim() } });
  }

  return (
    <DashCard title="Invite members" description="Add people to your private group by email.">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={mut.isPending}
          className="rounded-full bg-navy font-bold text-white hover:bg-navy/90 sm:min-w-40"
        >
          {mut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mail className="mr-1.5 h-4 w-4" /> Send invite
            </>
          )}
        </Button>
      </form>
    </DashCard>
  );
}
