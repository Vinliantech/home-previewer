import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, MessageCircle, ShieldCheck, TrendingUp, Users, WalletCards } from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { WHATSAPP_URL, properties } from "@/lib/properties";

export const Route = createFileRoute("/invest/")({
  head: () => ({
    meta: [
      { title: "Kay-Steph Invest | Group & Fractional Property Ownership" },
      {
        name: "description",
        content:
          "Structured co-ownership, fractional entry and group purchase opportunities across Kay-Steph's Abuja property portfolio.",
      },
      { property: "og:title", content: "Kay-Steph Invest | Group & Fractional Property Ownership" },
      {
        property: "og:description",
        content:
          "Access verified property investments in Abuja with clear documentation and structured returns.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: InvestPage,
});

const pillars = [
  { icon: ShieldCheck, title: "Verified opportunities", body: "Every project is documented, title-checked and pre-underwritten by the Kay-Steph team." },
  { icon: Users, title: "Group ownership", body: "Enter jointly with other investors through a structured co-ownership vehicle." },
  { icon: WalletCards, title: "Flexible entry", body: "Fractional units and tiered pricing let you begin at a level that suits you." },
  { icon: FileCheck2, title: "Document tracking", body: "Contribution receipts, title updates and disclosures live in one investor portal." },
  { icon: TrendingUp, title: "Return reporting", body: "Rental yield, appreciation and distributions are reported transparently." },
];

function InvestPage() {
  const openProperties = properties.filter((p) => p.fundingStatus !== "available");
  return (
    <PageShell>
      <PageHero
        eyebrow="Kay-Steph Invest"
        title={<>Property ownership, <span className="text-gold">made more accessible.</span></>}
        description="Verified group-buy and fractional investment opportunities across Kay-Steph's Abuja portfolio — with clear documentation, KYC and reporting."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            <MessageCircle className="h-4 w-4" /> Speak to an investment adviser
          </a>
          <a
            href="/properties"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            Browse the portfolio <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </PageHero>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="A clearer route into premium property"
            description="Kay-Steph Invest brings the structure of a private-office deal to individual investors."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="border border-border bg-white p-7 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-navy">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Current opportunities"
            title="Projects currently accepting investment"
            description="Contact the team for the full deal room, disclosures and unit availability."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {openProperties.map((property) => (
              <article key={property.id} className="group flex flex-col overflow-hidden rounded-md border border-border bg-white shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    width={1200}
                    height={800}
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{property.location}</div>
                  <h3 className="mt-2 font-serif text-xl font-bold text-navy">{property.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{property.tagline}</p>
                  <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                    <div>
                      <div className="font-serif text-lg font-bold text-navy">{property.price}</div>
                      <div className="text-xs text-muted-foreground">{property.priceNote}</div>
                    </div>
                    <a
                      href={`/properties/${property.id}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
                    >
                      Details <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Ready to begin?</p>
          <h2 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">
            Book a private strategy call.
          </h2>
          <p className="mt-5 text-base leading-7 text-white/75">
            We will walk you through eligibility, KYC, the structure of the vehicle and the specific project best matched to your objectives.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              <MessageCircle className="h-4 w-4" /> Message the invest team
            </a>
            <a
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              Request an information pack
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
