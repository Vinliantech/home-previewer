import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Calendar, Shield, Building2 } from "lucide-react";
import { getPropertyDetail, createInvestment } from "@/lib/invest.functions";
import {
  fmtNGN,
  fmtPct,
  ownershipPct,
  tokensForAmount,
  PROPERTY_STATUS_LABEL,
  statusTone,
} from "@/lib/invest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

const q = (id: string) =>
  queryOptions({
    queryKey: ["invest", "detail", id],
    queryFn: () => getPropertyDetail({ data: { id } }),
  });

export const Route = createFileRoute("/invest/$id")({
  head: (context) => {
    const loaderData = context.loaderData as unknown as
      | Awaited<ReturnType<typeof getPropertyDetail>>
      | undefined;
    return {
      meta: [
        { title: `${loaderData?.property?.name ?? "Property"} — KaySteph Investment` },
        {
          name: "description",
          content:
            loaderData?.property?.description?.slice(0, 155) ??
            "Fractional property investment opportunity.",
        },
        { property: "og:title", content: loaderData?.property?.name ?? "Investment property" },
        {
          property: "og:description",
          content: loaderData?.property?.description?.slice(0, 155) ?? "",
        },
        ...(loaderData?.property?.images?.[0]
          ? [{ property: "og:image", content: loaderData.property.images[0] }]
          : []),
        { property: "og:type", content: "website" },
      ],
    };
  },
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(q(params.id));
    return d;
  },
  errorComponent: () => <div className="p-8 text-white">Could not load property.</div>,
  notFoundComponent: () => <div className="p-8 text-white">Property not found</div>,
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(q(id));
  const { property: p, funding } = data;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [amount, setAmount] = useState<number>(Number(p.min_investment));
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pct = ownershipPct(amount, Number(p.initial_value));
  const tokens = tokensForAmount(amount, Number(p.token_value));
  const currentShare = Math.round(Number(p.current_value) * (pct / 100));
  const fundedPct = Math.min(100, Math.round((funding.approved / Number(p.initial_value)) * 100));
  const remaining = Math.max(0, Number(p.initial_value) - funding.approved);

  async function submit() {
    if (!accepted) return toast.error("You must accept the investment agreement.");
    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.info("Please sign in to invest.");
        navigate({ to: "/auth" });
        return;
      }
      await createInvestment({
        data: { property_id: id, proposed_amount: amount, agreement_accepted: true },
      });
      toast.success("Investment submitted. Awaiting company approval.");
      qc.invalidateQueries({ queryKey: ["invest"] });
      navigate({ to: "/portfolio/properties" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] via-[#0f1450] to-[#0a0f2e] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <Link
            to="/invest"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All properties
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            {p.images?.[0] && (
              <img src={p.images[0]} alt={p.name} className="aspect-video w-full object-cover" />
            )}
          </div>
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">{p.name}</h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-4 w-4" /> {p.location}
                </div>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs uppercase ${statusTone(p.status)}`}
              >
                {PROPERTY_STATUS_LABEL[p.status] ?? p.status}
              </span>
            </div>
            <p className="mt-4 text-white/70">{p.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Initial Value", fmtNGN(p.initial_value)],
              ["Current Value", fmtNGN(p.current_value)],
              ["Token Value", fmtNGN(p.token_value)],
              ["Min Investors", `${p.min_investors}`],
              ["Min Investment", fmtNGN(p.min_investment)],
              ["Rental Yield", `${p.expected_rental_yield ?? 0}%`],
              ["Appreciation", `${p.expected_appreciation ?? 0}%`],
              ["Deadline", p.funding_deadline ?? "—"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/50">{l}</div>
                <div className="mt-1 text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-4 p-6">
              <div className="text-sm text-white/60">Funding progress</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-semibold">{fundedPct}%</div>
                <div className="text-right text-sm text-white/60">
                  <div>{fmtNGN(funding.approved)} raised</div>
                  <div>{fmtNGN(remaining)} remaining</div>
                </div>
              </div>
              <Progress value={fundedPct} className="h-3 bg-white/10" />
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <div className="text-xs text-white/50">Approved investors</div>
                  <div className="font-semibold">{funding.investors}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Minimum required</div>
                  <div className="font-semibold">{p.min_investors}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Deadline</div>
                  <div className="font-semibold flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {p.funding_deadline ?? "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-3 p-6 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4 text-amber-300" /> Legal & Risk
              </div>
              <div>
                <span className="text-white/50">Legal title: </span>
                {p.legal_title ?? "—"}
              </div>
              <div>
                <span className="text-white/50">SPV: </span>
                {p.spvs?.name ?? "—"}
              </div>
              <div>
                <span className="text-white/50">Management fee: </span>
                {p.management_fee_pct ?? 0}%
              </div>
              <div>
                <span className="text-white/50">Exit terms: </span>
                {p.exit_terms ?? "—"}
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">
                <strong>Risk disclosure:</strong>{" "}
                {p.risk_disclosure ??
                  "All investments carry risk. Read the offering documents before investing."}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-4 border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent text-white">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-amber-300" /> Calculate my share
              </div>
              <div>
                <label className="text-xs text-white/60">Your contribution (₦)</label>
                <Input
                  type="number"
                  min={Number(p.min_investment)}
                  step={Number(p.token_value)}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1 border-white/20 bg-white/5 text-white"
                />
                <div className="mt-1 text-xs text-white/50">Minimum {fmtNGN(p.min_investment)}</div>
              </div>
              <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
                <Row label="Ownership %" value={fmtPct(pct)} />
                <Row label="Property tokens" value={tokens.toLocaleString()} />
                <Row label="Estimated share value" value={fmtNGN(currentShare)} />
                <Row
                  label="Est. annual rental share"
                  value={fmtNGN(
                    Math.round(currentShare * (Number(p.expected_rental_yield ?? 0) / 100)),
                  )}
                />
              </div>
              <label className="flex items-start gap-2 text-xs text-white/70">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(!!v)}
                  className="mt-0.5"
                />
                <span>
                  I have reviewed and accept the investment agreement, risk disclosure, and
                  co-ownership terms.
                </span>
              </label>
              <Button
                onClick={submit}
                disabled={submitting || amount < Number(p.min_investment) || !accepted}
                className="w-full bg-amber-500 text-black hover:bg-amber-400"
              >
                {submitting ? "Submitting…" : "Submit Investment"}
              </Button>
              <div className="text-center text-xs text-white/50">
                You'll be asked to sign in and complete KYC before your investment can be approved.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
