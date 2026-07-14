import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Download,
  LineChart,
  MapPin,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { WHATSAPP_URL, properties } from "@/lib/properties";

export const Route = createFileRoute("/market-report")({
  head: () => ({
    meta: [
      { title: "Abuja Market Report | District Prices & Trends — Kay-Steph" },
      {
        name: "description",
        content:
          "Kay-Steph's view of the Abuja residential market: indicative entry prices by district, demand drivers, projected returns and where value is moving next.",
      },
      { property: "og:title", content: "Kay-Steph Abuja Market Report" },
      {
        property: "og:description",
        content: "Indicative district pricing, demand drivers and projected returns across Abuja.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/market-report" }],
  }),
  component: MarketReportPage,
});

const districtInsights = [
  {
    district: "Guzape",
    profile: "Prestige residential, diplomatic-adjacent",
    demand: "Principal families, senior professionals, diaspora",
    signal: "Thin supply of title-clean premium homes keeps the top end resilient.",
  },
  {
    district: "Jahi",
    profile: "Connected serviced-apartment district",
    demand: "Professionals, expatriates, yield investors",
    signal: "Serviced units let quickly; rental yield leads the portfolio.",
  },
  {
    district: "Life Camp",
    profile: "Mature professional neighbourhood",
    demand: "Owner-occupiers, lock-and-leave households",
    signal: "Steady, dependable pricing with consistent terrace demand.",
  },
  {
    district: "Karsana",
    profile: "Value corridor, fast-improving infrastructure",
    demand: "First-time detached buyers, upgrading families",
    signal: "Tiered entry from ₦90M draws steady family demand as roads complete.",
  },
  {
    district: "Abacha Barracks corridor",
    profile: "Estate land, security-adjacent",
    demand: "Land bankers, personal builders, small developers",
    signal: "₦65,000/sqm entry with verified titles — the portfolio's appreciation leader.",
  },
];

const drivers = [
  {
    icon: TrendingUp,
    title: "Population pressure",
    body: "Abuja keeps absorbing professionals, agencies and returning diaspora faster than quality housing is delivered — the structural case for the capital's property market.",
  },
  {
    icon: Building2,
    title: "Quality gap",
    body: "Demand is strongest for finished, documented, professionally managed homes. Assets that clear that bar outperform the market average in both price and letting speed.",
  },
  {
    icon: LineChart,
    title: "Naira hedging",
    body: "Property remains the household hedge of choice against currency movement, sustaining investment demand for verified, income-capable assets.",
  },
  {
    icon: MapPin,
    title: "Corridor build-out",
    body: "Value migrates along new infrastructure. Karsana and the Abacha Barracks corridor are the current beneficiaries — early, verified entries capture the appreciation.",
  },
];

function MarketReportPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Market report"
        title={
          <>
            The Abuja market,
            <span className="block text-gold">as we see it from the ground.</span>
          </>
        }
        description="Indicative pricing and trends drawn from Kay-Steph's live portfolio and transaction desk. Figures are indicative entry levels, updated as projects reprice — not valuations of any specific unit."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/contact"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            <Download className="h-4 w-4" /> Request the full report
          </Link>
          <Link
            to="/properties"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            See live listings
          </Link>
        </div>
      </PageHero>

      {/* Indicative pricing table from live portfolio */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Indicative entry pricing"
            title="Current entry levels across our portfolio."
            description="Drawn directly from live Kay-Steph projects. Entry price is the lowest available unit or minimum parcel; projected return combines indicative rental yield and appreciation, stated per property and never guaranteed."
          />
          <div className="mt-12 overflow-x-auto rounded-md border border-border bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-cream text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-5 py-4 font-semibold">Project</th>
                  <th className="px-5 py-4 font-semibold">Location</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Entry price</th>
                  <th className="px-5 py-4 font-semibold">Proj. return / yr</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <Link
                        to="/properties/$id"
                        params={{ id: property.id }}
                        className="font-bold text-navy hover:text-gold"
                      >
                        {property.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{property.location}</td>
                    <td className="px-5 py-4 text-muted-foreground">{property.propertyType}</td>
                    <td className="px-5 py-4 font-semibold text-navy">
                      {property.price}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {property.priceNote}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-serif text-lg font-bold text-gold">
                      {property.expectedReturnPct}%
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{property.tag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Indicative figures for orientation only; confirm current pricing and terms per property
            before any decision. This page is not financial advice.
          </p>
        </div>
      </section>

      {/* District table */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="District view"
            title="Where demand is coming from — district by district."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {districtInsights.map((row) => (
              <div key={row.district} className="border border-border bg-white p-7 shadow-sm">
                <div className="flex items-center gap-2 text-gold">
                  <MapPin className="h-4 w-4" />
                  <h3 className="font-serif text-xl font-bold text-navy">{row.district}</h3>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Profile
                    </dt>
                    <dd className="mt-0.5 text-navy">{row.profile}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Who is buying
                    </dt>
                    <dd className="mt-0.5 text-navy">{row.demand}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Our read
                    </dt>
                    <dd className="mt-0.5 leading-6 text-muted-foreground">{row.signal}</dd>
                  </div>
                </dl>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-md bg-navy p-7 text-white">
              <BarChart3 className="h-7 w-7 text-gold" />
              <h3 className="mt-4 font-serif text-xl font-bold">Want the numbers behind this?</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Request the full report for detailed comparables, absorption notes and project-level
                projections.
              </p>
              <Link
                to="/contact"
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                Request full report <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demand drivers */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              What is driving the market
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              Four forces behind Abuja's residential demand.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {drivers.map((driver) => (
              <div key={driver.title} className="border border-white/12 bg-white/5 p-7">
                <driver.icon className="h-6 w-6 text-gold" />
                <h3 className="mt-4 font-serif text-lg font-bold">{driver.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{driver.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold text-navy sm:text-4xl">
              Turn the report into a plan.
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Tell an adviser your budget and horizon and we will map it to specific districts,
              projects and ownership routes.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/invest"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              Explore investment routes <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-navy/25 px-7 py-3 text-sm font-bold text-navy"
            >
              <MessageCircle className="h-4 w-4" /> Discuss on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
