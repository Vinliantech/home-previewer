import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  BarChart3,
  BookOpen,
  CalendarClock,
  ChevronRight,
  FileEdit,
  FileText,
  FolderTree,
  GalleryVerticalEnd,
  Globe2,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Menu,
  MessageSquare,
  PenLine,
  SearchCheck,
  Send,
  Settings2,
  Tags,
  UserRoundPen,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { ContentWorkspaceProvider } from "@/components/content/ContentWorkspaceContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({
    meta: [{ title: "Blog & Content | Kay-Steph" }, { name: "robots", content: "noindex" }],
  }),
  component: ContentShell,
});

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  search?: Record<string, string>;
  exact?: boolean;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Editorial",
    items: [
      { to: "/content", label: "Overview", icon: LayoutDashboard, exact: true },
      { to: "/content/posts", label: "All Posts", icon: FileText },
      { to: "/content/editor", label: "Add New Post", icon: PenLine },
      { to: "/content/posts", label: "Drafts", icon: FileEdit, search: { status: "draft" } },
      {
        to: "/content/posts",
        label: "Scheduled Posts",
        icon: CalendarClock,
        search: { status: "scheduled" },
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        to: "/content/taxonomy",
        label: "Categories",
        icon: FolderTree,
        search: { tab: "categories" },
      },
      { to: "/content/taxonomy", label: "Tags", icon: Tags, search: { tab: "tags" } },
      { to: "/content/authors", label: "Authors", icon: UserRoundPen },
      { to: "/content/media", label: "Media Library", icon: GalleryVerticalEnd },
      { to: "/content/comments", label: "Comments", icon: MessageSquare },
    ],
  },
  {
    label: "Distribution",
    items: [
      { to: "/content/settings", label: "SEO Settings", icon: SearchCheck, search: { tab: "seo" } },
      { to: "/content/social", label: "Social Publishing", icon: Send },
      { to: "/content/newsletter", label: "Newsletter", icon: MailCheck },
      { to: "/content/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/content/settings", label: "Blog Settings", icon: Settings2 },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/content": "Content overview",
  "/content/posts": "All posts",
  "/content/editor": "Post editor",
  "/content/taxonomy": "Categories and tags",
  "/content/authors": "Authors",
  "/content/media": "Media library",
  "/content/comments": "Comments",
  "/content/social": "Social publishing",
  "/content/newsletter": "Newsletter",
  "/content/analytics": "Content analytics",
  "/content/settings": "Content settings",
};

function ContentShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleLabel, setRoleLabel] = useState("Content team");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (!active) return;
      const roles = (data ?? []).map((row) => String(row.role));
      const contentRoles = [
        "super_admin",
        "admin",
        "content_manager",
        "content_editor",
        "content_author",
        "seo_manager",
        "social_media_manager",
      ];
      const permitted = !error && roles.some((role) => contentRoles.includes(role));
      setAllowed(permitted);
      const preferred = roles.find((role) => contentRoles.includes(role));
      if (preferred)
        setRoleLabel(
          preferred.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        );
      setChecking(false);
      if (!permitted) {
        toast.error("You do not have access to Blog & Content.");
        navigate({ to: "/client" });
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate, user.id]);

  const pageTitle = useMemo(() => PAGE_TITLES[pathname] ?? "Blog & Content", [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/auth", replace: true });
  }

  const sidebar = (
    <ContentSidebar
      pathname={pathname}
      roleLabel={roleLabel}
      onNavigate={() => setMobileOpen(false)}
      onSignOut={signOut}
    />
  );

  return (
    <ContentWorkspaceProvider>
      <div className="min-h-screen overflow-x-hidden bg-[#f5f7f4] text-[#263a34]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r border-[#174f43] bg-[#0a4137] lg:block">
          {sidebar}
        </aside>
        <div className="lg:pl-[256px]">
          <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#dfe4df] bg-white/95 px-4 backdrop-blur md:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 text-[#24483f] lg:hidden"
                  aria-label="Open content navigation"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[292px] border-none bg-[#0a4137] p-0 text-white"
              >
                <SheetTitle className="sr-only">Blog and Content navigation</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#173f36]">{pageTitle}</p>
              <p className="hidden text-[11px] text-[#7b8581] sm:block">
                Kay-Steph editorial and social publishing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/blog"
                className="hidden items-center gap-2 border border-[#dbe2de] bg-[#f8faf8] px-3 py-2 text-xs font-medium text-[#4d6159] hover:border-[#b8c8c1] md:inline-flex"
              >
                <Globe2 className="h-3.5 w-3.5" />
                View Journal
              </Link>
              <Link
                to="/content/editor"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0d5747] px-3 text-xs font-semibold text-white hover:bg-[#0a463a]"
              >
                <PenLine className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New post</span>
              </Link>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1eee9] text-[10px] font-bold text-[#155447]">
                {(user.email?.slice(0, 2).toUpperCase() ?? "KS")}
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1700px] px-4 py-5 md:px-6 md:py-6">
            {checking ? (
              <p className="text-sm text-[#718079]">Checking content permissions...</p>
            ) : allowed ? (
              <Outlet />
            ) : null}
          </main>
        </div>
      </div>
    </ContentWorkspaceProvider>
  );
}

function ContentSidebar({
  pathname,
  roleLabel,
  onNavigate,
  onSignOut,
}: {
  pathname: string;
  roleLabel: string;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link to="/" onClick={onNavigate} className="block">
          <p className="font-serif text-xl font-semibold tracking-wide text-[#f0cf83]">Kay-Steph</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/45">
            Group
          </p>
        </Link>
        <div className="mt-5 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.07] px-3 py-2.5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e1bd70]">
              Workspace
            </p>
            <p className="mt-0.5 text-xs font-medium text-white">Blog & Content</p>
            <p className="mt-0.5 text-[9px] capitalize text-white/45">{roleLabel}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-white/35" />
        </div>
      </div>
      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
        aria-label="Blog and Content workspace"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35">
              {group.label}
            </p>
            <div className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.to : pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.label}-${JSON.stringify(item.search)}`}
                    to={item.to}
                    search={item.search}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${active ? "bg-white text-[#16493d]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-[#b48939]" : "text-white/45"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          to="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white"
        >
          <LayoutDashboard className="h-4 w-4" />
          Platform admin
        </Link>
        <Link
          to="/crm"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white"
        >
          <UsersRound className="h-4 w-4" />
          CRM workspace
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
