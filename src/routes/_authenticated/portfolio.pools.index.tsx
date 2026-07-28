import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Crown, Loader2, Plus, Target, Users, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { createPool, getMyPools, listOpenPools } from "@/lib/pools.functions";
import { listPublicPropertyCatalogue } from "@/lib/invest.functions";
import {
  POOL_STATUS_LABEL,
  POOL_VISIBILITY_LABEL,
  poolProgressPct,
  type GroupPool,
  type PoolStatus,
} from "@/lib/pools";
import { fmtNGN } from "@/lib/invest";
import { DashCard, EmptyState, PageHeader, StatusBadge, fmtDate } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/portfolio/pools/")({
  component: PoolsPage,
});

type PoolWithSummary = GroupPool & {
  summary: { committed: number; members: number };
  my_membership?: { is_founder: boolean; status: string } | null;
};

function PoolsPage() {
  const { data: mine, isLoading } = useQuery({
    queryKey: ["pools", "mine"],
    queryFn: () => getMyPools(),
  });
  const { data: open } = useQuery({
    queryKey: ["pools", "open"],
    queryFn: () => listOpenPools(),
  });

  const myPools = (mine?.pools ?? []) as PoolWithSummary[];
  const openPools = (open?.pools ?? []) as PoolWithSummary[];
  const discoverable = openPools.filter((p) => !myPools.some((m) => m.id === p.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Group Pools"
        description="Buy together with a private group, or join an open pool of verified buyers."
        actions={<CreatePoolDialog />}
      />

      <DashCard title="My pools" description="Pools you founded or joined.">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : myPools.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="You're not in any pool yet"
            body="Start a private group with people you trust, or join an open pool below."
            action={<CreatePoolDialog triggerLabel="Start a pool" />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} founder={pool.my_membership?.is_founder} />
            ))}
          </div>
        )}
      </DashCard>

      <DashCard title="Open pools" description="Coordinated pools any verified investor can join.">
        {discoverable.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No open pools right now"
            body="Open pools appear here as Kay-Steph launches them. Start your own private group any time."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {discoverable.map((pool) => (
              <PoolCard key={pool.id} pool={pool} open />
            ))}
          </div>
        )}
      </DashCard>
    </div>
  );
}

