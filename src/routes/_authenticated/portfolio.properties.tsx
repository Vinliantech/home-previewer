import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Home, ShieldAlert, Upload } from "lucide-react";
import { getMyPortfolio, uploadPaymentEvidence } from "@/lib/invest.functions";
import { currentShareValue, fmtNGN, fmtPct, INVESTMENT_STATUS_LABEL } from "@/lib/invest";
import { DashCard, EmptyState, PageHeader, StatusBadge } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { investmentBankAccount } from "@/lib/payment-config";
import { WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/_authenticated/portfolio/properties")({
  component: MyProperties,
});

function MyProperties() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["portfolio"], queryFn: () => getMyPortfolio() });
  const investments = data?.investments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Properties"
        description="Every property you hold an interest in, with its current position."
      />

      {investments.length === 0 && (
        <DashCard noPadding>
          <EmptyState
            icon={Home}
            title="No investments yet"
            body="Browse verified opportunities and make your first contribution."
            action={
              <Link
                to="/portfolio/opportunities"
                className="inline-flex h-9 items-center rounded-lg bg-gold px-4 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                Browse opportunities
              </Link>
            }
          />
        </DashCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {investments.map((investment) => {
          const cv = currentShareValue(
            Number(investment.tokenized_properties?.current_value ?? 0),
            Number(investment.ownership_pct ?? 0),
          );
          const initial = Number(investment.approved_amount ?? investment.proposed_amount ?? 0);
          const gain = cv - initial;
          return (
            <div
              key={investment.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {investment.tokenized_properties?.images?.[0] && (
                <img
                  src={investment.tokenized_properties.images[0]}
                  alt={`${investment.tokenized_properties.name} in ${investment.tokenized_properties.location}`}
                  className="aspect-[16/7] w-full object-cover"
                />
              )}
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-serif text-lg font-bold text-navy">
                      {investment.tokenized_properties?.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {investment.tokenized_properties?.location}
                    </div>
                  </div>
                  <StatusBadge
                    status={investment.status}
                    label={INVESTMENT_STATUS_LABEL[investment.status] ?? investment.status}
                  />
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                  <PositionStat label="Contribution" value={fmtNGN(initial)} />
                  <PositionStat label="Ownership" value={fmtPct(investment.ownership_pct ?? 0)} />
                  <PositionStat label="Tokens" value={String(investment.tokens_count ?? 0)} />
                  <PositionStat label="Current share" value={fmtNGN(cv)} />
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Capital gain</dt>
                    <dd
                      className={`font-bold tabular-nums ${
                        gain >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {gain >= 0 ? "+" : ""}
                      {fmtNGN(gain)}
                    </dd>
                  </div>
                </dl>

                {investment.status === "submitted" && (
                  <PaymentDialog
                    investment={investment}
                    onDone={() => qc.invalidateQueries({ queryKey: ["portfolio"] })}
                  />
                )}
                {(investment as any).certificate_number && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    <Award className="h-4 w-4 shrink-0" />
                    Certificate: <b>{(investment as any).certificate_number}</b>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PositionStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-bold tabular-nums text-navy">{value}</dd>
    </div>
  );
}

type PortfolioInvestment = Awaited<ReturnType<typeof getMyPortfolio>>["investments"][number];

const PAYMENT_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_PAYMENT_FILE_BYTES = 5 * 1024 * 1024;

function PaymentDialog({
  investment,
  onDone,
}: {
  investment: PortfolioInvestment;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const mut = useMutation({ mutationFn: uploadPaymentEvidence });

  async function submit() {
    if (!file) return toast.error("Attach payment evidence");
    setBusy(true);
    try {
      if (!PAYMENT_FILE_TYPES.includes(file.type)) {
        throw new Error("Payment evidence must be a JPG, PNG, WebP, or PDF file.");
      }
      if (file.size > MAX_PAYMENT_FILE_BYTES) {
        throw new Error("Payment evidence must be 5 MB or smaller.");
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${investment.investor_id}/${investment.id}-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("payment-evidence").upload(path, file);
      if (error) throw error;
      await mut.mutateAsync({
        data: { investment_id: investment.id, evidence_url: path, reference: ref },
      });
      toast.success("Payment evidence submitted.");
      setOpen(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment evidence upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full bg-navy font-bold text-white hover:bg-navy/90">
          <Upload className="mr-2 h-4 w-4" /> Upload payment evidence
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-navy">Upload payment evidence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {investmentBankAccount ? (
            <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              {[
                ["Bank", investmentBankAccount.bankName],
                ["Account name", investmentBankAccount.accountName],
                ["Account number", investmentBankAccount.accountNumber],
                ["Reference", `KS-${investment.id.slice(0, 8)}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-bold tabular-nums text-navy">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Payment instructions have not been configured. Do not send money to an account
                shared outside this portal.{" "}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline"
                >
                  Contact finance
                </a>
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="payment-ref">Payment reference</Label>
            <Input
              id="payment-ref"
              placeholder="Bank transfer reference"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment-file">Evidence file</Label>
            <Input
              id="payment-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-slate-500">JPG, PNG, WebP, or PDF. Maximum 5 MB.</p>
          </div>
          <Button
            onClick={submit}
            disabled={busy || !investmentBankAccount}
            className="w-full bg-navy font-bold text-white hover:bg-navy/90"
          >
            {busy ? "Submitting…" : "Submit evidence"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
