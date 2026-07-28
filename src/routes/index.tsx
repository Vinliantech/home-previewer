import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Handshake,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageShell } from "@/components/site/PageShell";
import heroImg from "@/assets/karsana-shopping-mall-hero.jpg";
import storyImg from "@/assets/kaysteph-reception-office.jpg";
import investmentImg from "@/assets/estate-plots.jpg";
import {
  ADDRESS_LINES,
  PHONE_1,
  PHONE_1_DISPLAY,
  PHONE_2,
  PHONE_2_DISPLAY,
  WHATSAPP_URL,
  mergeCatalogueProperties,
} from "@/lib/properties";
import { listPublicPropertyCatalogue } from "@/lib/invest.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return await listPublicPropertyCatalogue();
    } catch {
      return { properties: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "Kay-Steph Group | Premium Real Estate in Abuja" },
      {
        name: "description",
        content:
          "Discover premium homes, estate plots and transparent co-investment opportunities from Kay-Steph Group across Abuja.",
      },
      { property: "og:title", content: "Kay-Steph Group | Premium Real Estate in Abuja" },
      {
        property: "og:description",
        content:
          "Discover premium homes, estate plots and transparent co-investment opportunities from Kay-Steph Group across Abuja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/" }],
  }),
  component: Home,
});

const valueItems = [
  { icon: ShieldCheck, label: "Trust and integrity" },
  { icon: TrendingUp, label: "Long-term value" },
  { icon: WalletCards, label: "Flexible entry points" },
  { icon: Building2, label: "Quality-led delivery" },
  { icon: Landmark, label: "Documented ownership" },
];

const faqs = [
  {
    question: "What types of property does Kay-Steph offer?",
    answer:
      "Our current portfolio includes detached homes, serviced apartments, contemporary terraces and surveyed estate land across key Abuja districts.",
  },
  {
    question: "Can I schedule a private site inspection?",
    answer:
      "Yes. Choose any property and send an inspection request by WhatsApp or call our Guzape office. A member of the team will confirm availability and timing.",
  },
  {
    question: "How does group property investment work?",
    answer:
      "Verified investors can contribute toward a selected property through a structured co-ownership vehicle. Contributions, ownership units, documents and returns are tracked in the investor portal.",
  },
  {
    question: "What documents are available before I commit?",
    answer:
      "Property-specific title information, risk disclosures, contribution terms and exit conditions are presented before an investment is submitted. Additional legal documents are released according to the transaction stage.",
  },
  {
    question: "How do I begin?",
    answer:
      "Browse the properties, request a site visit or create an investor account. Our team will guide you through due diligence, KYC and the appropriate purchase or co-investment route.",
  },
];

const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Kay-Steph Group",
  url: "https://kaystephgroup.com/",
  telephone: PHONE_1,
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 43 Kenneth Minimah Crescent",
    addressLocality: "Guzape",
    addressRegion: "Abuja FCT",
    addressCountry: "NG",
  },
  areaServed: "Abuja, Nigeria",
};

