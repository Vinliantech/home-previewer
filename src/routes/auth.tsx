import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Handshake, LayoutDashboard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Client Sign In — Kay-Steph Group" },
      {
        name: "description",
        content:
          "Sign in to the Kay-Steph Client Portal to manage your properties, investments, KYC, documents, returns and transactions.",
      },
    ],
  }),
  component: ClientAuth,
});

const clientCapabilities = [
  "View and update your profile",
  "Complete KYC verification",
  "See properties you have invested in",
  "View your approved contribution",
  "Track your ownership percentage",
  "View your property tokens",
  "Monitor current share value",
  "Track rental income",
  "Follow capital appreciation",
  "Download investment certificates",
  "Access legal documents",
  "Review all transactions",
  "Request withdrawals",
  "Submit exit or resale requests",
  "Contact customer support",
];

function ClientAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/portfolio" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Login failed", { description: error.message });
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/portfolio" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#0f1450] px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          {/* Capability panel */}
          <div className="order-2 rounded-2xl border border-white/10 bg-white/[0.03] p-8 lg:order-1">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Client Portal</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug">
              One secure dashboard for buyers and investors.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Manage your portfolio, documents, returns and transactions — everything your ownership
              involves, in one place. Inside the portal you can:
            </p>
            <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {clientCapabilities.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Sign-in card */}
          <div className="order-1 rounded-2xl border border-gold/30 bg-white/[0.03] p-8 shadow-2xl backdrop-blur lg:order-2">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/40">
                <LayoutDashboard className="h-6 w-6 text-gold" />
              </div>
              <h1 className="font-serif text-3xl font-semibold">Client Portal</h1>
              <p className="mt-1 text-sm text-white/70">
                For property buyers and investors — Kay-Steph Group
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 text-white placeholder:text-white/40"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 text-white placeholder:text-white/40"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign in as Client"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/70">
              No account yet?{" "}
              <Link to="/register" className="font-medium text-gold hover:underline">
                Register
              </Link>
            </p>

            <div className="mt-6 border-t border-white/10 pt-5">
              <Link
                to="/affiliate/auth"
                className="flex items-center justify-center gap-2 text-sm text-white/70 transition-colors hover:text-gold"
              >
                <Handshake className="h-4 w-4" />
                Referral partner? Sign in as Affiliate instead
              </Link>
            </div>

            <p className="mt-4 text-center text-xs text-white/50">
              Administrator?{" "}
              <Link to="/admin/auth" className="hover:text-gold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
