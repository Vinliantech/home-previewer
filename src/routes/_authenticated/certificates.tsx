import { createFileRoute } from "@tanstack/react-router";
import { Award, Download } from "lucide-react";
import { Card, PageHeader, PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CertificatesPage,
});

const certs = [
  { title: "Ownership Certificate — Ruby's Apartment", issued: "05 Nov 2025", ref: "KSC-CERT-000187", spv: "Ruby Jahi SPV Ltd" },
  { title: "Ownership Certificate — Lillycrest Terrace", issued: "10 Feb 2026", ref: "KSC-CERT-000212", spv: "Lillycrest LC SPV Ltd" },
  { title: "Escrow Receipt — Estate Plots Phase II", issued: "22 Jun 2026", ref: "KSC-ESC-000305", spv: "—" },
];

function CertificatesPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Certificates"
        subtitle="Signed documents evidencing your ownership and payments."
      />
      <div className="mt-6 grid gap-4">
        {certs.map((c) => (
          <Card key={c.ref} className="flex flex-wrap items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <Award className="h-6 w-6" />
            </span>
            <div className="min-w-[240px] flex-1">
              <p className="font-bold text-navy">{c.title}</p>
              <p className="mt-0.5 text-xs text-navy/60">
                Issued {c.issued} · SPV: {c.spv} ·{" "}
                <span className="font-mono">{c.ref}</span>
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-navy/15 bg-white px-3 py-2 text-xs font-bold text-navy hover:bg-cream">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
          </Card>
        ))}
      </div>
    </PortalShell>
  );
}
