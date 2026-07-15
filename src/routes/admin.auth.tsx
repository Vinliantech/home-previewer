import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Eye, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_ENABLED, DEMO_PASSWORD, enableDemo } from "@/lib/demo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Kay-Steph Group" },
      { name: "description", content: "Kay-Steph Group administrator access." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAuth,
});

function AdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: session.user.id });
      if (isAdmin) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) {
      setLoading(false);
      toast.error("Login failed", { description: error?.message ?? "Unknown error" });
      return;
    }
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: data.session.user.id });
    setLoading(false);
    if (!isAdmin) {
      await supabase.auth.signOut();
      toast.error("Access denied", { description: "This account is not an administrator." });
      return;
    }
    toast.success("Welcome, admin");
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f3a] via-navy to-[#1a1f6b] px-4 py-16 text-white">
      <div className="mx-auto max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="rounded-2xl border border-gold/40 bg-white/[0.03] p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/40">
              <Shield className="h-6 w-6 text-gold" />
            </div>
            <h1 className="font-serif text-3xl font-semibold">Admin Portal</h1>
            <p className="mt-1 text-sm text-white/70">Kay-Steph Group</p>
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
                className="bg-white/5 text-white"
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
                className="bg-white/5 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In as Admin"
              )}
            </Button>
          </form>

          {DEMO_ENABLED && <DemoAccess />}
        </div>
      </div>
    </div>
  );
}

function DemoAccess() {
  const navigate = useNavigate();
  const [demoPassword, setDemoPassword] = useState("");

  function startDemo(e: React.FormEvent) {
    e.preventDefault();
    if (demoPassword !== DEMO_PASSWORD) {
      toast.error("Incorrect demo password.");
      return;
    }
    enableDemo("admin");
    toast.success("Demo mode active — viewing sample admin data.");
    navigate({ to: "/admin" });
  }

  return (
    <div className="mt-6 rounded-xl border border-white/15 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
        <Eye className="h-3.5 w-3.5 text-gold" /> Demo access
      </div>
      <p className="mt-2 text-xs leading-5 text-white/55">
        Preview the super-admin dashboard with sample data — no account needed.
      </p>
      <form onSubmit={startDemo} className="mt-3 flex gap-2">
        <Input
          type="password"
          placeholder="Demo password"
          value={demoPassword}
          onChange={(e) => setDemoPassword(e.target.value)}
          className="h-9 bg-white/5 text-sm text-white placeholder:text-white/40"
          aria-label="Demo password"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-9 shrink-0 border-white/25 bg-transparent font-bold text-white hover:border-gold hover:bg-transparent hover:text-gold"
        >
          View demo
        </Button>
      </form>
    </div>
  );
}
