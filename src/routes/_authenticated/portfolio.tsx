import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Bell,
  Building2,
  ChevronDown,
  Coins,
  DoorOpen,
  FileBarChart2,
  FileText,
  Headset,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserRound,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_EMAIL, DEMO_NAME, disableDemo, isDemoActive } from "@/lib/demo";
import { getMyKyc, getMyNotifications } from "@/lib/invest.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImg from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [{ title: "Client Portal — Kay-Steph Group" }, { name: "robots", content: "noindex" }],
  }),
  component: PortfolioLayout,
});

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };

const navGroups: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ to: "/portfolio", label: "Overview", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Invest",
    items: [
      { to: "/portfolio/opportunities", label: "Opportunities", icon: Building2 },
      { to: "/portfolio/properties", label: "My Properties", icon: Home },
      { to: "/portfolio/tokens", label: "My Tokens", icon: Coins },
      { to: "/portfolio/pools", label: "Group Pools", icon: UsersRound },
    ],
  },
  {
    label: "Money",
    items: [
      { to: "/portfolio/returns", label: "Returns", icon: TrendingUp },
      { to: "/portfolio/wallet", label: "Wallet", icon: Wallet },
      { to: "/portfolio/transactions", label: "Transactions", icon: Receipt },
      { to: "/portfolio/statements", label: "Statements", icon: FileBarChart2 },
    ],
  },
  {
    label: "Documents",
    items: [
      { to: "/portfolio/certificates", label: "Certificates", icon: Award },
      { to: "/portfolio/exit-requests", label: "Exit Requests", icon: DoorOpen },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/portfolio/kyc", label: "KYC Verification", icon: ShieldCheck },
      { to: "/portfolio/profile", label: "Profile & Security", icon: UserRound },
      { to: "/portfolio/notifications", label: "Notifications", icon: Bell },
      { to: "/portfolio/support", label: "Support", icon: Headset },
    ],
  },
];

function PortfolioLayout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const demo = isDemoActive();

  useEffect(() => {
    if (demo) {
      setUser({ email: DEMO_EMAIL, name: DEMO_NAME });
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? "",
          name: (data.user.user_metadata?.full_name as string) ?? "",
        });
      }
    });
  }, [demo]);

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [loc.pathname]);

  const { data: notifData } = useQuery({
    queryKey: ["notifs"],
    queryFn: () => getMyNotifications(),
  });
  const unread = ((notifData?.notifications ?? []) as { read_at: string | null }[]).filter(
    (n) => !n.read_at,
  ).length;

  const { data: kycData } = useQuery({ queryKey: ["kyc"], queryFn: () => getMyKyc() });
  const kycStatus = kycData?.kyc?.kyc_status ?? "not_submitted";
  const showKycBanner = kycStatus !== "verified" && loc.pathname !== "/portfolio/kyc";

  async function signOut() {
    if (demo) {
      disableDemo();
    } else {
      await supabase.auth.signOut();
    }
    navigate({ to: "/auth", replace: true });
  }

  const initials = (user?.name || user?.email || "C")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"
        aria-label="Kay-Steph Group home"
      >
        <img src={logoImg} alt="" className="h-9 w-9" width={36} height={36} />
        <div className="leading-tight">
          <div className="font-serif text-base font-bold text-navy">Kay-Steph</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Client Portal
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Portal navigation">
        {navGroups.map((group) => (
          <div key={group.label ?? "main"} className="mb-4">
            {group.label && (
              <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact
                  ? loc.pathname === item.to
                  : loc.pathname.startsWith(item.to);
                return (
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    to={item.to as any}
                    key={item.to}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-navy text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-navy"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${active ? "text-gold" : "text-slate-400"}`} />
                    {item.label}
                    {item.to === "/portfolio/notifications" && unread > 0 && (
                      <span className="ml-auto rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-gold-foreground">
                        {unread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block print:hidden">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden text-sm text-slate-500 sm:block">
                {new Date().toLocaleDateString("en-NG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/portfolio/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none hover:bg-slate-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
                    {initials}
                  </span>
                  <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 md:block">
                    {user?.name || user?.email || "Client"}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-slate-500">
                    {user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/portfolio/profile" className="cursor-pointer">
                      <UserRound className="mr-2 h-4 w-4" /> Profile & Security
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/portfolio/support" className="cursor-pointer">
                      <Headset className="mr-2 h-4 w-4" /> Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer text-rose-600 focus:text-rose-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Demo banner */}
        {demo && (
          <div className="border-b border-violet-200 bg-violet-50 px-4 py-2.5 sm:px-6 print:hidden">
            <div className="flex items-center gap-2 text-sm font-medium text-violet-800">
              <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Demo
              </span>
              You are viewing sample data. Actions like withdrawals and uploads are disabled.
              <button
                type="button"
                onClick={signOut}
                className="ml-auto shrink-0 font-bold underline-offset-2 hover:underline"
              >
                Exit demo
              </button>
            </div>
          </div>
        )}

        {/* KYC banner */}
        {!demo && showKycBanner && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 sm:px-6 print:hidden">
            <Link
              to="/portfolio/kyc"
              className="flex items-center gap-2 text-sm font-medium text-amber-800 hover:underline"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {kycStatus === "pending"
                ? "Your identity verification is under review. Some actions stay locked until it is approved."
                : kycStatus === "rejected" || kycStatus === "more_info"
                  ? "Your verification needs attention — open KYC to see what is required."
                  : "Complete identity verification (KYC) to unlock investing, withdrawals and transfers."}
              <span className="ml-auto hidden font-bold sm:inline">Complete KYC →</span>
            </Link>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:p-0">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 print:hidden">
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-400">
            Kay-Steph Group Client Portal · Figures reflect the latest recorded valuations and are
            not financial advice. Need help? Visit{" "}
            <Link to="/portfolio/support" className="font-semibold text-slate-500 hover:text-navy">
              Support
            </Link>
            .
          </div>
        </footer>
      </div>
    </div>
  );
}
