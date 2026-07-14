import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Home,
  Landmark,
  LineChart,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader, PortalShell, fmtNaira as fmt } from "@/components/portal/PortalShell";
import rubysImg from "@/assets/rubys-apartment.jpg";
import terraceImg from "@/assets/lillycrest-terrace.jpg";
import plotsImg from "@/assets/estate-plots.jpg";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Investor Dashboard | Kay-Steph Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const holdings = [
  { name: "Ruby's Apartment", img: rubysImg, contributed: 14_000_000, ownership: "10.00%", shareValue: 15_400_000, status: "approved" as const },
  { name: "Lillycrest Terrace", img: terraceImg, contributed: 12_500_000, ownership: "5.00%", shareValue: 13_125_000, status: "approved" as const },
  { name: "Estate Plots — Phase II", img: plotsImg, contributed: 4_000_000, ownership: "0.00%", shareValue: 0, status: "pending" as const },
];

const activity = [
  { kind: "Contribution", property: "Ruby's Apartment", date: "04 Nov 2025", amount: -14_000_000 },
  { kind: "Contribution", property: "Lillycrest Terrace", date: "09 Feb 2026", amount: -12_500_000 },
  { kind: "Rental Distribution", property: "Ruby's Apartment", date: "28 Jun 2026", amount: 220_000 },
  { kind: "Rental Distribution", property: "Ruby's Apartment", date: "28 May 2026", amount: 235_000 },
  { kind: "Rental Distribution", property: "Ruby's Apartment", date: "28 Apr 2026", amount: 205_000 },
];

const rentalBars = [
  { m: "Feb 26", v: 210_000 },
  { m: "Mar 26", v: 205_000 },
  { m: "Apr 26", v: 195_000 },
  { m: "May 26", v: 235_000 },
  { m: "Jun 26", v: 220_000 },
];

const allocation = [
  { name: "Ruby's Apartment", value: 15_400_000, color: "#03132f" },
  { name: "Lillycrest Terrace", value: 13_125_000, color: "#f7bd17" },
];

function DashboardPage() {
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? null);
      setName(
        (u.user_metadata?.full_name as string | undefined) ??
          (u.user_metadata?.name as string | undefined) ??
          null,
      );
    });
  }, []);
  const firstName = useMemo(
    () => (name ? name.split(" ")[0] : email?.split("@")[0] ?? "Demo"),
    [name, email],
  );

  const totalInvested = 26_500_000;
  const currentValue = 28_525_000;
  const wallet = 745_000;
  const rentalEarned = 1_115_000;
  const gain = currentValue - totalInvested;
  const gainPct = (gain / totalInvested) * 100;

  return (
    <PortalShell>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Your portfolio at a glance — balances, holdings and recent activity."
        actions={
          <>
            <Link
              to="/opportunities"
              className="inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy/90"
            >
              <Plus className="h-4 w-4" /> New investment
            </Link>
            <Link
              to="/statements"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy/15 bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-cream"
            >
              <Download className="h-4 w-4" /> Statement
            </Link>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Invested" value={fmt(totalInvested)} icon={Home} />
        <KpiCard
          label="Current Value"
          value={fmt(currentValue)}
          icon={TrendingUp}
          foot={
            <span className="text-xs font-semibold text-emerald-600">
              {fmt(gain, { sign: true })} (+{gainPct.toFixed(1)}%)
            </span>
          }
        />
        <KpiCard label="Wallet Balance" value={fmt(wallet)} icon={Wallet} />
        <KpiCard
          label="Rental Earned"
          value={fmt(rentalEarned)}
          icon={Landmark}
          foot={<span className="text-xs text-navy/60">2 active holdings</span>}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-lg font-bold text-navy">Portfolio allocation</h2>
          <p className="text-xs text-navy/60">Current share value by property</p>
          <div className="mt-6 flex items-center gap-8">
            <Donut data={allocation} />
            <ul className="flex-1 space-y-3 text-sm">
              {allocation.map((a) => (
                <li key={a.name} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                  <span className="flex-1 font-semibold text-navy">{a.name}</span>
                  <span className="font-bold text-navy">{fmt(a.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-navy">Rental income</h2>
              <p className="text-xs text-navy/60">Paid distributions by month</p>
            </div>
            <LineChart className="h-4 w-4 text-navy/40" />
          </div>
          <div className="mt-6 flex h-44 items-end gap-4 px-2">
            {rentalBars.map((b) => {
              const max = Math.max(...rentalBars.map((x) => x.v));
              const h = (b.v / max) * 100;
              return (
                <div key={b.m} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-gold" style={{ height: `${h}%` }} title={fmt(b.v)} />
                  <span className="text-[10px] font-semibold text-navy/60">{b.m}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">My holdings</h2>
            <p className="text-xs text-navy/60">Every investment and its current position</p>
          </div>
          <Link to="/my-properties" className="text-xs font-bold text-navy hover:text-gold">
            View all →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-navy/5">
          {holdings.map((h) => (
            <li key={h.name} className="flex flex-wrap items-center gap-4 py-4">
              <img src={h.img} alt="" className="h-14 w-16 rounded-md object-cover ring-1 ring-navy/10" />
              <div className="min-w-[200px] flex-1">
                <p className="font-bold text-navy">{h.name}</p>
                <p className="mt-0.5 text-xs text-navy/60">
                  Contributed <span className="font-bold text-navy">{fmt(h.contributed)}</span>
                  <span className="mx-2 text-navy/25">·</span>
                  Ownership <span className="font-bold text-navy">{h.ownership}</span>
                  <span className="mx-2 text-navy/25">·</span>
                  Share value <span className="font-bold text-navy">{fmt(h.shareValue)}</span>
                </p>
              </div>
              {h.status === "approved" ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                  Approved
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                  Awaiting company approval
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-navy">Recent activity</h2>
          <Link to="/transactions" className="text-xs font-bold text-navy hover:text-gold">
            All transactions →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-navy/5">
          {activity.map((a, i) => (
            <li key={i} className="flex items-center justify-between py-4">
              <div>
                <p className="font-bold text-navy">{a.kind}</p>
                <p className="text-xs text-navy/60">{a.property} · {a.date}</p>
              </div>
              <span className={`font-bold ${a.amount < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {fmt(a.amount, { sign: true })}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-navy p-5 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-[240px]">
          <p className="font-serif text-base font-bold">Speak with your Kay-Steph advisor</p>
          <p className="text-xs text-white/70">
            Tailored strategy across full purchase, group buy and tokenized ownership.
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-xs font-bold text-gold-foreground hover:bg-gold/90"
        >
          Book a call
        </Link>
      </div>

      <p className="mt-10 text-center text-[11px] text-navy/40">
        © {new Date().getFullYear()} Kay-Steph Group · Client Portal · v1.0
      </p>
    </PortalShell>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  foot,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  foot?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-navy/50">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream text-navy">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl font-bold text-navy">{value}</p>
      {foot && <div className="mt-2">{foot}</div>}
    </div>
  );
}

function Donut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 60;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
      <circle cx="80" cy="80" r={R} fill="none" stroke="oklch(0.94 0.01 260)" strokeWidth="22" />
      {data.map((d, i) => {
        const frac = d.value / total;
        const len = C * frac;
        const el = (
          <circle
            key={i}
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke={d.color}
            strokeWidth="22"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}
