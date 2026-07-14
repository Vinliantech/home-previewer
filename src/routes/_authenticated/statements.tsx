import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { Card, PageHeader, PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/statements")({
  head: () => ({
    meta: [
      { title: "Statements | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatementsPage,
});

const statements = [
  { period: "June 2026", generated: "01 Jul 2026", size: "182 KB" },
  { period: "May 2026", generated: "01 Jun 2026", size: "176 KB" },
  { period: "April 2026", generated: "01 May 2026", size: "171 KB" },
  { period: "Q1 2026", generated: "05 Apr 2026", size: "312 KB" },
  { period: "FY 2025 Summary", generated: "12 Jan 2026", size: "448 KB" },
];

function StatementsPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Statements"
        subtitle="Monthly and annual PDF statements ready to download."
      />
      <Card className="mt-6 p-0">
        <ul className="divide-y divide-navy/5">
          {statements.map((s) => (
            <li key={s.period} className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-navy">
                <FileText className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-navy">{s.period} statement</p>
                <p className="text-xs text-navy/60">
                  Generated {s.generated} · {s.size}
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-navy/15 bg-white px-3 py-2 text-xs font-bold text-navy hover:bg-cream">
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </PortalShell>
  );
}
