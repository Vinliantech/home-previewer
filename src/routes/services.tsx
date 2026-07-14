import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Landmark,
  LineChart,
  Map,
  MessageCircle,
  PiggyBank,
  Scale,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services | Development, Sales, Investment & Management — Kay-Steph" },
      {
        name: "description",
        content:
          "Kay-Steph Group services: property development, sales and advisory, structured co-investment, property management, land banking and transaction support in Abuja.",
      },
      { property: "og:title", content: "Kay-Steph Services" },
      {
        property: "og:description",
        content:
          "Six services covering the full life of a property — from land to long-term returns.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/services" }],
  }),
  component: ServicesPage,
});

const services = [
  {
    icon: Building2,
    title: "Property development",
    body: "We design and deliver signature residences, serviced apartments, terraces and estate infrastructure in Abuja's most resilient districts.",
    points: [
      "Signature detached homes and terraces",
      "Serviced apartment developments",
      "Estate planning and infrastructure",
    ],
    cta: { label: "See current projects", to: "/properties" as const },
  },
  {
    icon: ClipboardCheck,
    title: "Sales & buyer advisory",
    body: "From your first enquiry to keys in hand: recommendations matched to your budget, private inspections, negotiation and documentation support.",
    points: [
      "Property matching and shortlists",
      "Private site inspections",
      "Purchase and title documentation",
    ],
    cta: { label: "Book an inspection", to: "/contact" as const },
  },
  {
    icon: PiggyBank,
    title: "Structured co-investment",
    body: "Group Buy pools and Tokenized Ownership — verified routes into premium property from ₦1M, each held in a dedicated SPV.",
    points: [
      "Group Buy pool coordination",
      "Tokenized Ownership from ₦1M per unit",
      "SPV protection and records",
    ],
    cta: { label: "How investing works", to: "/invest" as const },
  },
  {
    icon: LineChart,
    title: "Property & portfolio management",
    body: "After handover we keep assets earning: tenanting, rent collection, maintenance and owner reporting — for single owners and co-investor groups alike.",
    points: [
      "Tenant sourcing and vetting",
      "Rent collection and distributions",
      "Facilities and estate maintenance",
    ],
    cta: { label: "Talk to management", to: "/contact" as const },
  },
  {
    icon: Map,
    title: "Land banking & estate plots",
    body: "Surveyed, title-verified estate parcels in appreciating corridors — with flexible sizing for personal builds, developers and long-horizon investors.",
    points: [
      "Verified survey and title documents",
      "Flexible plot sizing",
      "Corridor selection guidance",
    ],
    cta: { label: "View estate plots", to: "/properties" as const },
  },
  {
    icon: Scale,
    title: "Transaction & documentation support",
    body: "Legal review, KYC processing, certificate issuance and independent verification support — so your ownership stands on paper, anywhere.",
    points: [
      "Contract and title review",
      "KYC and investor verification",
      "Ownership certificates with verification tokens",
    ],
    cta: { label: "Ask a question", to: "/faq" as const },
  },
];

function ServicesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Our services"
        title={
          <>
            Everything a property needs,
            <span className="block text-gold">under one roof.</span>
          </>
        }
        description="From raw land to long-term returns, Kay-Steph covers the full life of a property — development, sales, structured investment, management and the paperwork that holds it all together."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/contact"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Discuss your needs <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/invest"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            Investment routes
          </Link>
        </div>
      </PageHero>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Six services"
            title="Choose where you need us — or take the full journey."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="flex flex-col border border-border bg-white p-7 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <service.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-serif text-xl font-bold text-navy">{service.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.body}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-navy">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {point}
                    </li>
                  ))}
                </ul>
                <Link
                  to={service.cta.to}
                  className="mt-5 inline-flex items-center gap-1 border-t border-border pt-4 text-sm font-bold text-navy hover:text-gold"
                >
                  {service.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process strip */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              How an engagement runs
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              Simple on the surface. Rigorous underneath.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Listen",
                body: "We start with your budget, timeline and goals — not a sales pitch.",
              },
              {
                title: "Verify",
                body: "Titles, surveys and valuations are checked before anything is recommended.",
              },
              {
                title: "Document",
                body: "Terms, risks and ownership records are put in writing before money moves.",
              },
              {
                title: "Deliver & report",
                body: "Handover, management and transparent reporting for as long as you own.",
              },
            ].map((step, index) => (
              <div key={step.title} className="border border-white/12 bg-white/5 p-7">
                <span className="font-serif text-3xl font-bold text-white/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Landmark className="h-6 w-6 text-gold" />
              <h2 className="font-serif text-3xl font-bold text-navy sm:text-4xl">
                Not sure which service you need?
              </h2>
            </div>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Describe your situation and we will map the route — buying, investing, building or
              managing.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp an adviser
            </a>
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-navy/25 bg-white px-7 py-3 text-sm font-bold text-navy"
            >
              Send an enquiry
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
