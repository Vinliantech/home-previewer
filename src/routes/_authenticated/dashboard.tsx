import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, FileCheck2, LogOut, Wallet, Receipt, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Investor Dashboard | Kay-Steph Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const modules = [
  { title: "Complete KYC", desc: "Submit your ID and address to unlock investing.", href: "/dashboard", icon: FileCheck2, badge: "Coming next" },
  { title: "Portfolio", desc: "Your token holdings and current value.", href: "/dashboard", icon: Building2, badge: "Phase 3" },
  { title: "Wallet", desc: "Deposits, allocations and withdrawals.", href: "/dashboard", icon: Wallet, badge: "Phase 4" },
  { title: "Transactions", desc: "Full history of every movement.", href: "/dashboard", icon: Receipt, badge: "Phase 3" },
  { title: "Statements", desc: "Quarterly PDF statements.", href: "/dashboard", icon: ScrollText, badge: "Phase 4" },
  { title: "Certificates", desc: "Ownership certificates per holding.", href: "/dashboard", icon: ScrollText, badge: "Phase 4" },
];

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

  return (
    <PageShell>
      <section className="bg-navy pb-16 pt-[136px] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">Investor portal</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
                Welcome{name ? `, ${name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-2 text-white/70">{email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100 mb-8">
            Your account is ready. KYC, portfolio and wallet modules will unlock in the next
            phases of the portal rollout.
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <div
                key={m.title}
                className="rounded-xl border border-navy/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                    <m.icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
                    {m.badge}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-navy">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/properties" className="text-sm font-semibold text-navy hover:text-gold">
              Browse available properties →
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
