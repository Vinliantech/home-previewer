import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader, PortalShell, fmtNaira as fmt } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransactionsPage,
});

const txs = [
  { d: "28 Jun 2026", k: "Rental Distribution", p: "Ruby's Apartment", ref: "TXN-2026-0089", a: 220_000 },
  { d: "12 Jun 2026", k: "Wallet Funding", p: "Bank transfer", ref: "TXN-2026-0075", a: 500_000 },
  { d: "28 May 2026", k: "Rental Distribution", p: "Ruby's Apartment", ref: "TXN-2026-0064", a: 235_000 },
  { d: "28 Apr 2026", k: "Rental Distribution", p: "Ruby's Apartment", ref: "TXN-2026-0051", a: 205_000 },
  { d: "09 Feb 2026", k: "Contribution", p: "Lillycrest Terrace", ref: "TXN-2026-0012", a: -12_500_000 },
  { d: "04 Nov 2025", k: "Contribution", p: "Ruby's Apartment", ref: "TXN-2025-0187", a: -14_000_000 },
];

function TransactionsPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Transactions"
        subtitle="Full ledger of every debit and credit on your account."
      />
      <Card className="mt-6 overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-cream text-[10px] uppercase tracking-wider text-navy/60">
            <tr>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Type</th>
              <th className="px-5 py-3 text-left">Property / Source</th>
              <th className="px-5 py-3 text-left">Reference</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {txs.map((t) => (
              <tr key={t.ref}>
                <td className="px-5 py-4 text-navy/70">{t.d}</td>
                <td className="px-5 py-4 font-bold text-navy">{t.k}</td>
                <td className="px-5 py-4 text-navy/70">{t.p}</td>
                <td className="px-5 py-4 text-[11px] font-mono text-navy/60">{t.ref}</td>
                <td
                  className={`px-5 py-4 text-right font-bold ${
                    t.a < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {fmt(t.a, { sign: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PortalShell>
  );
}
