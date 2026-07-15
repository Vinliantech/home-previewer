import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Handshake, LayoutDashboard, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImg from "@/assets/logo.png";

const mainNav = [
  { label: "Home", to: "/" },
  { label: "Properties", to: "/properties" },
  { label: "Invest", to: "/invest" },
] as const;

const whyKayStephMenu = [
  { label: "About Kay-Steph", to: "/about" },
  { label: "Our Team", to: "/team" },
  { label: "Services", to: "/services" },
  { label: "Blog", to: "/blog" },
  { label: "Market Report", to: "/market-report" },
  { label: "Careers", to: "/careers" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact Us", to: "/contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(Boolean(session)));
    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      setSignedIn(Boolean(session));
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setWhyOpen(false);
    setSignInOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy/85 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3" aria-label="Kay-Steph Group home">
          <img src={logoImg} alt="" className="h-11 w-11" width={44} height={44} />
          <div className="leading-tight">
            <div className="font-serif text-xl font-bold">Kay-Steph</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/65">Group</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {mainNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-white/75 transition-colors hover:text-gold"
              activeProps={{ className: "text-sm font-medium text-gold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}

          {/* Why Kay-Steph dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="group flex items-center gap-1 text-sm font-medium text-white/75 outline-none transition-colors hover:text-gold data-[state=open]:text-gold">
              Why Kay-Steph
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={14}
              className="w-56 border-navy/10 bg-white p-1.5 text-navy shadow-xl"
            >
              <DropdownMenuItem asChild>
                <Link
                  to="/why-kaysteph"
                  className="w-full cursor-pointer rounded-sm px-3 py-2.5 text-sm font-semibold focus:bg-cream focus:text-navy"
                >
                  Why Kay-Steph — Overview
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-navy/10" />
              {whyKayStephMenu.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link
                    to={item.to}
                    className="w-full cursor-pointer rounded-sm px-3 py-2.5 text-sm font-medium focus:bg-cream focus:text-navy"
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Sign In dropdown (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className="group inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-gold-foreground outline-none transition-colors hover:bg-gold/90">
              Sign In
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={14}
              className="w-[340px] border-navy/10 bg-white p-2 text-navy shadow-xl"
            >
              <DropdownMenuLabel className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Choose your portal
              </DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link
                  to="/auth"
                  className="flex w-full cursor-pointer items-start gap-3 rounded-md p-3 focus:bg-cream"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-gold">
                    <LayoutDashboard className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-serif text-base font-bold text-navy">
                      Client Portal
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      For property buyers and investors to manage their portfolio, documents,
                      returns, and transactions.
                    </span>
                    <span className="mt-2 inline-flex items-center rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-gold-foreground">
                      {signedIn ? "Go to client dashboard" : "Sign in as Client"}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-navy/10" />

              <DropdownMenuItem asChild>
                <Link
                  to="/affiliate/auth"
                  className="flex w-full cursor-pointer items-start gap-3 rounded-md p-3 focus:bg-cream"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                    <Handshake className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-serif text-base font-bold text-navy">
                      Affiliate Portal
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      For referral partners and marketers to manage leads, commissions, links, and
                      promotional materials.
                    </span>
                    <span className="mt-2 inline-flex items-center rounded-full border border-navy/30 px-4 py-1.5 text-xs font-bold text-navy">
                      Sign in as Affiliate
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-navy/10" />
              <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                New to Kay-Steph?{" "}
                <Link to="/register" className="font-bold text-navy hover:text-gold">
                  Create a client account
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100vh-76px)] overflow-y-auto border-t border-white/10 bg-navy lg:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-5" aria-label="Mobile navigation">
            {mainNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className="border-b border-white/10 py-3 text-sm font-medium text-white/85"
                activeProps={{
                  className: "border-b border-white/10 py-3 text-sm font-bold text-gold",
                }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}

            {/* Why Kay-Steph collapsible */}
            <button
              type="button"
              onClick={() => setWhyOpen((value) => !value)}
              className="flex items-center justify-between border-b border-white/10 py-3 text-sm font-medium text-white/85"
              aria-expanded={whyOpen}
            >
              Why Kay-Steph
              <ChevronDown
                className={`h-4 w-4 transition-transform ${whyOpen ? "rotate-180" : ""}`}
              />
            </button>
            {whyOpen && (
              <div className="border-b border-white/10 bg-white/5">
                <Link
                  to="/why-kaysteph"
                  onClick={closeMenu}
                  className="block px-4 py-2.5 text-sm font-semibold text-gold"
                >
                  Why Kay-Steph — Overview
                </Link>
                {whyKayStephMenu.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    className="block px-4 py-2.5 text-sm text-white/75"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Sign In collapsible */}
            <button
              type="button"
              onClick={() => setSignInOpen((value) => !value)}
              className="flex items-center justify-between py-3 text-sm font-bold text-gold"
              aria-expanded={signInOpen}
            >
              Sign In
              <ChevronDown
                className={`h-4 w-4 transition-transform ${signInOpen ? "rotate-180" : ""}`}
              />
            </button>
            {signInOpen && (
              <div className="space-y-3 pb-2">
                <Link
                  to="/auth"
                  onClick={closeMenu}
                  className="flex items-start gap-3 rounded-md border border-white/15 bg-white/5 p-4"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                    <LayoutDashboard className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-serif text-sm font-bold">Client Portal</span>
                    <span className="mt-0.5 block text-xs leading-5 text-white/60">
                      Manage your portfolio, documents, returns and transactions.
                    </span>
                    <span className="mt-2 inline-flex rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-gold-foreground">
                      {signedIn ? "Go to client dashboard" : "Sign in as Client"}
                    </span>
                  </span>
                </Link>
                <Link
                  to="/affiliate/auth"
                  onClick={closeMenu}
                  className="flex items-start gap-3 rounded-md border border-white/15 bg-white/5 p-4"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                    <Handshake className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-serif text-sm font-bold">Affiliate Portal</span>
                    <span className="mt-0.5 block text-xs leading-5 text-white/60">
                      Manage leads, commissions, referral links and materials.
                    </span>
                    <span className="mt-2 inline-flex rounded-full border border-white/40 px-4 py-1.5 text-xs font-bold text-white">
                      Sign in as Affiliate
                    </span>
                  </span>
                </Link>
                <p className="text-center text-xs text-white/55">
                  New to Kay-Steph?{" "}
                  <Link to="/register" onClick={closeMenu} className="font-bold text-gold">
                    Create a client account
                  </Link>
                </p>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
