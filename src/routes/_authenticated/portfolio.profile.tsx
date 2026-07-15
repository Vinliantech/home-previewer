import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getMyKyc } from "@/lib/invest.functions";
import { KYC_STATUS_LABEL } from "@/lib/invest";
import { DashCard, fmtDateTime, PageHeader, StatusBadge } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portfolio/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { data: kycData } = useQuery({ queryKey: ["kyc"], queryFn: () => getMyKyc() });
  const kyc = kycData?.kyc;
  const [authInfo, setAuthInfo] = useState<{
    email: string;
    name: string;
    createdAt: string | null;
    lastSignIn: string | null;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthInfo({
          email: data.user.email ?? "",
          name: (data.user.user_metadata?.full_name as string) ?? "",
          createdAt: data.user.created_at ?? null,
          lastSignIn: data.user.last_sign_in_at ?? null,
        });
      }
    });
  }, []);

  const kycStatus = kyc?.kyc_status ?? "not_submitted";
  const displayName = kyc?.full_name || authInfo?.name || "—";

  async function signOutEverywhere() {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      toast.error("Could not sign out other sessions", { description: error.message });
      return;
    }
    toast.success("Signed out on all devices.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & security"
        description="Your account details, password and session controls."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <DashCard
          title="Personal details"
          description="Identity details are compliance-controlled"
          action={
            <StatusBadge status={kycStatus} label={KYC_STATUS_LABEL[kycStatus] ?? kycStatus} />
          }
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy font-serif text-lg font-bold text-gold">
              {(displayName !== "—" ? displayName : authInfo?.email || "C")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-navy">{displayName}</div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" /> {authInfo?.email ?? "—"}
              </div>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
            {[
              ["Phone", kyc?.phone || "—"],
              ["Address", kyc?.address || "—"],
              ["Country", kyc?.country || "—"],
              ["Member since", authInfo?.createdAt ? fmtDateTime(authInfo.createdAt) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-6">
                <dt className="shrink-0 text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              Name, phone, address and ID details are part of your verified identity. To change
              them, update your{" "}
              <Link to="/portfolio/kyc" className="font-bold text-navy hover:text-gold">
                KYC submission
              </Link>{" "}
              — changes are re-reviewed by compliance to keep your account protected.
            </span>
          </div>
        </DashCard>

        <div className="space-y-4">
          {/* Password */}
          <PasswordCard />

          {/* Sessions */}
          <DashCard
            title="Sessions & devices"
            description="Control where your account is signed in"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <MonitorSmartphone className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-bold text-emerald-800">This device</div>
                  <div className="text-xs text-emerald-700">
                    Last sign-in: {authInfo?.lastSignIn ? fmtDateTime(authInfo.lastSignIn) : "—"}
                  </div>
                </div>
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              </div>
              <Button
                variant="outline"
                onClick={signOutEverywhere}
                className="w-full border-rose-200 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out on all devices
              </Button>
              <p className="text-xs leading-5 text-slate-500">
                If you suspect someone else has accessed your account, sign out everywhere, change
                your password immediately and contact support. Kay-Steph staff will never ask for
                your password.
              </p>
            </div>
          </DashCard>
        </div>
      </div>

      {/* Security guidance */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: KeyRound,
            title: "Strong, unique password",
            body: "Use a password you use nowhere else. A password manager makes this painless.",
          },
          {
            icon: UserRound,
            title: "Your account, your name",
            body: "Withdrawals settle only to a bank account in your own verified name.",
          },
          {
            icon: ShieldCheck,
            title: "We never ask for codes",
            body: "Kay-Steph will never request your password or login codes by phone, email or WhatsApp.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <item.icon className="h-5 w-5 text-gold" />
            <h3 className="mt-3 text-sm font-bold text-navy">{item.title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Password change failed", { description: error.message });
      return;
    }
    toast.success("Password updated.");
    setPassword("");
    setConfirm("");
  }

  return (
    <DashCard title="Change password" description="Takes effect immediately on all future sign-ins">
      <form onSubmit={changePassword} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat the new password"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-navy font-bold text-white hover:bg-navy/90"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </DashCard>
  );
}
