import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Client Account — Kay-Steph Group" },
      {
        name: "description",
        content:
          "Register for the Kay-Steph client portal to reserve plots, track payments and access documents.",
      },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/portfolio`,
        data: { full_name: fullName, phone },
      },
    });
    if (error) {
      setLoading(false);
      toast.error("Registration failed", { description: error.message });
      return;
    }
    // Best-effort profile enrichment (trigger creates the base row)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, address })
        .eq("user_id", session.user.id);
    }
    setLoading(false);
    toast.success("Account created", { description: "Welcome to Kay-Steph." });
    navigate({ to: "/portfolio" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-[#0f1450] px-4 py-16 text-white">
      <div className="mx-auto max-w-lg">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="rounded-2xl border border-gold/30 bg-white/[0.03] p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/40">
              <UserPlus className="h-6 w-6 text-gold" />
            </div>
            <h1 className="font-serif text-3xl font-semibold">Create Account</h1>
            <p className="mt-1 text-sm text-white/70">Join the Kay-Steph client portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white/90">
                Full name
              </Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-white/5 text-white"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="phone" className="text-white/90">
                  Phone
                </Label>
                <Input
                  id="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/5 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white/90">
                Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-white/5 text-white"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-white/90">
                  Confirm
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-white/5 text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/70">
            Already have an account?{" "}
            <Link to="/auth" className="font-medium text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
