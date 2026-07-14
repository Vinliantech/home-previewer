import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Shield, ShieldCheck, Award, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ensureDemoUser } from "@/lib/demo-auth.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Client Login | Kay-Steph Group" },
      { name: "description", content: "Kay-Steph Group secure client investor portal login." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === "SIGNED_IN" && session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleGoogle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const creds = await ensureDemoUser();
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) throw error;
      toast.success("Signed in as Demo Investor");
    } catch (e) {
      const text = e instanceof Error ? e.message : "Demo login failed";
      setMessage({ tone: "error", text });
      toast.error(text);
      setBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMessage({ tone: "success", text: "Check your inbox to confirm your email." });
        toast.success("Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage({ tone: "success", text: "Password reset email sent." });
        toast.success("Password reset email sent.");
        setMode("signin");
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "Something went wrong";
      setMessage({ tone: "error", text });
      toast.error(text);
    } finally {
      setBusy(false);
    }
  };

  const heading =
    mode === "signin" ? "Client Login" : mode === "signup" ? "Create Account" : "Reset Password";
  const subheading =
    mode === "signin"
      ? "Securely access your Kay-Steph Group investor account."
      : mode === "signup"
        ? "Set up your Kay-Steph Group investor account."
        : "We'll email you a secure link to reset your password.";

  return (
    <div className="min-h-screen overflow-x-hidden bg-navy text-white">
      <SiteHeader />

      {/* Grid pattern backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-2/5 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.11) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 75% 20%, rgba(19,70,137,0.28), transparent 34%)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1310px] items-center gap-y-10 gap-x-16 px-4 pb-14 pt-[136px] sm:px-6 lg:grid-cols-[1fr_1.08fr] lg:gap-x-[72px] lg:pt-[160px]">
        {/* Intro panel */}
        <div className="px-1 py-5">
          <div className="mx-auto grid h-[68px] w-[68px] rotate-45 place-items-center rounded-3xl border-2 border-gold text-gold">
            <Sparkles className="h-7 w-7 -rotate-45" />
          </div>
          <p className="mt-5 text-center text-[15px] font-extrabold uppercase tracking-[0.4em] text-gold">
            Investor Portal
          </p>
          <h1 className="mt-5 text-center font-serif text-[clamp(38px,4.5vw,62px)] font-bold leading-[1.05] tracking-tight">
            Secure Client Portal
          </h1>
          <div className="mx-auto my-6 h-[3px] w-14 rounded-full bg-gold" />
          <p className="mx-auto max-w-[520px] text-center text-[17px] leading-[1.7] text-white/80">
            Access your investments, performance insights and important documents with confidence.
          </p>

          <div className="mx-auto mt-10 max-w-[510px] rounded-2xl border border-white/20 bg-navy/60 p-6 backdrop-blur-md shadow-[inset_0_1px_rgba(255,255,255,0.06)]">
            {[
              {
                icon: <Lock className="h-5 w-5" />,
                title: "256-bit secure access",
                text: "Bank-level encryption protects your data.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Protected investor dashboard",
                text: "Your portfolio and documents remain secured.",
              },
              {
                icon: <Award className="h-5 w-5" />,
                title: "Trusted access",
                text: "Reliable. Private. Always protected.",
              },
            ].map((row) => (
              <div key={row.title} className="grid grid-cols-[34px_1fr] items-start gap-4 [&+&]:mt-5">
                <span className="mt-0.5 text-gold">{row.icon}</span>
                <div>
                  <strong className="block text-[15px] font-semibold text-white">{row.title}</strong>
                  <span className="text-[13.5px] leading-relaxed text-white/70">{row.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-[640px] justify-self-center rounded-[22px] border border-navy/10 bg-white/[0.985] px-6 py-8 text-navy shadow-[0_28px_70px_rgba(0,0,0,0.24)] sm:px-12 sm:py-10 lg:justify-self-end">
          <h2 className="text-center font-serif text-[32px] font-bold tracking-tight sm:text-[42px]">
            {heading}
          </h2>
          <p className="mb-7 mt-2.5 text-center text-[15px] text-muted-foreground">{subheading}</p>

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="flex min-h-14 w-full items-center justify-center gap-3.5 rounded-xl border-[1.5px] border-border bg-white text-[15px] font-bold text-navy transition hover:bg-[#f8faff] hover:shadow-[0_8px_24px_rgba(18,38,80,0.08)] disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.19 3.32v2.76h3.54c2.08-1.92 3.29-4.74 3.29-8.09Z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.76c-.98.66-2.23 1.06-3.74 1.06-2.87 0-5.3-1.94-6.17-4.55H2.18v2.85A11 11 0 0 0 12 23Z"/>
                  <path fill="#FBBC05" d="M5.83 14.09a6.6 6.6 0 0 1 0-4.18V7.06H2.18a11 11 0 0 0 0 9.88l3.65-2.85Z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.96 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.65 2.85C6.7 7.32 9.13 5.38 12 5.38Z"/>
                </svg>
                Continue with Google
              </button>
              <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-[12px] font-bold uppercase tracking-widest text-[#7f899f]">
                <span className="h-px bg-[#e2e6ee]" /> OR <span className="h-px bg-[#e2e6ee]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <div className="mb-5">
                <label className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#102046]">
                  Full name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-[54px] w-full rounded-xl border-[1.5px] border-border bg-white px-4 text-[15px] text-navy outline-none transition focus:border-[#1b5fb4] focus:shadow-[0_0_0_4px_rgba(27,95,180,0.12)]"
                  />
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#102046]">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#77829a]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-[54px] w-full rounded-xl border-[1.5px] border-border bg-white pl-12 pr-4 text-[15px] text-navy outline-none transition focus:border-[#1b5fb4] focus:shadow-[0_0_0_4px_rgba(27,95,180,0.12)]"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="mb-5">
                <label className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#102046]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#77829a]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={mode === "signup" ? 8 : 6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[54px] w-full rounded-xl border-[1.5px] border-border bg-white pl-12 pr-14 text-[15px] text-navy outline-none transition focus:border-[#1b5fb4] focus:shadow-[0_0_0_4px_rgba(27,95,180,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#77829a] hover:bg-[#eef2f8]"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="min-h-14 w-full rounded-xl border-0 text-[16px] font-extrabold text-[#07142f] shadow-[0_12px_28px_rgba(247,185,0,0.24)] transition hover:-translate-y-px hover:shadow-[0_15px_34px_rgba(247,185,0,0.32)] disabled:opacity-60"
              style={{ background: "linear-gradient(90deg, #f7b900, #ffc92b)" }}
            >
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in →"
                  : mode === "signup"
                    ? "Create account →"
                    : "Send reset link →"}
            </button>

            <div className="mt-5 flex flex-wrap justify-between gap-4 text-[14px] font-semibold text-[#1259bd]">
              {mode === "signin" && (
                <>
                  <button type="button" className="hover:underline" onClick={() => setMode("forgot")}>
                    Forgot password?
                  </button>
                  <button type="button" className="hover:underline" onClick={() => setMode("signup")}>
                    Create account →
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button type="button" className="ml-auto hover:underline" onClick={() => setMode("signin")}>
                  Already have an account? Sign in →
                </button>
              )}
              {mode === "forgot" && (
                <button type="button" className="ml-auto hover:underline" onClick={() => setMode("signin")}>
                  Back to sign in →
                </button>
              )}
            </div>

            <div
              className="mt-3.5 min-h-5 text-center text-[13px]"
              style={{ color: message?.tone === "success" ? "#1b6b3a" : "#b42318" }}
            >
              {message?.text}
            </div>
          </form>

          <div className="mt-7 flex justify-center gap-2.5 border-t border-[#e5e9f0] pt-6 text-center text-[13px] leading-[1.55] text-[#6d7890]">
            <Shield className="mt-0.5 h-4 w-4 flex-none text-[#50617f]" />
            <span>Your security is our priority. All data is protected with encrypted access.</span>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-1 grid grid-cols-1 items-center gap-6 rounded-2xl border border-white/15 bg-[rgba(7,31,70,0.65)] px-6 py-5 text-white/85 backdrop-blur-md sm:grid-cols-[1.4fr_repeat(3,auto)] sm:gap-7 lg:col-span-2">
          <p className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white/90">
            Trusted by investors. Backed by performance.
          </p>
          <div className="flex items-center gap-2.5 whitespace-nowrap text-[14px]">
            <Lock className="h-4 w-4 text-gold" /> Secure Access
          </div>
          <div className="flex items-center gap-2.5 whitespace-nowrap text-[14px]">
            <ShieldCheck className="h-4 w-4 text-gold" /> Bank-Grade Security
          </div>
          <div className="flex items-center gap-2.5 whitespace-nowrap text-[14px]">
            <Award className="h-4 w-4 text-gold" /> Institutional Standards
          </div>
        </div>

        <p className="text-center text-[12px] text-white/50 lg:col-span-2">
          By continuing you agree to our terms.{" "}
          <Link to="/contact" className="text-gold hover:underline">
            Need help?
          </Link>
        </p>
      </div>
    </div>
  );
}
