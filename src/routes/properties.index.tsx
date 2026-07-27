import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  FilterX,
  MapPin,
  MessageCircle,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  FUNDING_STATUS_LABEL,
  INVESTMENT_MODEL_LABEL,
  WHATSAPP_URL,
  mergeCatalogueProperties,
  type FundingStatus,
  type InvestmentModel,
  type Property,
  type PropertyType,
} from "@/lib/properties";
import { listPublicPropertyCatalogue } from "@/lib/invest.functions";

export const Route = createFileRoute("/properties/")({
  loader: async () => {
    try {
      return await listPublicPropertyCatalogue();
    } catch {
      return { properties: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "Properties | Homes, Terraces, Apartments & Land in Abuja — Kay-Steph" },
      {
        name: "description",
        content:
          "Browse verified Kay-Steph properties across Guzape, Jahi, Life Camp, Karsana and the Abacha Barracks corridor. Filter by location, type, price, investment model, funding status and expected return.",
      },
      { property: "og:title", content: "Kay-Steph Properties | Premium Real Estate in Abuja" },
      {
        property: "og:description",
        content: "Verified homes, terraces, apartments and estate land across Abuja.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/properties" }],
  }),
  component: PropertiesPage,
});

const ALL = "all";

const PRICE_BANDS = [
  { value: "under-100", label: "Below ₦100M", min: 0, max: 100_000_000 },
  { value: "100-250", label: "₦100M – ₦250M", min: 100_000_000, max: 250_000_000 },
  { value: "250-500", label: "₦250M – ₦500M", min: 250_000_000, max: 500_000_000 },
  { value: "over-500", label: "₦500M and above", min: 500_000_000, max: Infinity },
] as const;

const RETURN_BANDS = [
  { value: "15", label: "15%+ projected", min: 15 },
  { value: "18", label: "18%+ projected", min: 18 },
  { value: "20", label: "20%+ projected", min: 20 },
] as const;

type Filters = {
  location: string;
  type: string;
  price: string;
  model: string;
  funding: string;
  returns: string;
};

const EMPTY_FILTERS: Filters = {
  location: ALL,
  type: ALL,
  price: ALL,
  model: ALL,
  funding: ALL,
  returns: ALL,
};

function applyFilters(list: Property[], filters: Filters): Property[] {
  return list.filter((property) => {
    if (filters.location !== ALL && property.location !== filters.location) return false;
    if (filters.type !== ALL && !property.propertyTypes.includes(filters.type as PropertyType))
      return false;
    if (filters.price !== ALL) {
      // A coming-soon project has no price yet, so it can't honestly match any band.
      if (property.fundingStatus === "coming_soon") return false;
      const band = PRICE_BANDS.find((b) => b.value === filters.price);
      if (band && (property.priceValue < band.min || property.priceValue >= band.max)) return false;
    }
    if (
      filters.model !== ALL &&
      !property.investmentModels.includes(filters.model as InvestmentModel)
    )
      return false;
    if (filters.funding !== ALL && property.fundingStatus !== filters.funding) return false;
    if (filters.returns !== ALL) {
      const band = RETURN_BANDS.find((b) => b.value === filters.returns);
      if (band && property.expectedReturnPct < band.min) return false;
    }
    return true;
  });
}

function PropertiesPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const loaderData = Route.useLoaderData();
  const catalogue = useMemo(
    () => mergeCatalogueProperties(loaderData.properties),
    [loaderData.properties],
  );

  const locations = useMemo(
    () => Array.from(new Set(catalogue.map((p) => p.location))),
    [catalogue],
  );
  const types = useMemo(
    () => Array.from(new Set(catalogue.flatMap((p) => p.propertyTypes))),
    [catalogue],
  );

  const filtered = useMemo(() => applyFilters(catalogue, filters), [catalogue, filters]);
  // Coming-soon projects get their own section: mixing unpriced teasers into
  // the buyable grid would make the listings look less concrete than they are.
  const live = useMemo(() => filtered.filter((p) => p.fundingStatus !== "coming_soon"), [filtered]);
  const comingSoon = useMemo(
    () => filtered.filter((p) => p.fundingStatus === "coming_soon"),
    [filtered],
  );
  const activeCount = Object.values(filters).filter((value) => value !== ALL).length;

  const set = (field: keyof Filters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  return (
    <PageShell>
      <PageHero
        eyebrow="Our properties"
        title={
          <>
            Find the right place to
            <span className="block text-gold">live, build or invest.</span>
          </>
        }
        description="Every listing below has passed our four-stage verification: title search, physical inspection, independent valuation and written disclosure. Filter by what matters to you."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#listings"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Browse listings <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            <MessageCircle className="h-4 w-4" /> Ask about availability
          </a>
        </div>
      </PageHero>

      <section id="listings" className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Filter bar */}
          <div className="rounded-md border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-navy">
                <SlidersHorizontal className="h-4 w-4 text-gold" /> Filter properties
              </div>
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="text-sm text-muted-foreground hover:text-navy"
                >
                  <FilterX className="mr-1 h-4 w-4" /> Clear all ({activeCount})
                </Button>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <FilterField label="Location">
                <Select value={filters.location} onValueChange={set("location")}>
                  <SelectTrigger aria-label="Filter by location">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Property type">
                <Select value={filters.type} onValueChange={set("type")}>
                  <SelectTrigger aria-label="Filter by property type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All types</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Price range">
                <Select value={filters.price} onValueChange={set("price")}>
                  <SelectTrigger aria-label="Filter by price range">
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any price</SelectItem>
                    {PRICE_BANDS.map((band) => (
                      <SelectItem key={band.value} value={band.value}>
                        {band.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Investment model">
                <Select value={filters.model} onValueChange={set("model")}>
                  <SelectTrigger aria-label="Filter by investment model">
                    <SelectValue placeholder="Any model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any model</SelectItem>
                    {(Object.keys(INVESTMENT_MODEL_LABEL) as InvestmentModel[]).map((model) => (
                      <SelectItem key={model} value={model}>
                        {INVESTMENT_MODEL_LABEL[model]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Funding status">
                <Select value={filters.funding} onValueChange={set("funding")}>
                  <SelectTrigger aria-label="Filter by funding status">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any status</SelectItem>
                    {(Object.keys(FUNDING_STATUS_LABEL) as FundingStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {FUNDING_STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Expected return">
                <Select value={filters.returns} onValueChange={set("returns")}>
                  <SelectTrigger aria-label="Filter by expected return">
                    <SelectValue placeholder="Any return" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any return</SelectItem>
                    {RETURN_BANDS.map((band) => (
                      <SelectItem key={band.value} value={band.value}>
                        {band.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            </div>
          </div>

          {/* Results */}
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-bold text-navy">{live.length}</span> of{" "}
              {catalogue.length} properties
            </p>
          </div>

          {live.length === 0 ? (
            <div className="mt-8 rounded-md border border-border bg-white p-12 text-center shadow-sm">
              <Building2 className="mx-auto h-10 w-10 text-gold" />
              <h3 className="mt-4 font-serif text-2xl font-bold text-navy">
                No properties match those filters.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Try widening your criteria — or tell us exactly what you need and we will source it
                or notify you when it becomes available.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="rounded-full bg-gold font-bold text-gold-foreground hover:bg-gold/90"
                >
                  Clear filters
                </Button>
                <Link
                  to="/contact"
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-navy/25 px-6 text-sm font-bold text-navy"
                >
                  Request a property
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {live.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {comingSoon.length > 0 && (
            <div className="mt-16">
              <SectionHeading
                eyebrow="On the horizon"
                title="Coming Soon Projects"
                description="New Kay-Steph developments in final planning. Register your interest and an adviser will contact you with launch details before public release."
              />
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {comingSoon.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Investment cross-sell */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Can't buy outright?"
            title="Own a share instead."
            description="Most listed properties are also open to group purchase, fractional ownership or tokenized units — starting from ₦1M. Same verified assets, smaller ticket."
          />
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/invest"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              <TrendingUp className="h-4 w-4" /> Explore investment routes
            </Link>
            <Link
              to="/faq"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-navy/25 bg-white px-8 py-3 text-sm font-bold text-navy"
            >
              Read the FAQ first
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">Seen something you like?</h2>
            <p className="mt-3 max-w-xl text-white/72">
              Book a private inspection and walk the property with the team responsible for it — no
              obligation, no pressure.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              Book an inspection <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp the team
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-border bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-navy">
        <img
          src={property.image}
          alt={property.title}
          loading="lazy"
          width={1200}
          height={800}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-navy/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold backdrop-blur">
            {property.tag}
          </span>
          <span className="rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-foreground">
            {FUNDING_STATUS_LABEL[property.fundingStatus]}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-gold" /> {property.location}
        </div>
        <h3 className="mt-2 font-serif text-2xl font-bold text-navy">{property.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{property.tagline}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {property.investmentModels.map((model) => (
            <span
              key={model}
              className="rounded-full border border-border bg-cream px-2.5 py-1 text-[11px] font-semibold text-navy"
            >
              {INVESTMENT_MODEL_LABEL[model]}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
          {property.specs.map((spec) => (
            <div
              key={spec.label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <spec.icon className="h-3.5 w-3.5 shrink-0 text-gold" /> {spec.label}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-4">
          <div>
            <div className="font-serif text-xl font-bold text-navy">{property.price}</div>
            <div className="text-xs text-muted-foreground">{property.priceNote}</div>
          </div>
          {property.expectedReturnPct > 0 && (
            <div className="text-right">
              <div className="font-serif text-xl font-bold text-gold">
                {property.expectedReturnPct}%
              </div>
              <div className="text-xs text-muted-foreground">proj. return / yr</div>
            </div>
          )}
        </div>

        <Link
          to="/properties/$id"
          params={{ id: property.id }}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gold hover:text-gold-foreground"
        >
          View full details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
