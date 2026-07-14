import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, PortalShell, fmtNaira as fmt } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/returns")({
  head: () => ({
    meta: [
      { title: "Returns | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReturnsPage,
});

const rows = [
  { property: "Ruby's Apartment", period: "Q2 2026", rental: 660_000, appreciation: 1_400_000, total: 2_060_000 },
  { property: "Lillycrest Terrace", period: "Q2 2026", rental: 455_000, appreciation: 625_000, total: 1_080_000 },
  { property: "Ruby's Apartment", period: "Q1 2026", rental: 640_000, appreciation: 0, total: 640_000 },
];

function ReturnsPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Returns"
        subtitle="Rental income plus paper appreciation across your holdings."
      />
      <Card className="mt-6 overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-cream text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-5 py-3 text-left">Property</th>
              <th className="px-5 py-3 text-left">Period</th>
              <th className="px-5 py-3 text-right">Rental</th>
              <th className="px-5 py-3 text-right">Appreciation</th>
              <th className="px-5 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-5 py-4 font-bold text-navy">{r.property}</td>
                <td className="px-5 py-4 text-navy/70">{r.period}</td>
                <td className="px-5 py-4 text-right text-navy">{fmt(r.rental)}</td>
                <td className="px-5 py-4 text-right text-navy">{fmt(r.appreciation)}</td>
                <td className="px-5 py-4 text-right font-bold text-emerald-700">{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PortalShell>
  );
}
