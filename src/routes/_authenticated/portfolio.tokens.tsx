import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Coins, Layers, TrendingUp } from "lucide-react";
import { getMyPortfolio } from "@/lib/invest.functions";
import { fmtNGN, TOKEN_STATUS_LABEL } from "@/lib/invest";
import {
  DashCard,
  EmptyState,
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

export const Route = createFileRoute("/_authenticated/portfolio/tokens")({
  component: Tokens,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function Tokens() {
  const { data } = useQuery({ queryKey: ["portfolio"], queryFn: () => getMyPortfolio() });
  const tokens = (data?.tokens ?? []) as any[];
  const invs = (data?.investments ?? []) as any[];
  const propMap = new Map(invs.map((i) => [i.property_id, i.tokenized_properties]));

  const enriched = tokens.map((t) => {
    const prop: any = propMap.get(t.property_id);
    const currentUnit = prop
      ? Math.round(Number(prop.current_value) / (Number(prop.initial_value) / Number(t.unit_value)))
      : Number(t.unit_value);
    return { ...t, prop, currentUnit, totalValue: currentUnit * Number(t.tokens_count) };
  });

  const totalTokens = enriched.reduce((sum, t) => sum + Number(t.tokens_count), 0);
  const totalValue = enriched.reduce((sum, t) => sum + t.totalValue, 0);
  const totalCost = enriched.reduce(
    (sum, t) => sum + Number(t.unit_value) * Number(t.tokens_count),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tokens"
        description="Your ownership units across all tokenized properties."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Layers} label="Total tokens" value={String(totalTokens)} />
        <StatCard icon={Coins} label="Current value" value={fmtNGN(totalValue)} />
        <StatCard
          icon={TrendingUp}
          label="Unrealised gain"
          value={fmtNGN(totalValue - totalCost)}
          subTone={totalValue - totalCost >= 0 ? "positive" : "negative"}
          sub={
            totalCost > 0
              ? `${(((totalValue - totalCost) / totalCost) * 100).toFixed(1)}% vs purchase`
              : undefined
          }
        />
      </div>

      <DashCard title="Token holdings" noPadding>
        {enriched.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No tokens yet"
            body="Tokens are issued when an investment in a tokenized property is approved."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Purchase unit</TableHead>
                <TableHead className="text-right">Current unit</TableHead>
                <TableHead className="text-right">Total value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enriched.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-navy">
                    {t.prop?.name ?? t.property_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{t.tokens_count}</TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600">
                    {fmtNGN(t.unit_value)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600">
                    {fmtNGN(t.currentUnit)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-navy">
                    {fmtNGN(t.totalValue)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={t.status}
                      label={TOKEN_STATUS_LABEL[t.status] ?? t.status}
                    />
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
