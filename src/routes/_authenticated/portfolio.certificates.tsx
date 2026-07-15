import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, BadgeCheck } from "lucide-react";
import { getMyCertificates } from "@/lib/invest.functions";
import { fmtNGN, fmtPct } from "@/lib/invest";
import { DashCard, EmptyState, fmtDate, PageHeader } from "@/components/portfolio/kit";

export const Route = createFileRoute("/_authenticated/portfolio/certificates")({
  component: Certs,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function Certs() {
  const { data } = useQuery({ queryKey: ["certs"], queryFn: () => getMyCertificates() });
  const rows = (data?.certificates ?? []) as any[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investment certificates"
        description="Independently verifiable proof of every approved investment."
      />

      {rows.length === 0 && (
        <DashCard noPadding>
          <EmptyState
            icon={Award}
            title="No certificates yet"
            body="Certificates are issued automatically once Kay-Steph approves your investment."
          />
        </DashCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((c) => (
          <div
            key={c.id}
            className="overflow-hidden rounded-xl border border-gold/40 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gold/20 bg-gradient-to-r from-cream to-white px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-navy">
                <Award className="h-4 w-4 text-gold" /> {c.certificate_number}
              </div>
              <span className="text-xs text-slate-500">Issued {fmtDate(c.issued_at)}</span>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <div className="font-serif text-lg font-bold text-navy">
                  {c.investments?.tokenized_properties?.name}
                </div>
                <div className="text-xs text-slate-500">
                  {c.investments?.tokenized_properties?.location}
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Contribution</dt>
                  <dd className="font-bold tabular-nums text-navy">
                    {fmtNGN(c.investments?.approved_amount ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Ownership</dt>
                  <dd className="font-bold tabular-nums text-navy">
                    {fmtPct(c.investments?.ownership_pct ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Tokens</dt>
                  <dd className="font-bold tabular-nums text-navy">
                    {c.investments?.tokens_count ?? 0}
                  </dd>
                </div>
              </dl>
              <Link
                to="/verify/$token"
                params={{ token: c.qr_token }}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-navy hover:text-gold"
              >
                <BadgeCheck className="h-4 w-4 text-gold" /> Public verification link
              </Link>
            </div>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <p className="text-xs leading-5 text-slate-500">
          Anyone — a bank, a lawyer, a buyer of your interest — can confirm a certificate's
          authenticity through its public verification link, without access to your account.
        </p>
      )}
    </div>
  );
}
