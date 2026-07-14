import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { Card, PageHeader, PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({
    meta: [
      { title: "KYC Verification | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KycPage,
});

const steps = [
  { label: "Personal information", done: true },
  { label: "Government-issued ID (NIN / Passport / Driver's Licence)", done: true },
  { label: "Proof of address (utility bill, < 3 months)", done: true },
  { label: "Bank account verification", done: false },
  { label: "Source of funds declaration", done: false },
];

function KycPage() {
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <PortalShell>
      <PageHeader
        title="KYC Verification"
        subtitle="Complete verification to unlock higher investment limits and faster payouts."
      />
      <Card className="mt-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-cream text-navy">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-navy">
              {completed} of {steps.length} steps complete
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-navy/10">
              <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="font-serif text-2xl font-bold text-navy">{pct}%</span>
        </div>
        <ul className="mt-6 space-y-3">
          {steps.map((s) => (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-lg border border-navy/5 bg-cream/40 px-4 py-3"
            >
              {s.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-navy/30" />
              )}
              <span
                className={`flex-1 text-sm font-semibold ${
                  s.done ? "text-navy/60 line-through" : "text-navy"
                }`}
              >
                {s.label}
              </span>
              {!s.done && (
                <button className="text-xs font-bold text-navy hover:text-gold">
                  Continue →
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </PortalShell>
  );
}
