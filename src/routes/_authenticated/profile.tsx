import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Smartphone, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader, PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Security | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      setName(
        (u.user_metadata?.full_name as string | undefined) ??
          (u.user_metadata?.name as string | undefined) ??
          "",
      );
    });
  }, []);

  return (
    <PortalShell>
      <PageHeader
        title="Profile & Security"
        subtitle="Personal details, sign-in settings and account safety."
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-navy">
              <UserCircle2 className="h-5 w-5" />
            </span>
            <h2 className="font-serif text-lg font-bold text-navy">Personal information</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={name || "—"} />
            <Field label="Email" value={email || "—"} />
            <Field label="Phone" value="+234 816 666 6724" />
            <Field label="Country" value="Nigeria" />
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-lg font-bold text-navy">Security</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-navy/60" />
              <span className="flex-1 font-semibold text-navy">Password</span>
              <button className="text-xs font-bold text-navy hover:text-gold">Change</button>
            </li>
            <li className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-navy/60" />
              <span className="flex-1 font-semibold text-navy">Two-factor auth</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-200">
                Off
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </PortalShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-navy/10 bg-cream/40 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">{label}</p>
      <p className="mt-1 font-bold text-navy">{value}</p>
    </div>
  );
}
