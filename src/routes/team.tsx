import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  HardHat,
  Headset,
  LineChart,
  MessageCircle,
  Scale,
  Users,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { PHONE_1_DISPLAY, WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Our Team | Kay-Steph Group" },
      {
        name: "description",
        content:
          "Meet the desks behind every Kay-Steph transaction — sales and advisory, legal and compliance, investor relations, project delivery, property management and client support.",
      },
      { property: "og:title", content: "Our Team | Kay-Steph Group" },
      {
        property: "og:description",
        content: "One accountable team from first enquiry to handover and beyond.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/team" }],
  }),
  component: TeamPage,
});

const desks = [
  {
    icon: Building2,
    title: "Sales & Advisory",
    body: "Your first point of contact. This desk matches your budget and goals to the right project and ownership route, runs site inspections and guides negotiations.",
    points: ["Property recommendations", "Private inspections", "Purchase guidance"],
  },
  {
    icon: Scale,
    title: "Legal & Compliance",
    body: "The desk that says no before you ever could. Title searches, registry verification, SPV formation, contract drafting and KYC review all sit here.",
    points: ["Title verification", "SPV & contract documentation", "KYC and compliance review"],
  },
  {
    icon: LineChart,
    title: "Investor Relations",
    body: "Dedicated to co-investors: contribution terms, funding milestones, distribution schedules, revaluations and exit requests — explained in plain language.",
    points: ["Contribution & funding support", "Distribution statements", "Exit & resale handling"],
  },
  {
    icon: HardHat,
    title: "Project Delivery",
    body: "Architects, engineers and site managers who take each development from design to handover — and report progress honestly along the way.",
    points: ["Design & construction", "Quality control", "Project status updates"],
  },
  {
    icon: ClipboardCheck,
    title: "Property Management",
    body: "After handover, this desk keeps assets earning: tenant sourcing, rent collection, facilities maintenance and service-charge administration.",
    points: ["Tenanting & rent collection", "Facilities maintenance", "Owner reporting"],
  },
  {
    icon: Headset,
    title: "Client Support",
    body: "The desk that answers. Phone, WhatsApp and walk-in support during office hours, with a one-business-day response promise on written enquiries.",
    points: ["Phone & WhatsApp support", "Document requests", "Complaint resolution"],
  },
];

function TeamPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Our team"
        title={
          <>
            One accountable team,
            <span className="block text-gold">six specialist desks.</span>
          </>
        }
        description="Kay-Steph deliberately stays a single, tightly-run team based in Guzape. Every client deals directly with the people responsible for their transaction — no call centres, no hand-offs into the void."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/contact"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Talk to the team <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/careers"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            Join us — careers
          </Link>
        </div>
      </PageHero>

      {/* Desks */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Who does what"
            title="The desks behind your transaction."
            description="Whatever you need, there is a named desk responsible for it — and you can reach every one of them through our Guzape office."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {desks.map((desk) => (
              <div
                key={desk.title}
                className="flex flex-col border border-border bg-white p-7 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <desk.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-navy">{desk.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{desk.body}</p>
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {desk.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-navy">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">How we work</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
              Small enough to know your file. Structured enough to protect it.
            </h2>
            <p className="mt-6 leading-7 text-white/72">
              Every client engagement is owned by a named adviser on the Sales & Advisory desk, with
              Legal & Compliance reviewing each step before money moves. Investors get the same
              pairing through Investor Relations. Decisions are logged, approvals are audited, and
              nothing depends on a single person's memory.
            </p>
            <p className="mt-4 leading-7 text-white/72">
              It is the reason our clients — many in the diaspora — can transact confidently from
              thousands of kilometres away.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { value: PHONE_1_DISPLAY, label: "One direct line to every desk" },
              { value: "1 business day", label: "Written-enquiry response promise" },
              { value: "Guzape, Abuja", label: "Walk-in office, six days a week" },
            ].map((stat) => (
              <div key={stat.label} className="border border-white/12 bg-white/5 p-6">
                <div className="font-serif text-2xl font-bold text-gold">{stat.value}</div>
                <div className="mt-1 text-sm text-white/65">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-md border border-border bg-white p-8 shadow-sm lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-navy">
                  Put a voice to the names.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Message us on WhatsApp and the right desk will pick up your enquiry — usually
                  within the hour during office time.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp the team
              </a>
              <Link
                to="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-navy/25 px-7 py-3 text-sm font-bold text-navy"
              >
                All contact options
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
