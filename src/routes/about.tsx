import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Handshake,
  Landmark,
  MapPin,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import storyImg from "@/assets/about/dream-house-guzape.jpg";
import plotsImg from "@/assets/estate-plots.jpg";
import teamCultureImg from "@/assets/about/team-site-visit.jpg";
import ceoImg from "@/assets/about/ceo-portrait.jpg";
import { ADDRESS_LINES, WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Kay-Steph Group | Abuja Property Developer & Investment Platform" },
      {
        name: "description",
        content:
          "Kay-Steph Group develops signature homes, terraces, apartments and estate land across Abuja, and opens verified property investment to buyers at every level.",
      },
      { property: "og:title", content: "About Kay-Steph Group" },
      {
        property: "og:description",
        content: "The story, mission and values behind Abuja's Kay-Steph Group.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/about" }],
  }),
  component: AboutPage,
});

const milestones = [
  {
    title: "Rooted in Guzape",
    body: "Kay-Steph is headquartered at No. 43 Kenneth Minimah Crescent, Guzape — the same street as our signature Dream Homes development. We build where we live.",
  },
  {
    title: "A portfolio across four districts",
    body: "Active projects span Guzape, Jahi, Life Camp, Karsana and the Abacha Barracks corridor — districts selected for enduring residential demand.",
  },
  {
    title: "Ownership opened up",
    body: "Beyond outright sales, we pioneered structured group purchase, fractional ownership, SPV co-investment and tokenized units so more people can own verified Abuja property.",
  },
  {
    title: "Documented from day one",
    body: "Every transaction — from a ₦1M tokenized unit to a ₦500M residence — is verified, disclosed in writing and tracked in one investor portal.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Integrity first",
    body: "We publish title status, project stage and risks before you commit — and put every promise in writing.",
  },
  {
    icon: Handshake,
    title: "Client care",
    body: "Direct access to the team responsible for your transaction, from first enquiry to handover and beyond.",
  },
  {
    icon: Building2,
    title: "Quality-led delivery",
    body: "Homes designed and finished for principal families and professionals — assets that hold their appeal.",
  },
  {
    icon: Landmark,
    title: "Long-term stewardship",
    body: "Professional management, periodic revaluation and transparent reporting for as long as you own.",
  },
];

