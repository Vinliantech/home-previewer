import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronRight,
  ExternalLink,
  Handshake,
  LayoutDashboard,
  LogOut,
  MailPlus,
  Menu,
  Settings2,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase as _supabaseTyped } from "@/integrations/supabase/client";
const supabase: any = _supabaseTyped;
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({
    meta: [{ title: "CRM Workspace | Kay-Steph" }, { name: "robots", content: "noindex" }],
  }),
  component: CrmShell,
});

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  adminOnly?: boolean;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      { to: "/crm", label: "Overview", icon: LayoutDashboard, exact: true },
      { to: "/crm/leads", label: "All leads", icon: UsersRound },
      { to: "/crm/pipeline", label: "Lead pipeline", icon: SlidersHorizontal },
      { to: "/crm/opportunities", label: "Opportunities", icon: Handshake },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/crm/tasks", label: "Tasks", icon: CheckSquare2 },
      { to: "/crm/events", label: "Events", icon: CalendarDays },
      { to: "/crm/automations", label: "Automations", icon: MailPlus, adminOnly: true },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/crm/reports", label: "Reports", icon: BarChart3 },
      { to: "/crm/settings", label: "CRM settings", icon: Settings2, adminOnly: true },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/crm": "Overview",
  "/crm/leads": "Lead management",
  "/crm/pipeline": "Lead pipeline",
  "/crm/opportunities": "Opportunities",
  "/crm/tasks": "Tasks and reminders",
  "/crm/events": "Events and workshops",
  "/crm/automations": "Email automations",
  "/crm/reports": "Performance reports",
  "/crm/settings": "CRM settings",
};

function CrmShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [isAdmin, setIsAdmin] = useState(false);
  // A CRM manager runs the CRM but has no platform admin surface to link back to.
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!active) return;
      const roles = (data ?? []).map((row: any) => row.role as string);
      // Mirrors public.is_crm_admin: CRM managers run the workspace without
      // holding platform admin rights.
      const admin =
        roles.includes("admin") || roles.includes("super_admin") || roles.includes("crm_manager");
      const agent = roles.includes("sales_agent") || admin;
      setIsAdmin(admin);
      setIsPlatformAdmin(roles.includes("admin") || roles.includes("super_admin"));
      setIsAgent(agent);
      if (!agent) {
        toast.error("You do not have access to the CRM workspace.");
        navigate({ to: "/client" });
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate, user.id]);

  useEffect(() => {
    async function refresh() {
      const { count } = await supabase
        .from("crm_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      setUnread(count ?? 0);
    }
    void refresh();
    const channel = supabase
      .channel("crm_notifications_live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void refresh();
          toast("New CRM notification");
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user.id]);

  const pageTitle = useMemo(() => {
    const exact = PAGE_TITLES[pathname];
    if (exact) return exact;
    if (pathname.startsWith("/crm/leads/")) return "Lead profile";
    return "CRM workspace";
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/auth", replace: true });
  }

  const sidebar = (
    <SidebarContent
      pathname={pathname}
      isAdmin={isAdmin}
      isPlatformAdmin={isPlatformAdmin}
      onNavigate={() => setMobileOpen(false)}
      onSignOut={signOut}
    />
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f7f4] text-[#263a34]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-[#174f43] bg-[#0b4539] lg:block">
        {sidebar}
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#dfe4df] bg-white/95 px-4 backdrop-blur md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 text-[#24483f] lg:hidden"
                aria-label="Open CRM navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-none bg-[#0b4539] p-0 text-white">
              <SheetTitle className="sr-only">CRM navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#173f36]">{pageTitle}</p>
            <p className="hidden text-[11px] text-[#7b8581] sm:block">
              Kay-Steph sales and investor relations
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              to="/crm/leads"
              className="hidden items-center gap-2 rounded-md border border-[#dfe4df] bg-[#f8faf8] px-3 py-2 text-xs font-medium text-[#52615b] hover:border-[#b6c5bf] hover:text-[#0b5748] md:inline-flex"
            >
              <Activity className="h-3.5 w-3.5" /> Live lead feed
            </Link>
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#dfe4df] text-[#54635d] hover:bg-[#f3f6f4]"
              aria-label={`${unread} unread CRM notifications`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5963e] px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcebe5] text-[10px] font-bold text-[#0b5748]">
              {(user.email?.slice(0, 2).toUpperCase() ?? "KS")}
            </div>
          </div>
        </header>


        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 md:px-6 md:py-6">
          {isAgent ? (
            <Outlet />
          ) : (
            <div className="text-sm text-[#718079]">Checking CRM access...</div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  isAdmin,
  isPlatformAdmin,
  onNavigate,
  onSignOut,
}: {
  pathname: string;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link to="/" onClick={onNavigate} className="block">
          <p className="font-serif text-xl font-semibold tracking-wide text-[#f4d58a]">Kay-Steph</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/45">
            Group
          </p>
        </Link>
        <div className="mt-5 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.07] px-3 py-2.5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e5bf68]">
              Workspace
            </p>
            <p className="mt-0.5 text-xs font-medium text-white">CRM and lead automation</p>
          </div>
          <ChevronRight className="h-4 w-4 text-white/35" />
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="CRM workspace">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {items.map((item) => {
                  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium transition ${
                        active
                          ? "bg-white text-[#0b4539] shadow-sm"
                          : "text-white/68 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${active ? "text-[#b18432]" : "text-white/45"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium text-white/65 hover:bg-white/[0.08] hover:text-white"
        >
          <ExternalLink className="h-4 w-4 text-white/40" /> View public website
        </Link>
        {isPlatformAdmin && (
          <Link
            to="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium text-white/65 hover:bg-white/[0.08] hover:text-white"
          >
            <Settings2 className="h-4 w-4 text-white/40" /> Platform admin
          </Link>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs font-medium text-white/65 hover:bg-white/[0.08] hover:text-white"
        >
          <LogOut className="h-4 w-4 text-white/40" /> Sign out
        </button>
      </div>
    </div>
  );
}
