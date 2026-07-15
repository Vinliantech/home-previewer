import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2 } from "lucide-react";
import { listOpenProperties } from "@/lib/invest.functions";
import { fmtNGN, PROPERTY_STATUS_LABEL } from "@/lib/invest";
import { DashCard, EmptyState, PageHeader, StatusBadge } from "@/components/portfolio/kit";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/portfolio/opportunities")({
  component: Opportunities,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function Opportunities() {
  const { data } = useQuery({ queryKey: ["invest", "list"], queryFn: () => listOpenProperties() });
  const properties = (data?.properties ?? []) as any[];
  const funding = data?.funding ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investment opportunities"
        description="Verified properties currently open for contributions."
      />

      {properties.length === 0 && (
        <DashCard noPadding>
          <EmptyState
            icon={Building2}
            title="No open opportunities right now"
            body="New verified properties are announced through your notifications — check back soon."
          />
        </DashCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {properties.map((p: any) => {
          const f = funding[p.id] ?? { approved: 0, investors: 0 };
          const pct = Math.min(100, Math.round((f.approved / Number(p.initial_value)) * 100));
          return (
            <div
              key={p.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {p.images?.[0] && (
                <img src={p.images[0]} alt="" className="aspect-[16/7] w-full object-cover" />
              )}
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-serif text-lg font-bold text-navy">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.location}</div>
                  </div>
                  <StatusBadge
                    status={p.status}
                    label={PROPERTY_STATUS_LABEL[p.status] ?? p.status}
                  />
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Property value</dt>
                    <dd className="font-bold tabular-nums text-navy">{fmtNGN(p.initial_value)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Minimum investment</dt>
                    <dd className="font-bold tabular-nums text-navy">{fmtNGN(p.min_investment)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Rental yield</dt>
                    <dd className="font-bold text-navy">{p.expected_rental_yield ?? 0}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Appreciation</dt>
                    <dd className="font-bold text-navy">{p.expected_appreciation ?? 0}%</dd>
                  </div>
                </dl>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{pct}% funded</span>
                    <span>{f.investors} investors</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>

                <Link
                  to="/invest/$id"
                  params={{ id: p.id }}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-navy text-sm font-bold text-white hover:bg-navy/90"
                >
                  View &amp; invest <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