function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About Kay-Steph"
        title={
          <>
            Built from the capital,
            <span className="block text-gold">for people who expect proof.</span>
          </>
        }
        description="Kay-Steph Group is an Abuja property development and investment company. We develop considered homes and estate land, and we open verified ownership to buyers and investors at nearly every budget."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/properties"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            See our properties <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/team"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            Meet the team
          </Link>
        </div>
      </PageHero>

      {/* Story */}
      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative">
            <img
              src={storyImg}
              alt="Kay-Steph residential development in Guzape, Abuja"
              className="aspect-[4/3] w-full object-cover"
              width={1200}
              height={800}
              loading="lazy"
            />
            <div className="absolute -bottom-5 -right-4 hidden border border-gold/40 bg-navy px-6 py-4 text-white sm:block">
              <div className="flex items-center gap-2 font-serif text-2xl font-bold text-gold">
                <MapPin className="h-5 w-5" /> Guzape
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                {ADDRESS_LINES[0]}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Our story</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-navy sm:text-4xl">
              Local knowledge. A more considered way to own property.
            </h2>
            <p className="mt-6 leading-7 text-muted-foreground">
              From our base in Guzape, Kay-Steph selects locations with enduring residential demand
              and develops homes that balance contemporary design, daily comfort and investment
              value. Our portfolio spans signature detached residences, serviced apartments,
              terraces and surveyed estate land.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              We also believe premium property should not be reserved for those who can buy
              outright. Through structured group purchase, fractional ownership, SPV co-investment
              and tokenized units, verified investors join the same projects — with the same
              documentation — from far smaller tickets.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8 sm:gap-6">
              {[
                { value: "6", label: "Active projects" },
                { value: "6", label: "Abuja districts" },
                { value: "3", label: "Ownership routes" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-3xl font-bold text-gold">{stat.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision / Mission */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-2">
          <div className="border border-white/12 bg-white/5 p-8">
            <TrendingUp className="h-7 w-7 text-gold" />
            <h2 className="mt-5 font-serif text-2xl font-bold">Our vision</h2>
            <p className="mt-3 leading-7 text-white/72">
              To shape Abuja's most trusted collection of homes and investment-ready communities —
              places people are proud to live in and confident to own.
            </p>
          </div>
          <div className="border border-white/12 bg-white/5 p-8">
            <Handshake className="h-7 w-7 text-gold" />
            <h2 className="mt-5 font-serif text-2xl font-bold">Our mission</h2>
            <p className="mt-3 leading-7 text-white/72">
              To make premium property ownership clear, personal and dependable — from first enquiry
              through documentation, delivery and long-term returns.
            </p>
          </div>
        </div>
      </section>

      {/* Founder's note — editorial two-column, photo left with gold accent bar */}
      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <span className="absolute -left-4 bottom-8 hidden h-2/3 w-2.5 bg-gold lg:block" />
            <img
              src={ceoImg}
              alt="Dr. Kolawole E. Omolayo, Chief Executive Officer of Kay-Steph Group"
              width={1200}
              height={857}
              loading="lazy"
              className="relative aspect-[4/3] w-full rounded-sm object-cover shadow-md"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              From the Chief Executive
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-navy sm:text-4xl">
              A company built on proof, not promises.
            </h2>
            <p className="mt-6 leading-7 text-muted-foreground">
              Kay-Steph was founded on a simple conviction: that owning property in Abuja should be
              transparent, dependable and within reach of far more people than the market has
              traditionally allowed. Every project we take on is chosen for enduring value and
              delivered with the documentation to back it up.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              We build where we live, we put every commitment in writing, and we stay accountable
              long after handover. That is the standard our clients — many of them investing from
              across the diaspora — have come to expect of us.
            </p>
            <p className="mt-6 font-serif text-lg font-bold text-navy">Dr. Kolawole E. Omolayo</p>
            <p className="text-sm text-muted-foreground">Chief Executive Officer</p>
          </div>
        </div>
      </section>

      {/* Our people — editorial two-column, photo right with gold accent bar */}
      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Our people</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-navy sm:text-4xl">
              Hard work meets a hands-on team.
            </h2>
            <p className="mt-6 leading-7 text-muted-foreground">
              Behind every Kay-Steph transaction is a single, tightly-run team based in Guzape —
              advisers, engineers, surveyors and legal minds who walk the sites they sell and know
              the files they manage. No call centres, no hand-offs into the void.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              We stay close to the ground on every project, because the confidence we ask our
              clients to place in us has to be earned in person — on site, in writing and in the
              quality of what we deliver.
            </p>
            <Link
              to="/team"
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy/90"
            >
              Meet the team <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative order-1 mx-auto w-full max-w-lg lg:order-2 lg:mx-0">
            <span className="absolute -left-4 bottom-8 hidden h-2/3 w-2.5 bg-gold lg:block" />
            <img
              src={teamCultureImg}
              alt="The Kay-Steph Group team on a site visit in Abuja"
              width={1400}
              height={933}
              loading="lazy"
              className="relative aspect-[3/2] w-full rounded-sm object-cover shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="What defines us" title="Four things to know about Kay-Steph." />
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {milestones.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-5 border border-border bg-white p-7 shadow-sm"
              >
                <span className="font-serif text-4xl font-bold text-gold/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Our core values"
            title="The standards behind every transaction."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="border border-border bg-white p-7 text-center shadow-sm"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-navy">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-navy py-16 text-white">
        <img
          src={plotsImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,42,0.95)_0%,rgba(7,12,42,0.75)_100%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">Come and see who we are.</h2>
            <p className="mt-3 max-w-xl text-white/72">
              Visit our Guzape office, walk a project with us, or start with a conversation on
              WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              Contact us <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Quiet trust strip */}
      <section className="bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 text-sm text-muted-foreground sm:px-6">
          {[
            "Verified titles on every listing",
            "SPV-protected co-ownership",
            "Written disclosures before commitment",
            "One portal for documents and returns",
          ].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gold" /> {item}
            </span>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
