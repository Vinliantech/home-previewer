import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Bell,
  Building2,
  ChevronDown,
  Download,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  LogOut,
  type LucideIcon,
  Plus,
  Receipt,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCircle2,
  Wallet,
  Home,
  Coins,
  Briefcase,
  DoorOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";
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

/* ─────────────── Nav ─────────────── */

type NavItem = { label: string; icon: LucideIcon; badge?: number; active?: boolean };
type NavSection = { title?: string; items: NavItem[] };

const navSections: NavSection[] = [
  { items: [{ label: "Overview", icon: LayoutDashboard, active: true }] },
  {
    title: "Invest",
    items: [
      { label: "Opportunities", icon: Briefcase },
      { label: "My Properties", icon: Home },
      { label: "My Tokens", icon: Coins },
    ],
  },
  {
    title: "Money",
    items: [
      { label: "Returns", icon: TrendingUp },
      { label: "Wallet", icon: Wallet },
      { label: "Transactions", icon: Receipt },
      { label: "Statements", icon: ScrollText },
    ],
  },
  {
    title: "Documents",
    items: [
      { label: "Certificates", icon: Award },
      { label: "Exit Requests", icon: DoorOpen },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "KYC Verification", icon: ShieldCheck },
      { label: "Profile & Security", icon: UserCircle2 },
      { label: "Notifications", icon: Bell, badge: 2 },
      { label: "Support", icon: LifeBuoy },
    ],
  },
];

/* ─────────────── Demo data ─────────────── */

const fmt = (n: number, opts?: { sign?: boolean }) => {
  const s = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
  if (opts?.sign) return `${n < 0 ? "-" : "+"}${s}`;
  return `${n < 0 ? "-" : ""}${s}`;
};

const holdings = [
  {
    name: "Ruby's Apartment",
    img: rubysImg,
    contributed: 14_000_000,
    ownership: "10.00%",
    shareValue: 15_400_000,
    status: "approved" as const,
  },
  {
    name: "Lillycrest Terrace",
    img: terraceImg,
    contributed: 12_500_000,
    ownership: "5.00%",
    shareValue: 13_125_000,
    status: "approved" as const,
  },
  {
    name: "Estate Plots — Phase II",
    img: plotsImg,
    contributed: 4_000_000,
    ownership: "0.00%",
    shareValue: 0,
    status: "pending" as const,
  },
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

/* ─────────────── Page ─────────────── */

function DashboardPage() {
  const navigate = useNavigate();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const displayName = name ?? "Demo Client";
  const firstName = useMemo(
    () => (name ? name.split(" ")[0] : email?.split("@")[0] ?? "Demo"),
    [name, email],
  );
  const initials = useMemo(() => {
    const src = displayName;
    return src
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalInvested = 26_500_000;
  const currentValue = 28_525_000;
  const wallet = 745_000;
  const rentalEarned = 1_115_000;
  const gain = currentValue - totalInvested;
  const gainPct = (gain / totalInvested) * 100;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.006_260)] text-navy">
      {/* ───── Sidebar ───── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-navy/10 bg-white lg:flex">
        <Link to="/" className="flex items-center gap-3 px-6 pb-5 pt-6">
          <img src={logoImg} alt="" className="h-10 w-10" width={40} height={40} />
          <div className="leading-tight">
            <div className="font-serif text-lg font-bold text-navy">Kay-Steph</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-navy/50">
              Client Portal
            </div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {navSections.map((section, i) => (
            <div key={i} className={i === 0 ? "" : "mt-5"}>
              {section.title && (
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-navy/40">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        item.active
                          ? "bg-navy text-white shadow-sm"
                          : "text-navy/75 hover:bg-cream"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${
                          item.active ? "text-gold" : "text-navy/50 group-hover:text-navy"
                        }`}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="mx-3 mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-navy/70 hover:bg-cream"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      {/* ───── Main ───── */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src={logoImg} alt="" className="h-8 w-8" />
              <span className="font-serif text-base font-bold text-navy">Kay-Steph</span>
            </Link>
            <p className="hidden text-sm font-semibold text-navy/70 sm:block">{dateStr}</p>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-navy/10 bg-white text-navy hover:bg-cream"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-gold-foreground">
                  2
                </span>
              </button>
              <div className="flex items-center gap-2 rounded-full border border-navy/10 bg-white py-1 pl-1 pr-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
                  {initials || "DC"}
                </span>
                <span className="text-sm font-bold text-navy">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-navy/50" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Greeting */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-navy sm:text-4xl">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1 text-sm text-navy/60">
                Your portfolio at a glance — balances, holdings and recent activity.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy/90">
                <Plus className="h-4 w-4" /> New investment
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-navy/15 bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-cream">
                <Download className="h-4 w-4" /> Statement
              </button>
            </div>
          </div>

          {/* KPIs */}
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

          {/* Charts */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Allocation */}
            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-navy">Portfolio allocation</h2>
              <p className="text-xs text-navy/60">Current share value by property</p>
              <div className="mt-6 flex items-center gap-8">
                <Donut data={allocation} />
                <ul className="flex-1 space-y-3 text-sm">
                  {allocation.map((a) => (
                    <li key={a.name} className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: a.color }}
                      />
                      <span className="flex-1 font-semibold text-navy">{a.name}</span>
                      <span className="font-bold text-navy">{fmt(a.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bars */}
            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
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
                      <div
                        className="w-full rounded-t-md bg-gold"
                        style={{ height: `${h}%` }}
                        title={fmt(b.v)}
                      />
                      <span className="text-[10px] font-semibold text-navy/60">{b.m}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div className="mt-5 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-navy">My holdings</h2>
                <p className="text-xs text-navy/60">Every investment and its current position</p>
              </div>
              <button className="text-xs font-bold text-navy hover:text-gold">View all →</button>
            </div>
            <ul className="mt-4 divide-y divide-navy/5">
              {holdings.map((h) => (
                <li key={h.name} className="flex flex-wrap items-center gap-4 py-4">
                  <img
                    src={h.img}
                    alt=""
                    className="h-14 w-16 rounded-md object-cover ring-1 ring-navy/10"
                  />
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
          </div>

          {/* Recent activity */}
          <div className="mt-5 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-navy">Recent activity</h2>
              <button className="text-xs font-bold text-navy hover:text-gold">
                All transactions →
              </button>
            </div>
            <ul className="mt-4 divide-y divide-navy/5">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-bold text-navy">{a.kind}</p>
                    <p className="text-xs text-navy/60">
                      {a.property} · {a.date}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      a.amount < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {fmt(a.amount, { sign: true })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Concierge strip */}
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
        </main>
      </div>
    </div>
  );
}

/* ─────────────── Bits ─────────────── */

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
