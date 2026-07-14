import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Eye,
  FileSearch,
  Handshake,
  Headset,
  Landmark,
  LayoutDashboard,
  LineChart,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import storyImg from "@/assets/guzape-dream-homes.jpg";
import { PHONE_1_DISPLAY, WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/why-kaysteph")({
  head: () => ({
    meta: [
      { title: "Why Kay-Steph | Verified Property, Transparent Investment" },
      {
        name: "description",
        content:
          "Why investors trust Kay-Steph Group: verified titles, SPV-protected ownership, transparent reporting, professional management and direct access to the team behind every transaction.",
      },
      {
        property: "og:title",
        content: "Why Kay-Steph | Verified Property, Transparent Investment",
      },
      {
        property: "og:description",
        content:
          "Verified titles, SPV protection, transparent reporting and professional management from Abuja's Guzape district.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/why-kaysteph" }],
  }),
  component: WhyKayStephPage,
});

const pillars = [
  {
    icon: ShieldCheck,
    title: "Trust and integrity",
    body: "We publish what we know — title status, project stage, funding progress and risks — before you commit a single naira.",
  },
  {
    icon: TrendingUp,
    title: "Long-term value",
    body: "We select districts with enduring residential demand: Guzape, Jahi, Life Camp, Karsana and the Abacha Barracks corridor.",
  },
  {
    icon: WalletCards,
    title: "Flexible entry points",
    body: "From ₦1M tokenized units to ₦500M signature residences, there is a documented route in at nearly every budget.",
  },
  {
    icon: Building2,
    title: "Quality-led delivery",
    body: "Our developments are designed and finished for principal families and professionals — assets that hold their appeal.",
  },
  {
    icon: Landmark,
    title: "Documented ownership",
    body: "Every purchase and every fractional interest is evidenced by verifiable records, not promises.",
  },
];

const verificationSteps = [
  {
    title: "Title search & legal review",
    body: "Before any property is listed, our legal team searches the title at the relevant registry and reviews encumbrances, consent and documentation.",
  },
  {
    title: "Physical & survey verification",
    body: "We confirm boundaries, survey plans and site conditions on the ground — every plot we sell is one we have walked.",
  },
  {
    title: "Independent valuation",
    body: "Investment properties are professionally valued at listing and revalued periodically, so the figures on your dashboard reflect the market.",
  },
  {
    title: "Disclosure before commitment",
    body: "Title information, contribution terms, projected returns, risks and exit conditions are presented in writing before you invest.",
  },
];

const protections = [
  {
    icon: Landmark,
    title: "SPV-protected ownership",
    body: "Co-owned properties are held in dedicated Special Purpose Vehicles, ring-fencing your asset from any other liability.",
  },
  {
    icon: Lock,
    title: "Protected funds handling",
    body: "Contributions flow to designated project accounts. Payment evidence is verified by finance before any approval is recorded.",
  },
  {
    icon: ClipboardCheck,
    title: "Audited approvals",
    body: "Investment approvals, valuations, distributions and exits are processed transactionally with a permanent audit log.",
  },
  {
    icon: BadgeCheck,
    title: "Verified investors only",
    body: "Every participant completes KYC. You co-own with identified, verified people — never anonymous money.",
  },
];

const technology = [
  {
    icon: LayoutDashboard,
    title: "Investor dashboard",
    body: "Your contributions, ownership units, current share value, documents and distributions in one secure portal — on any device.",
  },
  {
    icon: LineChart,
    title: "Live funding & valuation data",
    body: "Watch funding progress in real time and see your share's value move with each professional revaluation.",
  },
  {
    icon: FileSearch,
    title: "Certificate verification",
    body: "Ownership certificates carry verification tokens anyone can check independently — proof that stands outside our word.",
  },
  {
    icon: Eye,
    title: "Full reporting trail",
    body: "Statements, rental distribution records, project updates and exit status — downloadable whenever you or your advisers need them.",
  },
];

const reasons = [
  "Verified titles and physical due diligence on every listed property",
  "SPV structures that ring-fence each co-owned asset",
  "Written risk disclosures before any commitment",
  "Professional property and facilities management after purchase",
  "Transparent, portal-based reporting — no chasing for updates",
  "A physical head office in Guzape you can walk into",
  "Direct phone and WhatsApp access to the team on each transaction",
  "A documented, audited process for withdrawals and resale",
];

function WhyKayStephPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Why Kay-Steph"
        title={
          <>
            Property is a trust business.
            <span className="block text-gold">We earn it in writing.</span>
          </>
        }
        description="Kay-Steph Group combines verified assets, protective legal structures, professional management and transparent technology — so you always know exactly what you own and how it is performing."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/invest"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Start investing <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            Visit our Guzape office
          </Link>
        </div>
      </PageHero>

      {/* Value proposition pillars */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Our value proposition"
            title="Five commitments behind every transaction."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="border border-border bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-navy text-gold">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-navy">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="bg-navy py-20 text-white">
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
            <div className="absolute -bottom-5 -right-4 hidden border border-gold/40 bg-navy px-6 py-4 sm:block">
              <div className="flex items-center gap-2 font-serif text-2xl font-bold text-gold">
                <MapPin className="h-5 w-5" /> Guzape
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                A real office, on a real street
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Credibility</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
              We build where we live — and put our name on the street.
            </h2>
            <p className="mt-6 leading-7 text-white/72">
              Kay-Steph is headquartered at No. 43 Kenneth Minimah Crescent, Guzape — the same
              premium street as our signature Guzape Dream Homes. Our team lives with the projects
              we sell, and every client deals directly with the people responsible for delivery.
            </p>
            <p className="mt-4 leading-7 text-white/72">
              Our active portfolio spans five projects across four Abuja districts, covering
              signature residences, serviced apartments, terraces and surveyed estate land — with
              two documented ownership routes: outright purchase and structured co-investment.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
              {[
                { value: "5", label: "Active projects" },
                { value: "4", label: "Abuja districts" },
                { value: "2", label: "Ownership routes" },
                { value: "1", label: "Accountable team" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-3xl font-bold text-gold">{stat.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/55">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verification process */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Property verification"
            title="Nothing is listed until it survives scrutiny."
            description="Every property passes a four-stage verification process before it appears on this website or the investor portal."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {verificationSteps.map((step, index) => (
              <div key={step.title} className="border border-border bg-white p-7 shadow-sm">
                <span className="font-serif text-4xl font-bold text-gold/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-navy">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor protection */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Investor protection"
            title="Structures that protect you when it matters."
            description="Transparency is a promise; structure is a safeguard. We build both into every investment."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {protections.map((item) => (
              <div key={item.title} className="border border-border bg-white p-7 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-gold-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Management & support */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="border border-white/12 bg-white/5 p-8">
            <Handshake className="h-7 w-7 text-gold" />
            <h2 className="mt-5 font-serif text-3xl font-bold">Professional management</h2>
            <p className="mt-4 leading-7 text-white/72">
              Ownership should not become a second job. For income-generating properties, Kay-Steph
              handles tenanting, rent collection, facilities maintenance and service-charge
              administration — and reports the numbers to every owner.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Tenant sourcing and vetting",
                "Rent collection and distribution",
                "Facilities and estate maintenance",
                "Periodic professional revaluation",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-white/12 bg-white/5 p-8">
            <Headset className="h-7 w-7 text-gold" />
            <h2 className="mt-5 font-serif text-3xl font-bold">Customer support that answers</h2>
            <p className="mt-4 leading-7 text-white/72">
              You get direct lines — phone and WhatsApp — to the team on your transaction, a
              physical office you can visit, and a support desk that responds within one business
              day. No ticket queues into the void.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                `Direct line: ${PHONE_1_DISPLAY}`,
                "WhatsApp support during office hours",
                "Walk-in office at Guzape, Abuja",
                "Dedicated investor relations desk",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Technology & reporting */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Technology & reporting"
            title="See everything. Chase nothing."
            description="Our platform replaces fragmented chats and spreadsheets with one verified source of truth for your ownership."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {technology.map((item) => (
              <div key={item.title} className="border border-border bg-white p-7 shadow-sm">
                <item.icon className="h-6 w-6 text-gold" />
                <h3 className="mt-5 font-serif text-lg font-bold text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reasons to trust */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
                The short version
              </p>
              <h2 className="mt-4 font-serif text-3xl font-bold text-navy sm:text-4xl">
                Eight reasons investors choose Kay-Steph.
              </h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                If you take nothing else from this page, take this list — and then come test it
                against us in person.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/properties"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
                >
                  Browse properties <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-navy/25 bg-white px-7 py-3 text-sm font-bold text-navy"
                >
                  <MessageCircle className="h-4 w-4" /> Ask us anything
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reasons.map((reason) => (
                <div
                  key={reason}
                  className="flex items-start gap-3 border border-border bg-white p-5 shadow-sm"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <span className="text-sm leading-6 text-navy">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">
              Judge us by the paperwork.
            </h2>
            <p className="mt-3 max-w-xl text-white/72">
              Create a free account, open any property and read the documents before you commit a
              kobo. That is how confident we are.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/invest"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              How investing works
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
