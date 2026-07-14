import { createFileRoute } from "@tanstack/react-router";
import { DoorOpen } from "lucide-react";
import { Card, PageHeader, PortalShell, fmtNaira as fmt } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/exit-requests")({
  head: () => ({
    meta: [
      { title: "Exit Requests | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExitRequestsPage,
});

const requests = [
  { property: "Lillycrest Terrace", requested: "18 Jun 2026", amount: 13_125_000, status: "Under Review", tone: "amber" as const },
];

function ExitRequestsPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Exit Requests"
        subtitle="Sell your position back to Kay-Steph or list it to another client."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy/90">
            <DoorOpen className="h-4 w-4" /> New request
          </button>
        }
      />
      <Card className="mt-6 p-0">
        <table className="w-full text-sm">
          <thead className="bg-cream text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-5 py-3 text-left">Property</th>
              <th className="px-5 py-3 text-left">Requested</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-navy/50">
                  No exit requests yet.
                </td>
              </tr>
            )}
            {requests.map((r, i) => (
              <tr key={i}>
                <td className="px-5 py-4 font-bold text-navy">{r.property}</td>
                <td className="px-5 py-4 text-navy/70">{r.requested}</td>
                <td className="px-5 py-4 text-right font-bold text-navy">{fmt(r.amount)}</td>
                <td className="px-5 py-4 text-right">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PortalShell>
  );
}