function PoolCard({
  pool,
  founder,
  open,
}: {
  pool: PoolWithSummary;
  founder?: boolean;
  open?: boolean;
}) {
  const pct = poolProgressPct(pool.summary.committed, pool.target_amount);
  return (
    <Link
      to="/portfolio/pools/$id"
      params={{ id: pool.id }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-gold"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-serif text-lg font-bold text-navy">{pool.name}</h3>
            {founder && (
              <Crown className="h-4 w-4 shrink-0 text-gold" aria-label="You founded this pool" />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {pool.property_name ?? "Property to be confirmed"}
          </p>
        </div>
        <StatusBadge status={pool.status} label={POOL_STATUS_LABEL[pool.status as PoolStatus]} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span className="font-semibold text-navy">{fmtNGN(pool.summary.committed)}</span>
          <span>
            {pct}% of {fmtNGN(pool.target_amount)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {pool.summary.members} {pool.summary.members === 1 ? "member" : "members"}
          {pool.member_cap ? ` / ${pool.member_cap}` : ""}
        </span>
        <span>
          {POOL_VISIBILITY_LABEL[pool.visibility]}
          {pool.closing_date ? ` · closes ${fmtDate(pool.closing_date)}` : ""}
        </span>
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-navy">
        {open ? "View & join" : "Open pool"} <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

const UNDECIDED_PROPERTY = "__undecided__";

const EMPTY_CREATE = {
  name: "",
  property_id: "",
  visibility: "private" as "private" | "open",
  target_amount: "",
  min_contribution: "",
  member_cap: "",
  closing_date: "",
  founder_commitment: "",
  description: "",
};

function CreatePoolDialog({ triggerLabel = "Create pool" }: { triggerLabel?: string }) {
  const qc = useQueryClient();
  // Same catalogue the public site and admin edit, so a property added in
  // admin is immediately selectable here.
  // Raw catalogue rows, not the merged Property[]: a pool links by
  // tokenized_properties.id, and the merge maps rows onto slugs so the id is
  // lost. That means the picker only offers DB-backed properties — which is
  // correct, since a code-only fallback has no record to link to. Anything
  // else goes in under "to be confirmed".
  const { data: catalogue } = useQuery({
    queryKey: ["catalogue", "public"],
    queryFn: () => listPublicPropertyCatalogue(),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CREATE);

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const mut = useMutation({
    mutationFn: createPool,
    onSuccess: () => {
      toast.success("Pool created — it's pending Kay-Steph approval before it opens.");
      qc.invalidateQueries({ queryKey: ["pools", "mine"] });
      setForm(EMPTY_CREATE);
      setOpen(false);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not create the pool."),
  });

  const chosenProperty =
    form.property_id && form.property_id !== UNDECIDED_PROPERTY
      ? (catalogue?.properties ?? []).find((row: any) => row.id === form.property_id)
      : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const target = Number(form.target_amount);
    if (!form.name.trim() || !target) {
      toast.error("Pool name and target amount are required.");
      return;
    }
    mut.mutate({
      data: {
        name: form.name.trim(),
        // Send the real tokenized_properties id so the pool is linked to the
        // property record, not just labelled with its name. group_pools.property_id
        // has always had the foreign key; nothing was populating it.
        property_id: chosenProperty?.id,
        property_name: chosenProperty
          ? `${chosenProperty.name} — ${chosenProperty.location}`
          : undefined,
        visibility: form.visibility,
        target_amount: target,
        min_contribution: form.min_contribution ? Number(form.min_contribution) : undefined,
        member_cap: form.member_cap ? Number(form.member_cap) : undefined,
        closing_date: form.closing_date || undefined,
        founder_commitment: form.founder_commitment ? Number(form.founder_commitment) : undefined,
        description: form.description || undefined,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-navy font-bold text-white hover:bg-navy/90">
          <Plus className="mr-1.5 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-navy">Create a group pool</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cp-name">Pool name *</Label>
            <Input
              id="cp-name"
              required
              placeholder="e.g. Okafor Family Pool"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Target property</Label>
            <Select value={form.property_id} onValueChange={set("property_id")}>
              <SelectTrigger aria-label="Target property">
                <SelectValue placeholder="Choose a property" />
              </SelectTrigger>
              <SelectContent>
                {(catalogue?.properties ?? []).map((row: any) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name} — {row.location}
                  </SelectItem>
                ))}
                <SelectItem value={UNDECIDED_PROPERTY}>
                  Another property / to be confirmed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={form.visibility}
                onValueChange={(v) => set("visibility")(v as "private" | "open")}
              >
                <SelectTrigger aria-label="Visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private group (invite only)</SelectItem>
                  <SelectItem value="open">Open pool (discoverable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-cap">Member cap (optional)</Label>
              <Input
                id="cp-cap"
                type="number"
                min={2}
                placeholder="e.g. 8"
                value={form.member_cap}
                onChange={(e) => set("member_cap")(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cp-target">Target amount (₦) *</Label>
              <Input
                id="cp-target"
                required
                type="number"
                min={1}
                placeholder="240000000"
                value={form.target_amount}
                onChange={(e) => set("target_amount")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-min">Min contribution (₦)</Label>
              <Input
                id="cp-min"
                type="number"
                min={0}
                placeholder="10000000"
                value={form.min_contribution}
                onChange={(e) => set("min_contribution")(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cp-commit">Your own commitment (₦)</Label>
              <Input
                id="cp-commit"
                type="number"
                min={0}
                placeholder="30000000"
                value={form.founder_commitment}
                onChange={(e) => set("founder_commitment")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-close">Closing date</Label>
              <Input
                id="cp-close"
                type="date"
                value={form.closing_date}
                onChange={(e) => set("closing_date")(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-desc">Description (optional)</Label>
            <Textarea
              id="cp-desc"
              rows={3}
              placeholder="What is this pool for, and who is it open to?"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={mut.isPending}
            className="w-full rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
          >
            {mut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              "Create pool"
            )}
          </Button>
          <p className="text-xs leading-5 text-slate-500">
            New pools are reviewed by Kay-Steph before they open. You'll be notified once yours is
            approved and ready for members.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
