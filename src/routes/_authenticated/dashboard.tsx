import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  FileCheck2,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PieChart,
  Plus,
  Receipt,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Investor Dashboard | Kay-Steph Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

/* ─────────────── Nav config ─────────────── */

const primaryNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Portfolio", href: "/dashboard", icon: PieChart, soon: true },
  { label: "Wallet", href: "/dashboard", icon: Wallet, soon: true },
  { label: "Transactions", href: "/dashboard", icon: Receipt, soon: true },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Invest", href: "/invest", icon: TrendingUp },
];

const secondaryNav = [
  { label: "KYC & Verification", href: "/dashboard", icon: FileCheck2, soon: true },
  { label: "Statements", href: "/dashboard", icon: ScrollText, soon: true },
  { label: "Certificates", href: "/dashboard", icon: ShieldCheck, soon: true },
  { label: "Settings", href: "/dashboard", icon: Settings, soon: true },
  { label: "Help & Support", href: "/contact", icon: LifeBuoy },
];

/* ─────────────── Helpers ─────────────── */

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

/* ─────────────── Page ─────────────── */

function DashboardPage() {
  const navigate = useNavigate();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);

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

  const firstName = useMemo(() => (name ? name.split(" ")[0] : email?.split("@")[0] ?? "Investor"), [name, email]);
  const initials = useMemo(() => {
    const src = name ?? email ?? "K S";
    return src
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [name, email]);

  // Placeholder financials — will be wired in Phase 3/4
  const portfolioValue = 0;
  const walletBalance = 0;
  const totalInvested = 0;
  const totalReturns = 0;
  const activeInvestments = 0;

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.005_260)] text-foreground">
      {/* ───── Sidebar ───── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-navy/10 bg-navy text-white lg:flex">
        <Link to="/" className="flex items-center gap-3 px-6 pb-5 pt-6">
          <img src={logoImg} alt="" className="h-10 w-10" width={40} height={40} />
          <div className="leading-tight">
            <div className="font-serif text-lg font-bold">Kay-Steph</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
              Investor Portal
            </div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <p className="mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
            Banking
          </p>
          <ul className="mt-2 space-y-0.5">
            {primaryNav.map((item) => (
              <NavRow key={item.label} {...item} />
            ))}
          </ul>

          <p className="mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
            Account
          </p>
          <ul className="mt-2 space-y-0.5">
            {secondaryNav.map((item) => (
              <NavRow key={item.label} {...item} />
            ))}
          </ul>
        </nav>

        <div className="m-3 rounded-xl bg-gradient-to-br from-gold/15 to-white/5 p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Concierge</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-white/75">
            Speak with a Kay-Steph advisor for tailored investment strategy.
          </p>
          <a
            href="/contact"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-gold px-3 py-2 text-xs font-bold text-gold-foreground hover:bg-gold/90"
          >
            Book a call
          </a>
        </div>
      </aside>

      {/* ───── Main column ───── */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src={logoImg} alt="" className="h-8 w-8" />
              <span className="font-serif text-base font-bold text-navy">Kay-Steph</span>
            </Link>

            <div className="hidden max-w-md flex-1 md:block">
              <label className="flex items-center gap-2 rounded-full border border-navy/10 bg-cream/60 px-4 py-2">
                <Search className="h-4 w-4 text-navy/50" />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-navy/40"
                  placeholder="Search properties, transactions, statements…"
                />
                <kbd className="rounded border border-navy/10 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-navy/60">
                  ⌘K
                </kbd>
              </label>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-navy/10 bg-white text-navy hover:bg-cream"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold ring-2 ring-white" />
              </button>
              <button
                type="button"
                className="hidden h-10 items-center gap-2 rounded-full border border-navy/10 bg-white px-3 text-sm font-semibold text-navy hover:bg-cream sm:inline-flex"
              >
                <HelpCircle className="h-4 w-4" /> Help
              </button>
              <div className="ml-1 flex items-center gap-3 rounded-full border border-navy/10 bg-white py-1 pl-1 pr-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
                  {initials || "KS"}
                </span>
                <div className="hidden text-left leading-tight sm:block">
                  <div className="text-xs font-semibold text-navy">{firstName}</div>
                  <div className="text-[10px] text-navy/50">Investor · Tier 1</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 hidden text-navy/50 hover:text-navy sm:block"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Greeting + KYC alert */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                Overview
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-navy sm:text-4xl">
                Good day, {firstName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here's the current position of your Kay-Steph investments.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-sm ring-1 ring-navy/10">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Portal secure · TLS 1.3
            </div>
          </div>

          {/* KYC banner */}
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/5 to-white p-4 sm:p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-[240px]">
              <p className="text-sm font-bold text-navy">Complete your KYC to unlock investing</p>
              <p className="text-xs text-navy/70">
                Verify your identity and address to fund your wallet and subscribe to properties.
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy/90">
              Start verification <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Hero + stats row */}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {/* Portfolio value card */}
            <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white shadow-xl lg:col-span-2">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
              <div className="pointer-events-none absolute right-6 top-6 opacity-10">
                <img src={logoImg} alt="" className="h-24 w-24" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
                    Total Portfolio Value
                  </p>
                  <button
                    onClick={() => setShowBalance((v) => !v)}
                    className="text-white/60 hover:text-white"
                    aria-label={showBalance ? "Hide balance" : "Show balance"}
                  >
                    {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <span className="font-serif text-4xl font-bold sm:text-5xl">
                    {showBalance ? fmt(portfolioValue) : "₦ ••••••"}
                  </span>
                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-bold text-emerald-300">
                    <TrendingUp className="h-3 w-3" /> +0.00%
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/60">Updated just now · NGN</p>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                  <MiniStat label="Invested" value={showBalance ? fmt(totalInvested) : "₦ •••"} />
                  <MiniStat label="Returns" value={showBalance ? fmt(totalReturns) : "₦ •••"} accent />
                  <MiniStat label="Active deals" value={String(activeInvestments)} />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <ActionBtn icon={Plus} label="Top up wallet" primary />
                  <ActionBtn icon={ArrowUpRight} label="Withdraw" />
                  <ActionBtn icon={CircleDollarSign} label="Invest" />
                  <ActionBtn icon={ScrollText} label="Statements" />
                </div>
              </div>
            </div>

            {/* Wallet card */}
            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-navy/50">
                  Wallet balance
                </p>
                <Wallet className="h-4 w-4 text-navy/40" />
              </div>
              <p className="mt-3 font-serif text-3xl font-bold text-navy">
                {showBalance ? fmt(walletBalance) : "₦ ••••••"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Available to invest</p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-1.5 rounded-md bg-navy px-3 py-2.5 text-xs font-bold text-white hover:bg-navy/90">
                  <ArrowDownLeft className="h-3.5 w-3.5" /> Deposit
                </button>
                <button className="flex items-center justify-center gap-1.5 rounded-md border border-navy/15 bg-white px-3 py-2.5 text-xs font-bold text-navy hover:bg-cream">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Withdraw
                </button>
              </div>

              <div className="mt-5 rounded-lg bg-cream p-3 text-xs text-navy/70">
                <div className="flex items-center gap-2 font-semibold text-navy">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> NDIC-inspired safeguard
                </div>
                <p className="mt-1 leading-5">
                  Client funds are held in a segregated trust account, ring-fenced from operational
                  capital.
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio + activity */}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-navy">Holdings</h2>
                  <p className="text-xs text-muted-foreground">Property-backed tokens you own</p>
                </div>
                <Link to="/properties" className="text-xs font-bold text-navy hover:text-gold">
                  Browse properties →
                </Link>
              </div>

              <EmptyState
                icon={Building2}
                title="No holdings yet"
                body="Once you subscribe to a property, your tokens, ownership %, and valuation will appear here."
                cta={{ label: "Explore opportunities", href: "/invest" }}
              />
            </div>

            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-navy">Recent activity</h2>
                  <p className="text-xs text-muted-foreground">Deposits, allocations, payouts</p>
                </div>
              </div>
              <EmptyState
                icon={Receipt}
                title="Nothing yet"
                body="Your transaction history will appear here."
                compact
              />
            </div>
          </div>

          {/* Modules grid */}
          <div className="mt-6">
            <h2 className="font-serif text-lg font-bold text-navy">Portal modules</h2>
            <p className="text-xs text-muted-foreground">Everything you need to manage your investments.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "KYC verification", desc: "Submit ID and address to unlock investing.", icon: FileCheck2, tag: "Next up" },
                { title: "Portfolio analytics", desc: "Token allocation, ownership %, valuation.", icon: PieChart, tag: "Phase 3" },
                { title: "Wallet & payouts", desc: "Deposits, withdrawals, distributions.", icon: Wallet, tag: "Phase 4" },
                { title: "Transaction ledger", desc: "Immutable history of every movement.", icon: Receipt, tag: "Phase 3" },
                { title: "Statements", desc: "Quarterly PDF statements, tax-ready.", icon: ScrollText, tag: "Phase 4" },
                { title: "Ownership certificates", desc: "Digital certificates per holding.", icon: ShieldCheck, tag: "Phase 4" },
              ].map((m) => (
                <div
                  key={m.title}
                  className="group rounded-xl border border-navy/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-gold">
                      <m.icon className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy/70">
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-base font-bold text-navy">{m.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 text-center text-[11px] text-navy/40">
            © {new Date().getFullYear()} Kay-Steph Group · Investor Portal · v1.0
          </p>
        </main>
      </div>
    </div>
  );
}

/* ─────────────── Subcomponents ─────────────── */

function NavRow({
  label,
  href,
  icon: Icon,
  soon,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === href && label === "Overview";
  return (
    <li>
      <Link
        to={href}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-white/10 text-white ring-1 ring-white/10"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className={`h-4 w-4 ${active ? "text-gold" : "text-white/50 group-hover:text-gold"}`} />
        <span className="flex-1">{label}</span>
        {soon && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
            Soon
          </span>
        )}
      </Link>
    </li>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</p>
      <p className={`mt-1 font-serif text-lg font-bold ${accent ? "text-gold" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
        primary
          ? "bg-gold text-gold-foreground hover:bg-gold/90"
          : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  compact?: boolean;
}) {
  return (
    <div
      className={`mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-navy/15 bg-cream/40 text-center ${
        compact ? "p-6" : "p-10"
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy shadow-sm ring-1 ring-navy/10">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-serif text-base font-bold text-navy">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{body}</p>
      {cta && (
        <Link
          to={cta.href}
          className="mt-4 inline-flex items-center gap-1 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy/90"
        >
          {cta.label} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
