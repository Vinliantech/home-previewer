import { createFileRoute } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import { Card, PageHeader, PortalShell, fmtNaira as fmt } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/my-tokens")({
  head: () => ({
    meta: [
      { title: "My Tokens | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyTokensPage,
});

const tokens = [
  { property: "Ruby's Apartment", tokens: 154, tokenValue: 100_000, worth: 15_400_000, status: "Active" },
  { property: "Lillycrest Terrace", tokens: 105, tokenValue: 125_000, worth: 13_125_000, status: "Active" },
];

function MyTokensPage() {
  return (
    <PortalShell>
      <PageHeader
        title="My Tokens"
        subtitle="Digital certificates representing your fractional ownership."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tokens.map((t) => (
          <Card key={t.property}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-navy">
                <Coins className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                {t.status}
              </span>
            </div>
            <h3 className="mt-3 font-serif text-lg font-bold text-navy">{t.property}</h3>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Tokens</p>
                <p className="font-bold text-navy">{t.tokens}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Unit value</p>
                <p className="font-bold text-navy">{fmt(t.tokenValue)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Worth</p>
                <p className="font-bold text-navy">{fmt(t.worth)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PortalShell>
  );
}
