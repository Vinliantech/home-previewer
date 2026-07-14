import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Handshake,
  Mail,
  MapPin,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { ADDRESS_LINES, EMAIL } from "@/lib/properties";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers | Build Abuja With Us — Kay-Steph Group" },
      {
        name: "description",
        content:
          "Careers at Kay-Steph Group: sales advisory, project delivery, property management and client support roles in Guzape, Abuja — plus our commission-based affiliate programme.",
      },
      { property: "og:title", content: "Careers at Kay-Steph Group" },
      {
        property: "og:description",
        content: "Join the team building Abuja's most trusted property platform.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/careers" }],
  }),
  component: CareersPage,
});

const openRoles = [
  {
    title: "Sales & Advisory Associate",
    type: "Full-time · Guzape, Abuja",
    body: "Guide buyers and investors from first enquiry to closing: shortlists, inspections, negotiations and documentation hand-offs. You need real-estate sales experience, spotless integrity and the patience to educate before you sell.",
  },
  {
    title: "Client Support Officer",
    type: "Full-time · Guzape, Abuja",
    body: "Own the phones, the WhatsApp line and the front desk. You keep our one-business-day response promise, route enquiries to the right desk and make every client feel personally handled.",
  },
  {
    title: "Site & Project Supervisor",
    type: "Full-time · project sites, Abuja",
    body: "Represent delivery standards on active sites: quality control, contractor coordination and honest progress reporting. Construction or engineering background required.",
  },
  {
    title: "Digital Marketing Executive",
    type: "Full-time / hybrid · Guzape, Abuja",
    body: "Run campaigns, content and lead pipelines across Meta, search and email — feeding a CRM the team actually works. Performance-marketing experience with property or high-ticket products preferred.",
  },
];

const benefits = [
  {
    icon: TrendingUp,
    title: "Real growth path",
    body: "A small team means real responsibility early — and advancement tied to delivery, not tenure.",
  },
  {
    icon: ShieldCheck,
    title: "Integrity you can keep",
    body: "We sell verified property with written disclosures. You will never be asked to shade the truth to close.",
  },
  {
    icon: GraduationCap,
    title: "Learn the whole trade",
    body: "Development, legal, investment structuring, management — six desks within one office to learn from.",
  },
  {
    icon: MapPin,
    title: "A base worth coming to",
    body: "A professional office on Kenneth Minimah Crescent, Guzape — with the projects you sell minutes away.",
  },
];

function CareersPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Careers"
        title={
          <>
            Build Abuja
            <span className="block text-gold">with us.</span>
          </>
        }
        description="Kay-Steph is a deliberately small, high-trust team. We hire people who take ownership, keep promises in writing and treat a client's life savings with the seriousness it deserves."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#open-roles"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            See open roles <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            to="/affiliate/auth"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            Earn as an affiliate instead
          </Link>
        </div>
      </PageHero>

      {/* Why work here */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="Why Kay-Steph" title="What working here actually looks like." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="border border-border bg-white p-7 text-center shadow-sm"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-navy">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section id="open-roles" className="scroll-mt-28 bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Open roles"
            title="Current openings in Guzape."
            description={`Apply by email with your CV and a short note on why you fit: ${EMAIL} — subject line “Application — [role name]”.`}
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {openRoles.map((role) => (
              <div
                key={role.title}
                className="flex flex-col border border-border bg-white p-7 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-navy">{role.title}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                      {role.type}
                    </p>
                  </div>
                  <Briefcase className="h-5 w-5 shrink-0 text-gold" />
                </div>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{role.body}</p>
                <a
                  href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Application — ${role.title}`)}`}
                  className="mt-5 inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-bold text-navy hover:text-gold"
                >
                  <Mail className="h-4 w-4" /> Apply for this role
                </a>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
            No matching role? Exceptional people make their own openings — send your CV to{" "}
            <a href={`mailto:${EMAIL}`} className="font-semibold text-navy hover:text-gold">
              {EMAIL}
            </a>{" "}
            with a note on where you would add value.
          </p>
        </div>
      </section>

      {/* Affiliate alternative */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Not looking for a desk job?
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
              Earn with us as an affiliate — on your own schedule.
            </h2>
            <p className="mt-6 leading-7 text-white/72">
              Our affiliate programme pays transparent commissions on closed referrals. You get a
              personal referral link, per-property links, marketing materials and a dashboard that
              tracks every lead, conversion and payout.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Commission on completed property sales",
                "Trackable referral and property links",
                "Brochures and campaign materials provided",
                "Commissions visible and withdrawable from your dashboard",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-gold/40 bg-white/5 p-8 text-center">
            <Handshake className="mx-auto h-10 w-10 text-gold" />
            <h3 className="mt-4 font-serif text-2xl font-bold">Affiliate programme</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Apply in minutes. Approval is required before you can submit referrals.
            </p>
            <Link
              to="/affiliate/auth"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              Apply as an affiliate <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Location strip */}
      <section className="bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 text-sm text-muted-foreground sm:px-6">
          <MapPin className="h-4 w-4 text-gold" />
          <span>All roles are based at {ADDRESS_LINES.join(" ")} unless stated otherwise.</span>
        </div>
      </section>
    </PageShell>
  );
}
