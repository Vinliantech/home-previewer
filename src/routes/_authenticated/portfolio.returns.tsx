import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Clock3, TrendingUp } from "lucide-react";
import { getMyPortfolio } from "@/lib/invest.functions";
import { currentShareValue, fmtNGN, fmtPct } from "@/lib/invest";
import {
  DashCard,
  EmptyState,
  fmtDate,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/portfolio/kit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/portfolio/returns")({
  component: Returns,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function Returns() {
  const { data } = useQuery({ queryKey: ["portfolio"], queryFn: () => getMyPortfolio() });
  const invs = (data?.investments ?? []) as any[];
  const payouts = (data?.payouts ?? []) as any[];
  const totalRental = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const appreciation = invs
    .filter((i) => i.status === "approved")
    .reduce(
      (sum, i) =>
        sum +
        (currentShareValue(
          Number(i.tokenized_properties?.current_value ?? 0),
          Number(i.ownership_pct ?? 0),
        ) -
          Number(i.approved_amount ?? 0)),
      0,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description="Rental income distributions and the growth of your capital."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Banknote} label="Rental income (paid)" value={fmtNGN(totalRental)} />
        <StatCard icon={Clock3} label="Rental income (pending)" value={fmtNGN(pending)} />
        <StatCard
          icon={TrendingUp}
          label="Capital appreciation"
          value={fmtNGN(appreciation)}
          sub={appreciation >= 0 ? "Unrealised gain" : "Unrealised loss"}
          subTone={appreciation >= 0 ? "positive" : "negative"}
        />
      </div>

      <DashCard
        title="Distribution history"
        description="Every rental payout recorded for your holdings"
        noPadding
      >
        {payouts.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No distributions yet"
            body="Rental payouts appear here once your income-generating properties distribute."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Property</TableHead>
                <TableHead>Ownership at payout</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-navy">
                    {p.tokenized_properties?.name ?? p.property_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{fmtPct(p.ownership_pct_snapshot)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-navy">
                    {fmtNGN(p.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {fmtDate(p.paid_at ?? p.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DashCard>
    </div>
  );
}
