import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase as _supabaseTyped } from "@/integrations/supabase/client";
const supabase: any = _supabaseTyped;
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

/**
 * Where a staff account belongs after signing in, or null when the account has
 * no staff standing at all. Platform admins land on the control centre, which
 * links through to the CRM; CRM managers and sales agents go straight to the
 * CRM workspace, since /admin would only bounce them back here. Anyone in the
 * directory without a workspace role — including someone still waiting on
 * approval — lands on their own profile rather than being turned away.
 */
async function staffDestination(userId: string): Promise<"/admin" | "/crm" | "/staff" | null> {
  const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
  if (isAdmin) return "/admin";
  const [{ data: isCrmAdmin }, { data: isAgent }] = await Promise.all([
    supabase.rpc("is_crm_admin", { _uid: userId }),
    supabase.rpc("is_sales_agent", { _uid: userId }),
  ]);
  if (isCrmAdmin || isAgent) return "/crm";
  const { data: staff } = await supabase
    .from("staff_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return staff ? "/staff" : null;
}

function AdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (!session) return;
      const destination = await staffDestination(session.user.id);
      if (destination) navigate({ to: destination });
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
    const destination = await staffDestination(data.session.user.id);
    setLoading(false);
    if (!destination) {
      await supabase.auth.signOut();
      toast.error("Access denied", { description: "This account has no staff access." });
      return;
    }
    toast.success(
      destination === "/admin"
        ? "Welcome, admin"
        : destination === "/crm"
          ? "Welcome to the CRM workspace"
          : "Welcome to Kay-Steph",
    );
    navigate({ to: destination });
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
        </div>
      </div>
    </div>
  );
}
