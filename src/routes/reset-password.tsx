import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password | Kay-Steph Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <section className="bg-navy pb-20 pt-[136px] text-white">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <h1 className="text-center font-serif text-3xl font-bold">Set a new password</h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl bg-white p-6 text-navy shadow-2xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-gold px-4 py-2.5 text-sm font-bold text-gold-foreground transition hover:bg-gold/90 disabled:opacity-60"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