function Home() {
  const loaderData = Route.useLoaderData();
  const displayedProperties = mergeCatalogueProperties(loaderData.properties).filter(
    (property) => property.showOnHome !== false,
  );
  const activeProjects = displayedProperties.filter(
    (property) => property.fundingStatus !== "coming_soon",
  ).length;
  const districts = new Set(
    displayedProperties
      .filter((property) => property.fundingStatus !== "coming_soon")
      .map((property) => property.location.split(",")[0].trim()),
  ).size;

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
      />

      <section id="top" className="relative min-h-[760px] overflow-hidden bg-navy text-white">
        <img
          src={heroImg}
          alt="Karsana Shopping Mall by Kay-Steph Group in Abuja"
          className="absolute inset-0 h-full w-full object-cover"
          width={2400}
          height={1350}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,42,0.92)_0%,rgba(7,12,42,0.68)_52%,rgba(7,12,42,0.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(0deg,rgba(7,12,42,0.9),transparent)]" />

        <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-4 pb-28 pt-32 sm:px-6">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/45 bg-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold backdrop-blur">
              <MapPin className="h-3.5 w-3.5" /> Premium real estate across Abuja
            </div>
            <h1 className="max-w-3xl font-serif text-5xl font-bold leading-[1.04] sm:text-6xl lg:text-7xl">
              Live beautifully.
              <span className="block text-gold">Invest intelligently.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/78 sm:text-lg">
              Kay-Steph develops considered homes and estate land for people who expect quality,
              clear documentation and lasting value in Nigeria's capital.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/properties"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                Explore properties <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
              >
                Book a private inspection
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-20 left-[-5%] z-10 h-40 w-[110%] rounded-[50%_50%_0_0/100%_100%_0_0] bg-background" />
      </section>

      <section id="about" className="relative z-20 bg-background pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative -mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/properties"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground shadow-lg"
            >
              View available homes
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-navy/25 bg-white px-6 py-2.5 text-sm font-bold text-navy shadow-sm"
            >
              Speak with an adviser
            </a>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <PurposeCard
              icon={Building2}
              title="Our vision"
              body="To shape Abuja's most trusted collection of homes and investment-ready communities."
            />
            <PurposeCard
              icon={Handshake}
              title="Our mission"
              body="To make premium property ownership clear, personal and dependable from first enquiry to handover."
            />
            <PurposeCard
              icon={CheckCircle2}
              title="Our core values"
              body="Client care, documented transactions, professional delivery and long-term stewardship."
            />
          </div>

          <div id="why-kaysteph" className="mt-12 border-y border-border py-10">
            <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Our value proposition
            </p>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-5">
              {valueItems.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-navy text-gold">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-navy">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/why-kaysteph"
                className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
              >
                See why investors choose Kay-Steph <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative">
            <img
              src={storyImg}
              alt="Kay-Steph Group reception office in Guzape, Abuja"
              className="aspect-[4/3] w-full object-cover"
              width={2000}
              height={1428}
              loading="lazy"
            />
            <div className="absolute -bottom-5 -right-4 hidden border border-gold/40 bg-navy px-6 py-4 sm:block">
              <div className="font-serif text-3xl font-bold text-gold">Abuja</div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Built from the capital
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Our story</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
              Local knowledge. A more considered way to own property.
            </h2>
            <p className="mt-6 text-base leading-7 text-white/72">
              From our base in Guzape, Kay-Steph selects locations with enduring residential demand
              and develops homes that balance contemporary design, daily comfort and investment
              value.
            </p>
            <p className="mt-4 text-base leading-7 text-white/72">
              Our portfolio spans signature detached residences, serviced apartments, terraces and
              surveyed estate land, with direct access to the team responsible for each transaction.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-3">
              <StoryStat value={String(activeProjects)} label="Active projects" />
              <StoryStat value={String(districts)} label="Abuja districts" />
              <StoryStat value="3" label="Ownership routes" />
            </div>
          </div>
        </div>
      </section>

      <section id="properties" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Our properties
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold text-navy sm:text-5xl">
              Find the right place to live, build or invest.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Explore current opportunities across Guzape, Jahi, Life Camp, Karsana and the Abacha
              Barracks corridor.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedProperties.map((property, index) => (
              <article
                key={property.id}
                className={`group relative min-h-[430px] overflow-hidden rounded-md bg-navy ${
                  index >= 3 ? "lg:min-h-[360px]" : ""
                }`}
              >
                <img
                  src={property.image}
                  alt={property.title}
                  loading="lazy"
                  width={1200}
                  height={800}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,9,31,0.93)_0%,rgba(5,9,31,0.16)_68%)]" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                    <span>{property.tag}</span>
                    <span className="text-white/70">{property.location}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold">{property.title}</h3>
                  <p className="mt-2 text-sm text-white/72">{property.tagline}</p>
                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/20 pt-4">
                    <div>
                      <div className="font-serif text-xl font-bold text-gold">{property.price}</div>
                      <div className="text-xs text-white/55">{property.priceNote}</div>
                    </div>
                    <Link
                      to="/properties/$id"
                      params={{ id: property.id }}
                      className="inline-flex items-center gap-1 text-sm font-bold hover:text-gold"
                    >
                      View project <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/properties"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-navy/25 px-8 py-3 text-sm font-bold text-navy hover:border-gold hover:text-gold"
            >
              View all properties with filters <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-cream py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-md bg-navy text-white">
            <img
              src={investmentImg}
              alt="Surveyed Kay-Steph estate land in Abuja"
              loading="lazy"
              width={1200}
              height={800}
              className="absolute inset-0 h-full w-full object-cover opacity-32"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,42,0.98)_0%,rgba(7,12,42,0.82)_58%,rgba(7,12,42,0.52)_100%)]" />
            <div className="relative grid gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:px-16 lg:py-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
                  Kay-Steph Invest
                </p>
                <h2 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
                  Property ownership, made more accessible.
                </h2>
                <p className="mt-5 max-w-2xl leading-7 text-white/72">
                  Explore verified group-buy and fractional opportunities, complete KYC securely,
                  review risk disclosures and monitor your ownership through one investor portal.
                </p>
              </div>
              <div className="space-y-3">
                <FeatureLine icon={Users} text="Structured group ownership" />
                <FeatureLine icon={FileCheck2} text="KYC and document tracking" />
                <FeatureLine icon={TrendingUp} text="Portfolio and return reporting" />
                <Link
                  to="/invest"
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
                >
                  View investment opportunities <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-cream py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Frequently asked questions
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold text-navy sm:text-5xl">
              Clear answers before you decide.
            </h2>
          </div>
          <Accordion type="single" collapsible className="mx-auto mt-12 max-w-4xl space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="rounded-md border border-border bg-white px-5 shadow-sm"
              >
                <AccordionTrigger className="text-left text-sm font-bold text-navy hover:no-underline sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-3xl pb-5 leading-7 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 text-center">
            <Link
              to="/faq"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-navy/25 bg-white px-8 py-3 text-sm font-bold text-navy hover:border-gold hover:text-gold"
            >
              Read the full FAQ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-background py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Visit or contact us
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold text-navy sm:text-5xl">
              Start with a real conversation.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Tell us what you are looking for and we will recommend the most suitable project,
              purchase route and next step.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp us
              </a>
              <a
                href={`tel:${PHONE_1}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-navy/25 px-6 py-3 text-sm font-bold text-navy"
              >
                <Phone className="h-4 w-4" /> {PHONE_1_DISPLAY}
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ContactBlock icon={MapPin} title="Head office">
              {ADDRESS_LINES.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </ContactBlock>
            <ContactBlock icon={Phone} title="Direct lines">
              <a href={`tel:${PHONE_1}`} className="block hover:text-gold">
                {PHONE_1_DISPLAY}
              </a>
              <a href={`tel:${PHONE_2}`} className="block hover:text-gold">
                {PHONE_2_DISPLAY}
              </a>
            </ContactBlock>
            <ContactBlock icon={Clock3} title="Office hours">
              <div>Monday - Friday: 9:00 - 18:00</div>
              <div>Saturday: 10:00 - 15:00</div>
            </ContactBlock>
            <ContactBlock icon={Handshake} title="Private inspections">
              <div>Available by confirmed appointment across all active projects.</div>
            </ContactBlock>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function PurposeCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Building2;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-border bg-white px-7 py-8 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gold text-gold-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 font-serif text-xl font-bold text-navy">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function StoryStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-3xl font-bold text-gold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/55">{label}</div>
    </div>
  );
}

function FeatureLine({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/15 pb-3 text-sm font-semibold text-white/85">
      <Icon className="h-5 w-5 text-gold" /> {text}
    </div>
  );
}

function ContactBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-white p-6">
      <Icon className="h-5 w-5 text-gold" />
      <h3 className="mt-4 font-serif text-lg font-bold text-navy">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}
