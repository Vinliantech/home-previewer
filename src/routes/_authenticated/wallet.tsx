import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, Wallet as WalletIcon } from "lucide-react";
import { Card, PageHeader, PortalShell, fmtNaira as fmt } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Wallet"
        subtitle="Funds ready to deploy or withdraw."
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="bg-navy text-white lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <WalletIcon className="h-5 w-5" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Available balance
            </p>
          </div>
          <p className="mt-4 font-serif text-4xl font-bold">{fmt(745_000)}</p>
          <p className="mt-1 text-xs text-white/60">Held in Kay-Steph Escrow Trust</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-xs font-bold text-gold-foreground hover:bg-gold/90">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Fund wallet
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-4 py-2 text-xs font-bold hover:bg-white/10">
              <ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw
            </button>
          </div>
        </Card>

        <Card>
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Escrow account</p>
          <div className="mt-4 space-y-3 text-sm">
            <Row k="Bank" v="Sterling Bank" />
            <Row k="Account name" v="Kay-Steph Escrow Trust" />
            <Row k="Account no." v="0102-334-556" />
            <Row k="Reference" v="KSC-DEMO-001" />
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-navy/5 pb-2 last:border-0">
      <span className="text-navy/60">{k}</span>
      <span className="font-bold text-navy">{v}</span>
    </div>
  );
}
