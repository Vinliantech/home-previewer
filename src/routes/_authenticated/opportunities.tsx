import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Card, PageHeader, PortalShell } from "@/components/portal/PortalShell";
import { INVESTMENT_MODEL_LABEL, properties } from "@/lib/properties";
import { fmtNGN } from "@/lib/invest";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Opportunities"
        subtitle="Live investment opportunities open to Kay-Steph clients."
      />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => (
          <Card key={p.id} className="flex flex-col overflow-hidden p-0">
            <img src={p.image} alt={p.title} className="h-40 w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-navy/50">
                <MapPin className="h-3 w-3" /> {p.location}
              </div>
              <h3 className="mt-1 font-serif text-lg font-bold text-navy">{p.title}</h3>
              <p className="mt-1 text-xs text-navy/60">{p.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.investmentModels.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-navy"
                  >
                    {INVESTMENT_MODEL_LABEL[m]}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-navy/5 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">
                    From
                  </p>
                  <p className="font-serif text-base font-bold text-navy">
                    {fmtNGN(p.priceValue)}
                  </p>
                </div>
                <Link
                  to="/properties/$id"
                  params={{ id: p.id }}
                  className="inline-flex items-center gap-1 rounded-md bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy/90"
                >
                  View <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PortalShell>
  );
}
