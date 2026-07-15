import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { FileBarChart2, Printer } from "lucide-react";
import { getMyKyc, getMyPortfolio, getMyTransactions } from "@/lib/invest.functions";
import { fmtNGN } from "@/lib/invest";
import { DashCard, EmptyState, fmtDate, PageHeader } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";
import { ADDRESS_LINES, EMAIL, PHONE_1_DISPLAY } from "@/lib/properties";

export const Route = createFileRoute("/_authenticated/portfolio/statements")({
  component: Statements,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

const PERIODS = [
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "ytd", label: "This year" },
  { value: "all", label: "All time" },
] as const;

type StatementRow = {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
};

function Statements() {
  const { data: txData } = useQuery({ queryKey: ["txns"], queryFn: () => getMyTransactions() });
  const { data: portfolio } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => getMyPortfolio(),
  });
  const { data: kycData } = useQuery({ queryKey: ["kyc"], queryFn: () => getMyKyc() });
  const [period, setPeriod] = useState<string>("365");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const accountName = kycData?.kyc?.full_name || email || "Client";

  const rows = useMemo<StatementRow[]>(() => {
    const txRows: StatementRow[] = ((txData?.transactions ?? []) as any[]).map((t) => ({
      id: `tx-${t.id}`,
      date: t.created_at,
      description: `${String(t.type).replace(/_/g, " ")}${
        t.tokenized_properties?.name ? ` — ${t.tokenized_properties.name}` : ""
      }`,
      reference: t.reference ?? "—",
      amount: Number(t.amount),
    }));
    // Include paid rental distributions that may not appear as transactions.
    // Dedupe on same-day + same-amount so distributions recorded both as a
    // payout and a transaction are not double-counted.
    const txKeys = new Set(txRows.map((r) => `${String(r.date).slice(0, 10)}|${r.amount}`));
    const payoutRows: StatementRow[] = ((portfolio?.payouts ?? []) as any[])
      .filter(
        (p) =>
          p.status === "paid" &&
          !txKeys.has(`${String(p.paid_at ?? p.created_at).slice(0, 10)}|${Number(p.amount)}`),
      )
      .map((p) => ({
        id: `po-${p.id}`,
        date: p.paid_at ?? p.created_at,
        description: `rental distribution${
          p.tokenized_properties?.name ? ` — ${p.tokenized_properties.name}` : ""
        }`,
        reference: `payout-${String(p.id).slice(0, 8)}`,
        amount: Number(p.amount),
      }));
    return [...txRows, ...payoutRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [txData, portfolio]);

  const cutoff = useMemo(() => {
    const now = new Date();
    if (period === "ytd") return new Date(now.getFullYear(), 0, 1);
    if (period === "all") return null;
    const days = Number(period);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }, [period]);

  const filtered = cutoff ? rows.filter((r) => new Date(r.date) >= cutoff) : rows;
  const credits = filtered.filter((r) => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
  const debits = filtered.filter((r) => r.amount < 0).reduce((sum, r) => sum + r.amount, 0);
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "";

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Account statements"
          description="A consolidated record of contributions, distributions and withdrawals."
          actions={
            <>
              <div className="w-44">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger aria-label="Statement period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => window.print()}
                className="bg-navy font-bold text-white hover:bg-navy/90"
              >
                <Printer className="mr-2 h-4 w-4" /> Print / save PDF
              </Button>
            </>
          }
        />
      </div>

      {/* Statement document */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* Statement header */}
        <div className="flex flex-col justify-between gap-6 border-b border-slate-200 p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="flex items-start gap-3">
            <img src={logoImg} alt="" className="h-11 w-11" width={44} height={44} />
            <div>
              <div className="font-serif text-lg font-bold text-navy">Kay-Steph Group</div>
              <div className="text-xs leading-5 text-slate-500">
                {ADDRESS_LINES.join(" ")}
                <br />
                {PHONE_1_DISPLAY} · {EMAIL}
              </div>
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              Account statement
            </div>
            <div className="mt-1 font-bold text-navy">{accountName}</div>
            <div className="text-xs text-slate-500">{email}</div>
            <div className="mt-1 text-xs text-slate-500">
              Period: {periodLabel} · Generated {fmtDate(new Date().toISOString())}
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 text-center">
          <div className="px-4 py-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Entries</div>
            <div className="mt-1 font-serif text-xl font-bold tabular-nums text-navy">
              {filtered.length}
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total credits</div>
            <div className="mt-1 font-serif text-xl font-bold tabular-nums text-emerald-600">
              {fmtNGN(credits)}
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total debits</div>
            <div className="mt-1 font-serif text-xl font-bold tabular-nums text-rose-600">
              {fmtNGN(Math.abs(debits))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileBarChart2}
            title="No entries in this period"
            body="Widen the period or check back after your first transaction."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-slate-500">
                    {fmtDate(r.date)}
                  </TableCell>
                  <TableCell className="font-medium capitalize text-navy">
                    {r.description}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{r.reference}</TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${
                      r.amount < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {fmtNGN(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="border-t border-slate-200 px-6 py-4 text-xs leading-5 text-slate-400 sm:px-8">
          This statement is generated from your Kay-Steph Client Portal records. Figures reflect
          recorded transactions and paid distributions at the time of generation. For queries
          contact {EMAIL} or call {PHONE_1_DISPLAY}.
        </div>
      </div>

      <DashCard className="print:hidden">
        <p className="text-sm leading-6 text-slate-600">
          <b className="text-navy">Tip:</b> use <b className="text-navy">Print / save PDF</b> and
          choose “Save as PDF” as the destination to download this statement for your records, your
          bank or your accountant.
        </p>
      </DashCard>
    </div>
  );
}
