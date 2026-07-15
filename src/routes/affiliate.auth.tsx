import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, CheckCircle2, Eye, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_ENABLED, DEMO_PASSWORD, enableDemo } from "@/lib/demo";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/affiliate/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Partner Sign In — Kay-Steph Affiliate Portal" },
      {
        name: "description",
        content:
          "Refer qualified buyers to Kay-Steph properties and earn transparent commissions on closed deals.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AffiliateAuth,
});

type Mode = "signin" | "signup";

const affiliateCapabilities = [
  "View your personal referral link",
  "Generate unique property referral links",
  "Track referred prospects",
  "View each referral's status",
  "Monitor leads and conversions",
  "See completed property sales",
  "View commission earned",
  "View pending commission",
  "View paid commission",
  "Request commission withdrawal",
  "Download marketing materials",
  "Access property brochures",
  "View campaign resources",
  "Update profile and payment details",
];

function AffiliateAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/affiliate/portal" });
    });
  }, [navigate]);

  const isSignin = mode === "signin";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Editorial hero */}
      <section className="relative bg-[#141414] px-6 pb-16 pt-10 md:px-16 md:pt-16">
        <Link
          to="/"
          className="mb-14 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-[#d4a53a]"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
        <div className="max-w-2xl">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-[#d4a53a]">
            Affiliate Portal
          </p>
          <h1
            className="font-serif text-[56px] leading-[1.02] text-[#f5f0e6] md:text-[88px]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Partner
            <br />
            {isSignin ? "Sign In" : "Sign Up"}
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">
            A separate dashboard for referral partners and marketers — manage leads, commissions,
            links and promotional materials, and earn transparent commissions on closed deals.
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="px-6 py-16 md:px-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* Capability panel */}
          <div className="order-2 border border-white/10 bg-[#141414] p-8 lg:order-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#d4a53a]">
              Inside the Affiliate Portal
            </p>
            <h2
              className="mt-4 font-serif text-2xl text-[#f5f0e6]"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Everything your partnership runs on.
            </h2>
            <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {affiliateCapabilities.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a53a]" /> {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-white/10 pt-5">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-[#d4a53a]"
              >
                <LayoutDashboard className="h-4 w-4" />
                Buyer or investor? Sign in as Client
              </Link>
            </div>
          </div>

          <div className="order-1 mx-auto w-full max-w-md lg:order-2">
            {/* Underline tabs */}
            <div className="mb-10 flex items-center gap-8 border-b border-white/10">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`-mb-px border-b-2 pb-3 text-xs font-medium uppercase tracking-[0.3em] transition-colors ${
                  isSignin
                    ? "border-[#d4a53a] text-[#d4a53a]"
                    : "border-transparent text-white/50 hover:text-white/80"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`-mb-px border-b-2 pb-3 text-xs font-medium uppercase tracking-[0.3em] transition-colors ${
                  !isSignin
                    ? "border-[#d4a53a] text-[#d4a53a]"
                    : "border-transparent text-white/50 hover:text-white/80"
                }`}
              >
                Sign Up
              </button>
            </div>

            {isSignin ? <SignInForm /> : <SignUpForm />}

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.35em] text-white/40">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <GoogleButton />

            {DEMO_ENABLED && <DemoAccess />}
          </div>
        </div>
      </section>
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
    enableDemo("affiliate");
    toast.success("Demo mode active — viewing sample affiliate data.");
    navigate({ to: "/affiliate/portal" });
  }

  return (
    <div className="mt-8 border border-white/15 bg-[#141414] p-4">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
        <Eye className="h-3.5 w-3.5 text-[#d4a53a]" /> Demo access
      </div>
      <p className="mt-2 text-xs leading-5 text-white/45">
        Preview the affiliate dashboard with sample data — no account needed.
      </p>
      <form onSubmit={startDemo} className="mt-3 flex gap-2">
        <Input
          type="password"
          placeholder="Demo password"
          value={demoPassword}
          onChange={(e) => setDemoPassword(e.target.value)}
          className="h-10 rounded-none border-0 border-b border-white/15 bg-[#1a1a1a] px-3 text-sm text-white placeholder:text-white/40 focus-visible:border-[#d4a53a] focus-visible:ring-0"
          aria-label="Demo password"
        />
        <Button
          type="submit"
          className="h-10 shrink-0 rounded-none border border-[#d4a53a]/60 bg-transparent text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4a53a] hover:bg-[#d4a53a] hover:text-black"
        >
          View demo
        </Button>
      </form>
    </div>
  );
}

const fieldClass =
  "h-14 rounded-none border-0 border-b border-white/15 bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-white/40 focus-visible:border-[#d4a53a] focus-visible:ring-0";
const submitClass =
  "h-14 w-full rounded-none bg-[#d4a53a] text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-[#c39a34]";

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) return toast.error("Sign in failed", { description: error.message });
    toast.success("Welcome back");
    navigate({ to: "/affiliate/portal" });
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <Input
        type="email"
        required
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={fieldClass}
      />
      <Input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={fieldClass}
      />
      <Button type="submit" disabled={loading} className={submitClass}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in as Affiliate"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/affiliate`,
        data: { full_name: fullName, phone, account_type: "affiliate" },
      },
    });
    setLoading(false);
    if (error) return toast.error("Application failed", { description: error.message });
    toast.success("Application received", {
      description: "Your affiliate account is pending admin approval.",
    });
    navigate({ to: "/affiliate/portal" });
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <Input
        required
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className={fieldClass}
      />
      <Input
        type="email"
        required
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={fieldClass}
      />
      <Input
        required
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={fieldClass}
      />
      <Input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={fieldClass}
      />
      <Button type="submit" disabled={loading} className={submitClass}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Application"}
      </Button>
      <p className="pt-2 text-[11px] leading-relaxed text-white/40">
        By applying you agree to Kay-Steph's affiliate terms. Approval is required before you can
        submit referrals.
      </p>
    </form>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/affiliate` },
    });
    if (error) {
      setLoading(false);
      toast.error("Google sign-in failed", { description: error.message });
    }
  }
  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="flex h-14 w-full items-center justify-center gap-3 border border-white/15 bg-transparent text-xs font-medium uppercase tracking-[0.3em] text-white/90 transition-colors hover:border-[#d4a53a] hover:text-[#d4a53a] disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <GoogleGlyph /> Continue with Google
        </>
      )}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.6 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.5 29.1 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-2 1.4-4.4 2.1-7 2.1-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.7 39.2 16.3 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6 5.1c-.4.3 6.5-4.8 6.5-14.1 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
