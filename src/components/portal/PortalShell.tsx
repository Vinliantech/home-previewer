import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Award,
  Bell,
  Briefcase,
  ChevronDown,
  Coins,
  DoorOpen,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";

type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string;
  badge?: number;
};
type NavSection = { title?: string; items: NavItem[] };

const navSections: NavSection[] = [
  { items: [{ label: "Overview", icon: LayoutDashboard, to: "/dashboard" }] },
  {
    title: "Invest",
    items: [
      { label: "Opportunities", icon: Briefcase, to: "/opportunities" },
      { label: "My Properties", icon: Home, to: "/my-properties" },
      { label: "My Tokens", icon: Coins, to: "/my-tokens" },
    ],
  },
  {
    title: "Money",
    items: [
      { label: "Returns", icon: TrendingUp, to: "/returns" },
      { label: "Wallet", icon: Wallet, to: "/wallet" },
      { label: "Transactions", icon: Receipt, to: "/transactions" },
      { label: "Statements", icon: ScrollText, to: "/statements" },
    ],
  },
  {
    title: "Documents",
    items: [
      { label: "Certificates", icon: Award, to: "/certificates" },
      { label: "Exit Requests", icon: DoorOpen, to: "/exit-requests" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "KYC Verification", icon: ShieldCheck, to: "/kyc" },
      { label: "Profile & Security", icon: UserCircle2, to: "/profile" },
      { label: "Notifications", icon: Bell, to: "/notifications", badge: 2 },
      { label: "Support", icon: LifeBuoy, to: "/support" },
    ],
  },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

  const displayName = name ?? email?.split("@")[0] ?? "Demo Client";
  const initials = useMemo(
    () =>
      displayName
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join(""),
    [displayName],
  );

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.006_260)] text-navy">
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
                {section.items.map((item) => {
                  const active = pathname === item.to;
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "bg-navy text-white shadow-sm"
                            : "text-navy/75 hover:bg-cream"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${
                            active ? "text-gold" : "text-navy/50 group-hover:text-navy"
                          }`}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src={logoImg} alt="" className="h-8 w-8" />
              <span className="font-serif text-base font-bold text-navy">Kay-Steph</span>
            </Link>
            <p className="hidden text-sm font-semibold text-navy/70 sm:block">{dateStr}</p>

            <div className="ml-auto flex items-center gap-3">
              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-navy/10 bg-white text-navy hover:bg-cream"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-gold-foreground">
                  2
                </span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-navy/10 bg-white py-1 pl-1 pr-3 hover:bg-cream"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
                  {initials || "DC"}
                </span>
                <span className="text-sm font-bold text-navy">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-navy/50" />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-navy/10 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export const fmtNaira = (n: number, opts?: { sign?: boolean }) => {
  const s = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
  if (opts?.sign) return `${n < 0 ? "-" : "+"}${s}`;
  return `${n < 0 ? "-" : ""}${s}`;
};
