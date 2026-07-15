import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Banknote, Landmark, ShieldAlert, Wallet } from "lucide-react";
import { getMyPortfolio, requestWithdrawal } from "@/lib/invest.functions";
import { fmtNGN } from "@/lib/invest";
import { DashCard, PageHeader, StatCard } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { investmentBankAccount } from "@/lib/payment-config";
import { WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/_authenticated/portfolio/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["portfolio"], queryFn: () => getMyPortfolio() });
  const w = data?.wallet;
  const [amount, setAmount] = useState(0);
  const [bank, setBank] = useState({ bank_name: "", account_name: "", account_number: "" });
  const mut = useMutation({ mutationFn: requestWithdrawal });
  const availableBalance = Number(w?.available_balance ?? 0);
  const hasBankDetails = Object.values(bank).every((value) => value.trim().length >= 2);

  async function withdraw() {
    try {
      if (amount > availableBalance) throw new Error("Amount exceeds your available balance.");
      if (!hasBankDetails) throw new Error("Complete all settlement account details.");
      await mut.mutateAsync({ data: { amount, bank_details: bank } });
      toast.success("Withdrawal requested. Finance will process it after review.");
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setAmount(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Withdrawal request failed.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Your available balance, returns received and withdrawal requests."
      />

      {/* Balance hero */}
      <div className="overflow-hidden rounded-xl bg-navy text-white shadow-sm">
        <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              Available balance
            </div>
            <div className="mt-2 font-serif text-4xl font-bold tabular-nums text-gold">
              {fmtNGN(availableBalance)}
            </div>
            <div className="mt-1 text-xs text-white/55">
              Withdrawable after finance review · Settlements to your named account only
            </div>
          </div>
          <a
            href="#withdraw"
            className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-gold px-4 text-sm font-bold text-gold-foreground hover:bg-gold/90 sm:self-auto"
          >
            <ArrowUpRight className="h-4 w-4" /> Request withdrawal
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Available" value={fmtNGN(w?.available_balance ?? 0)} />
        <StatCard icon={Banknote} label="Total returns" value={fmtNGN(w?.total_returns ?? 0)} />
        <StatCard icon={Landmark} label="Total withdrawn" value={fmtNGN(w?.total_withdrawn ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Withdrawal */}
        <DashCard
          title="Request a withdrawal"
          description="Funds are transferred to a bank account in your own name."
          className="scroll-mt-24"
        >
          <div id="withdraw" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="withdraw-amount">Amount (₦)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0"
                min={1}
                max={availableBalance}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500">
                Maximum: <b>{fmtNGN(availableBalance)}</b>
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="withdraw-bank">Bank name</Label>
                <Input
                  id="withdraw-bank"
                  placeholder="e.g. GTBank"
                  value={bank.bank_name}
                  onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="withdraw-acct-name">Account name</Label>
                <Input
                  id="withdraw-acct-name"
                  placeholder="As on your account"
                  value={bank.account_name}
                  onChange={(e) => setBank({ ...bank, account_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="withdraw-acct-no">Account number</Label>
                <Input
                  id="withdraw-acct-no"
                  inputMode="numeric"
                  placeholder="10 digits"
                  value={bank.account_number}
                  onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={withdraw}
              disabled={!amount || amount <= 0 || amount > availableBalance || !hasBankDetails}
              className="w-full bg-navy font-bold text-white hover:bg-navy/90 sm:w-auto sm:px-8"
            >
              Request withdrawal
            </Button>
            <p className="text-xs leading-5 text-slate-500">
              Withdrawals are reviewed by finance before payment and recorded in your transaction
              history. For your protection we only settle to accounts in your own name.
            </p>
          </div>
        </DashCard>

        {/* Funding instructions */}
        <DashCard
          title="Fund your account"
          description="Bank transfer with your investment reference"
        >
          <div className="space-y-4 text-sm">
            <p className="leading-6 text-slate-600">
              Transfer directly to the property investment account using the reference shown on each
              pending investment, then upload your payment evidence from{" "}
              <b className="text-navy">My Properties</b>.
            </p>
            {investmentBankAccount ? (
              <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                {[
                  ["Bank", investmentBankAccount.bankName],
                  ["Account name", investmentBankAccount.accountName],
                  ["Account number", investmentBankAccount.accountNumber],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-bold tabular-nums text-navy">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm leading-6">
                  Payment instructions are awaiting finance-team configuration. Do not transfer
                  funds until Kay-Steph confirms the account through this portal.{" "}
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
            <p className="text-xs leading-5 text-slate-500">
              Security note: Kay-Steph will never ask you to pay into a personal account or share
              account details outside this portal.
            </p>
          </div>
        </DashCard>
      </div>
    </div>
  );
}
