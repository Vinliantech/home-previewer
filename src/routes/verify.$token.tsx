import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Shield } from "lucide-react";
import { verifyCertificate } from "@/lib/invest.functions";
import { fmtNGN, fmtPct } from "@/lib/invest";

export const Route = createFileRoute("/verify/$token")({
  head: () => ({ meta: [{ title: "Verify Certificate — KaySteph Enterprise" }] }),
  component: Verify,
});

function Verify() {
  const { token } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["verify", token],
    queryFn: () => verifyCertificate({ data: { token } }),
  });
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f2e] to-[#0f1450] px-4 py-16 text-white">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="flex items-center gap-2 text-sm text-white/60"><Shield className="h-4 w-4" /> Investment Certificate Verification</div>
        {isLoading && <div className="mt-6 text-white/70">Verifying…</div>}
        {data && !data.valid && (
          <div className="mt-6 flex items-center gap-3 text-rose-300"><XCircle className="h-6 w-6" /> Certificate not found or invalid.</div>
        )}
        {data && data.valid && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" /> Valid certificate</div>
            <Row l="Certificate no." v={data.certificate.certificate_number} />
            <Row l="Issued" v={new Date(data.certificate.issued_at).toLocaleDateString()} />
            <Row l="Property" v={data.investment?.tokenized_properties?.name ?? "—"} />
            <Row l="Location" v={data.investment?.tokenized_properties?.location ?? "—"} />
            <Row l="Ownership" v={fmtPct(data.investment?.ownership_pct ?? 0)} />
            <Row l="Tokens" v={String(data.investment?.tokens_count ?? 0)} />
            <Row l="Contribution" v={fmtNGN(data.investment?.approved_amount ?? 0)} />
          </div>
        )}
      </div>
    </div>
  );
}
function Row({ l, v }: { l: string; v: string }) { return <div className="flex justify-between border-b border-white/10 pb-2 text-sm"><span className="text-white/60">{l}</span><span className="font-semibold">{v}</span></div>; }
