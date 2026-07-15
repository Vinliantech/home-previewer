import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Building2,
  Home,
  PieChart as PieChartIcon,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMyPortfolio, getMyTransactions } from "@/lib/invest.functions";
import { currentShareValue, fmtNGN, fmtPct, INVESTMENT_STATUS_LABEL } from "@/lib/invest";
import {
  DashCard,
  EmptyState,
  fmtDate,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/portfolio/kit";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_NAME, isDemoActive } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated/portfolio/")({
  component: Overview,
});

const CHART_COLORS = ["#0b1240", "#d4a53a", "#3b6ea5", "#7a8fb5", "#b8893a", "#4a5578"];

/* eslint-disable @typescript-eslint/no-explicit-any */

function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => getMyPortfolio(),
  });
  const { data: txData } = useQuery({ queryKey: ["txns"], queryFn: () => getMyTransactions() });
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (isDemoActive()) {
      setFirstName(DEMO_NAME.split(" ")[0]);
      return;
    }
    supabase.auth.getUser().then(({ data: authData }) => {
      const name = (authData.user?.user_metadata?.full_name as string) ?? "";
      setFirstName(name.split(" ")[0] ?? "");
    });
  }, []);

  const invs = (data?.investments ?? []) as any[];
  const approved = invs.filter((i) => i.status === "approved");
  const totalInvested = approved.reduce((sum, i) => sum + Number(i.approved_amount ?? 0), 0);
  const currentValue = approved.reduce(
    (sum, i) =>
      sum +
      currentShareValue(
        Number(i.tokenized_properties?.current_value ?? 0),
        Number(i.ownership_pct ?? 0),
      ),
    0,
  );
  const gain = currentValue - totalInvested;
  const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
  const payouts = (data?.payouts ?? []) as any[];
  const totalRental = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const walletBalance = Number(data?.wallet?.available_balance ?? 0);

  const allocation = approved.map((i, index) => ({
    name: i.tokenized_properties?.name ?? "Property",
    value: currentShareValue(
      Number(i.tokenized_properties?.current_value ?? 0),
      Number(i.ownership_pct ?? 0),
    ),
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Rental income grouped by month (last 6 months with data).
  const incomeByMonth = new Map<string, number>();
  for (const p of payouts.filter((p) => p.status === "paid")) {
    const d = new Date(p.paid_at ?? p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + Number(p.amount));
  }
  const incomeSeries = [...incomeByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => ({
      month: new Date(`${key}-01`).toLocaleDateString("en-NG", {
        month: "short",
        year: "2-digit",
      }),
      amount: value,
    }));

  const recentTx = ((txData?.transactions ?? []) as any[]).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Your portfolio at a glance — balances, holdings and recent activity."
        actions={
          <>
            <Link
              to="/portfolio/opportunities"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-bold text-white hover:bg-navy/90"
            >
              <Plus className="h-4 w-4" /> New investment
            </Link>
            <Link
              to="/portfolio/statements"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-navy hover:border-navy"
            >
              <ArrowDownToLine className="h-4 w-4" /> Statement
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Home} label="Total invested" value={fmtNGN(totalInvested)} />
        <StatCard
          icon={TrendingUp}
          label="Current value"
          value={fmtNGN(currentValue)}
          sub={`${gain >= 0 ? "+" : ""}${fmtNGN(gain)} (${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%)`}
          subTone={gain >= 0 ? "positive" : "negative"}
        />
        <StatCard icon={Wallet} label="Wallet balance" value={fmtNGN(walletBalance)} />
        <StatCard
          icon={Building2}
          label="Rental earned"
          value={fmtNGN(totalRental)}
          sub={`${approved.length} active holding${approved.length === 1 ? "" : "s"}`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DashCard
          title="Portfolio allocation"
          description="Current share value by property"
          noPadding
        >
          {allocation.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="No active holdings yet"
              body="Your allocation chart appears once your first investment is approved."
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-5 sm:flex-row">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {allocation.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmtNGN(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2">
                {allocation.map((entry) => (
                  <li key={entry.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-600">{entry.name}</span>
                    <span className="font-semibold tabular-nums text-navy">
                      {fmtNGN(entry.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DashCard>

        <DashCard title="Rental income" description="Paid distributions by month" noPadding>
          {incomeSeries.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No distributions yet"
              body="Once your properties start paying rental income, the history appears here."
            />
          ) : (
            <div className="h-56 p-5 pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeSeries} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => fmtNGN(value)}
                    cursor={{ fill: "#f1f5f9" }}
                  />
                  <Bar dataKey="amount" fill="#d4a53a" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashCard>
      </div>

      {/* Holdings */}
      <DashCard
        title="My holdings"
        description="Every investment and its current position"
        action={
          <Link
            to="/portfolio/properties"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
        noPadding
      >
        {isLoading && <div className="p-5 text-sm text-slate-500">Loading holdings…</div>}
        {!isLoading && invs.length === 0 && (
          <EmptyState
            icon={Building2}
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
        )}
        <div className="divide-y divide-slate-100">
          {invs.map((i: any) => {
            const share = currentShareValue(
              Number(i.tokenized_properties?.current_value ?? 0),
              Number(i.ownership_pct ?? 0),
            );
            return (
              <div key={i.id} className="flex items-center gap-4 px-5 py-4">
                <div className="hidden h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:block">
                  {i.tokenized_properties?.images?.[0] && (
                    <img
                      src={i.tokenized_properties.images[0]}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-navy">
                    {i.tokenized_properties?.name}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    <span>
                      Contributed{" "}
                      <b className="text-slate-700">
                        {fmtNGN(i.approved_amount ?? i.proposed_amount)}
                      </b>
                    </span>
                    <span>
                      Ownership <b className="text-slate-700">{fmtPct(i.ownership_pct ?? 0)}</b>
                    </span>
                    <span>
                      Share value <b className="text-slate-700">{fmtNGN(share)}</b>
                    </span>
                  </div>
                </div>
                <StatusBadge
                  status={i.status}
                  label={INVESTMENT_STATUS_LABEL[i.status] ?? i.status}
                />
              </div>
            );
          })}
        </div>
      </DashCard>

      {/* Recent activity */}
      <DashCard
        title="Recent activity"
        action={
          <Link
            to="/portfolio/transactions"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold"
          >
            All transactions <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
        noPadding
      >
        {recentTx.length === 0 ? (
          <EmptyState icon={Wallet} title="No activity yet" />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTx.map((t: any) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold capitalize text-navy">
                    {String(t.type).replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t.tokenized_properties?.name ?? "Portfolio"} · {fmtDate(t.created_at)}
                  </div>
                </div>
                <div
                  className={`font-semibold tabular-nums ${
                    Number(t.amount) < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {fmtNGN(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashCard>
    </div>
  );
}
