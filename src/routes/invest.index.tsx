import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Coins,
  FileCheck2,
  FileText,
  Landmark,
  LineChart,
  Lock,
  Scale,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { Progress } from "@/components/ui/progress";
import { WHATSAPP_URL, properties, FUNDING_STATUS_LABEL } from "@/lib/properties";

export const Route = createFileRoute("/invest/")({
  head: () => ({
    meta: [
      {
        title:
          "Invest with Kay-Steph | Full Purchase, Group Buy & Tokenized Property in Abuja",
      },
      {
        name: "description",
        content:
          "Three structured routes into premium Abuja real estate: buy outright, join a group buy, or hold tokenized ownership from ₦1M. Every shared-ownership deal is protected by a dedicated SPV.",
      },
      {
        property: "og:title",
        content: "Invest with Kay-Steph | Property Investment in Abuja",
      },
      {
        property: "og:description",
        content:
          "Three routes into premium Abuja real estate — Full Purchase, Group Buy or Tokenized Ownership from ₦1M. Protected by dedicated SPVs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvestPage,
});

type ModelCard = {
  icon: typeof Building2;
  title: string;
  tagline: string;
  body?: string;
  beats?: { label: string; text: string }[];
  points: string[];
  minimum: string;
};

const investmentModels: ModelCard[] = [
  {
    icon: Building2,
    title: "Full Purchase",
    tagline: "Own it outright",
    body: "Buy a home, terrace, apartment or plot in your own name (or your company's). You receive the full title, keep all rental income and control resale timing entirely.",
    points: [
      "100% ownership and title",
      "All rental income is yours",
      "Sell or hold on your terms",
    ],
    minimum: "From ₦32.5M (estate plots)",
  },
  {
    icon: Users,
    title: "Group Buy",
    tagline: "Buy together, at scale",
    body: "A coordinated pool of verified buyers targets a specific development or bulk allocation. Everyone sees the same milestones, contribution status and documents — no fragmented chats or spreadsheets.",
    points: [
      "Private or open project pools",
      "Contribution milestones and reminders",
      "Admin approval and audit history",
      "Shared outcomes are held in a dedicated SPV (see below)",
    ],
    minimum: "Set per pool (typically from ₦10M)",
  },
  {
    icon: Coins,
    title: "Tokenized Ownership",
    tagline: "Own a documented fraction, from ₦1M",
    beats: [
      {
        label: "What you own",
        text: "Contribute what you can toward a selected property and receive a proportional ownership interest — ₦14M into a ₦140M asset is 10%, in writing.",
      },
      {
        label: "How it's counted",
        text: "Your fraction is issued as fixed-value units (tokens). Start from one unit, receive income per unit, and list units for resale to other verified investors when you want liquidity.",
      },
      {
        label: "What you get",
        text: "Share of rental income and appreciation, portfolio dashboard, statements and a documented resale route.",
      },
    ],
    points: [
      "Proportional ownership units",
      "Per-unit income distributions",
      "Unit resale to verified investors",
    ],
    minimum:
      "From ₦1M per unit; larger contributions from ₦5M work the same way — just more units",
  },
];

const comparisonRows: { label: string; values: [string, string, string] }[] = [
  {
    label: "You own",
    values: ["The whole asset", "Your allocation/share of a target", "Units of a fraction"],
  },
  { label: "Entry", values: ["₦32.5M+", "~₦10M+", "₦1M per unit"] },
  { label: "Held via", values: ["Direct title", "Direct or SPV", "SPV"] },
  { label: "Income", values: ["All of it", "Per allocation", "Per unit"] },
  {
    label: "Liquidity",
    values: [
      "Sell whenever",
      "Per pool terms",
      "Unit resale to verified investors",
    ],
  },
  {
    label: "Best for",
    values: [
      "Owner-occupiers, HNW buyers",
      "Families, diaspora groups, syndicates",
      "First-time and diversifying investors",
    ],
  },
];

const steps = [
  {
    icon: UserCheck,
    title: "Create your account",
    body: "Register on the investor portal with your name, email and phone number in under two minutes.",
  },
  {
    icon: BadgeCheck,
    title: "Complete verification",
    body: "Submit a government-issued ID and basic KYC details. Our compliance team typically verifies accounts within one business day.",
  },
  {
    icon: Building2,
    title: "Choose a property",
    body: "Review verified opportunities — location, valuation, title documents, projected returns, risk disclosures and funding progress.",
  },
  {
    icon: Wallet,
    title: "Make your contribution",
    body: "State your contribution and transfer to the verified project account. Upload your payment evidence directly in the portal.",
  },
  {
    icon: FileCheck2,
    title: "Approval & documentation",
    body: "Finance confirms your payment and issues your ownership records — SPV interest, units or allocation letter — into your dashboard.",
  },
  {
    icon: LineChart,
    title: "Track, earn and exit",
    body: "Monitor valuations, receive rental distributions, and request withdrawal or resale of your interest through the documented exit process.",
  },
];

const eligibility = [
  "Be 18 years or older (individuals) or a duly registered company",
  "Complete identity verification with a valid government-issued ID",
  "Provide a bank account in your own name for distributions",
  "Meet the minimum contribution for your chosen property and model",
  "Nigerians at home and in the diaspora are welcome — foreign-currency contributors are guided through compliant conversion",
];

const contributionExamples = [
  {
    contribution: "₦5,000,000",
    property: "₦140M apartment",
    ownership: "3.6%",
    rental: "≈ ₦300,000 / yr",
    growth: "≈ ₦500,000 / yr",
  },
  {
    contribution: "₦14,000,000",
    property: "₦140M apartment",
    ownership: "10%",
    rental: "≈ ₦840,000 / yr",
    growth: "≈ ₦1,400,000 / yr",
  },
  {
    contribution: "₦25,000,000",
    property: "₦250M terrace",
    ownership: "10%",
    rental: "≈ ₦1,500,000 / yr",
    growth: "≈ ₦2,500,000 / yr",
  },
  {
    contribution: "₦50,000,000",
    property: "₦500M residence",
    ownership: "10%",
    rental: "≈ ₦3,000,000 / yr",
    growth: "≈ ₦5,000,000 / yr",
  },
];

const risks = [
  {
    title: "Market risk",
    body: "Property values can fall as well as rise. Appreciation figures are projections based on recent district performance, not guarantees.",
  },
  {
    title: "Liquidity risk",
    body: "Real estate is not instantly liquid. Withdrawals and resales follow a documented process and depend on finding a qualified buyer for your interest.",
  },
  {
    title: "Rental risk",
    body: "Rental income depends on occupancy and market rents. Void periods reduce distributions for income-generating properties.",
  },
  {
    title: "Execution risk",
    body: "Developments can face timeline or cost changes. We disclose project status openly and report material changes to all participants.",
  },
];

const legalPoints = [
  {
    icon: Landmark,
    title: "One SPV per property",
    body: "Every co-owned asset sits in its own Special Purpose Vehicle, so your investment is never mixed with other projects or company operations.",
  },
  {
    icon: FileText,
    title: "Documented ownership",
    body: "Your interest is evidenced by SPV records, allocation letters and certificates you can verify independently — all stored in your portal.",
  },
  {
    icon: Scale,
    title: "Verified title",
    body: "Titles are searched and verified before a property is listed. Title information and risk disclosures are shown before you commit.",
  },
  {
    icon: Lock,
    title: "Protected funds flow",
    body: "Contributions go to designated project accounts, payment evidence is reviewed by finance, and approvals are logged with a full audit history.",
  },
];

// Illustrative funding progress used until the live investor portal is wired up.
const FUNDING_PROGRESS: Record<string, number> = {
  "guzape-dream-homes": 15,
  "rubys-apartment-jahi": 62,
  "lillycrest-terrace-lifecamp": 48,
  "lillycrest-residence-karsana": 35,
  "estate-plots-phase-ii": 20,
};

function statusTone(status: string): string {
  if (status === "fully_funded") return "border-emerald-400/40 bg-emerald-500/15 text-emerald-700";
  if (status === "funding_open") return "border-sky-400/40 bg-sky-500/15 text-sky-700";
  if (status === "selling") return "border-amber-400/40 bg-amber-500/15 text-amber-700";
  return "border-slate-400/40 bg-slate-500/15 text-slate-700";
}

function InvestPage() {
  const openProperties = properties.filter((p) => p.fundingStatus !== "fully_funded");

  return (
    <PageShell>
      <PageHero
        eyebrow="Kay-Steph Invest"
        title={
          <>
            Property ownership,
            <span className="block text-gold">made more accessible.</span>
          </>
        }
        description="Five structured routes into premium Abuja real estate — buy outright, join a group purchase, own a documented fraction, invest through a dedicated SPV, or hold tokenized units. Every route is verified, documented and tracked in one investor portal."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Start investing <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#opportunities"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            View open opportunities
          </a>
        </div>
        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
          {[
            { icon: Users, label: "Co-ownership", value: "Multi-investor" },
            { icon: TrendingUp, label: "Returns", value: "Rental + growth" },
            { icon: ShieldCheck, label: "Structure", value: "SPV protected" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-md border border-white/15 bg-white/5 p-4">
              <Icon className="mx-auto mb-2 h-5 w-5 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">{label}</div>
              <div className="text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </PageHero>

      {/* Ways to invest */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Ways to invest"
            title="Choose the route that fits your capital."
            description="Every model gives you verified documentation, portal tracking and direct access to the Kay-Steph team. The difference is how much you contribute and how ownership is structured."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {investmentModels.map((model) => (
              <div key={model.title} className="flex flex-col border border-border bg-white p-7 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <model.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-gold">{model.tagline}</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-navy">{model.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{model.body}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {model.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-navy">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 border-t border-border pt-4 text-sm">
                  <span className="text-muted-foreground">Entry: </span>
                  <span className="font-semibold text-navy">{model.minimum}</span>
                </div>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-md bg-navy p-7 text-white">
              <Banknote className="h-8 w-8 text-gold" />
              <h3 className="mt-5 font-serif text-2xl font-bold">Not sure which fits?</h3>
              <p className="mt-3 text-sm leading-6 text-white/72">
                Tell us your budget and goals and an adviser will recommend the right property and structure — no obligation.
              </p>
              <a
                href="/contact"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                Speak with an adviser <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">How it works</p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">From first click to documented ownership.</h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="border border-white/12 bg-white/5 p-7">
                <div className="flex items-center justify-between">
                  <step.icon className="h-6 w-6 text-gold" />
                  <span className="font-serif text-3xl font-bold text-white/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility + contribution examples */}
      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Eligibility</p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-navy sm:text-4xl">Who can invest?</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Kay-Steph Invest is open to individuals and companies who complete our verification process. To participate you must:
            </p>
            <ul className="mt-6 space-y-4">
              {eligibility.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-navy">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Contribution examples</p>
            <h2 className="mt-3 font-serif text-2xl font-bold text-navy">What your money can do.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Illustrative figures assuming a 6% rental yield and 10% annual appreciation, before fees. Actual terms are stated per property before you commit.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="pb-3 pr-4 font-semibold">You contribute</th>
                    <th className="pb-3 pr-4 font-semibold">Into</th>
                    <th className="pb-3 pr-4 font-semibold">You own</th>
                    <th className="pb-3 pr-4 font-semibold">Rental share</th>
                    <th className="pb-3 font-semibold">Growth share</th>
                  </tr>
                </thead>
                <tbody>
                  {contributionExamples.map((row) => (
                    <tr key={row.contribution + row.property} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-bold text-navy">{row.contribution}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.property}</td>
                      <td className="py-3 pr-4 font-semibold text-gold">{row.ownership}</td>
                      <td className="py-3 pr-4 text-navy">{row.rental}</td>
                      <td className="py-3 text-navy">{row.growth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Projections are illustrations only and do not constitute financial advice or a guarantee of returns.
            </p>
          </div>
        </div>
      </section>

      {/* Returns + risks */}
      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="border border-border bg-white p-8 shadow-sm">
            <TrendingUp className="h-7 w-7 text-gold" />
            <h2 className="mt-5 font-serif text-3xl font-bold text-navy">How you earn</h2>
            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-bold text-navy">Rental income</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Income-generating properties distribute net rent to owners in proportion to their interest, on the schedule stated for each project (typically quarterly).
                </p>
              </div>
              <div>
                <h3 className="font-bold text-navy">Capital appreciation</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Districts like Guzape, Jahi and Karsana have shown strong multi-year growth. Your share's value is updated with each professional revaluation.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-navy">Exit proceeds</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  When a property is sold — or you resell your interest to a verified investor — you receive your proportional share of the proceeds.
                </p>
              </div>
              <div className="rounded-md bg-cream p-4 text-sm text-navy">
                Indicative projected total returns across current projects range from{" "}
                <span className="font-bold">15% to 22% per year</span> (rental yield plus appreciation), stated per property and never guaranteed.
              </div>
            </div>
          </div>

          <div className="border border-border bg-white p-8 shadow-sm">
            <AlertTriangle className="h-7 w-7 text-gold" />
            <h2 className="mt-5 font-serif text-3xl font-bold text-navy">Understand the risks</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We would rather you invest with clear eyes. Every property page includes specific risk disclosures; these apply generally:
            </p>
            <div className="mt-6 space-y-5">
              {risks.map((risk) => (
                <div key={risk.title}>
                  <h3 className="font-bold text-navy">{risk.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{risk.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Legal structure */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Legal structure</p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">Built so your ownership stands on paper.</h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {legalPoints.map((point) => (
              <div key={point.title} className="border border-white/12 bg-white/5 p-7">
                <point.icon className="h-6 w-6 text-gold" />
                <h3 className="mt-5 font-serif text-lg font-bold">{point.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live opportunities */}
      <section id="opportunities" className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Open now"
            title="Current investment opportunities."
            description="Verified projects currently accepting new contributions. Contact the team for the full deal room, disclosures and unit availability."
          />
          {openProperties.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">
              No properties are currently open for new contributions. Leave your details on the{" "}
              <a href="/contact" className="font-semibold text-navy underline hover:text-gold">contact page</a>{" "}
              and we will notify you when the next opportunity opens.
            </p>
          )}
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {openProperties.map((p) => {
              const pct = FUNDING_PROGRESS[p.id] ?? 0;
              const rentalYield = 6;
              const appreciation = Math.max(0, p.expectedReturnPct - rentalYield);
              return (
                <article key={p.id} className="flex flex-col overflow-hidden border border-border bg-white shadow-sm">
                  <div className="aspect-video w-full overflow-hidden bg-navy/10">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col space-y-4 p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-navy">{p.title}</h3>
                        <div className="text-xs text-muted-foreground">{p.location}</div>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusTone(p.fundingStatus)}`}>
                        {FUNDING_STATUS_LABEL[p.fundingStatus]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">From</div>
                        <div className="font-semibold text-navy">{p.price}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Type</div>
                        <div className="font-semibold text-navy">{p.propertyType}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Rental yield</div>
                        <div className="font-semibold text-navy">{rentalYield}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Appreciation</div>
                        <div className="font-semibold text-navy">{appreciation}%</div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Funded</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                    <a
                      href={`/properties/${p.id}`}
                      className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:bg-gold/90"
                    >
                      View this property <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-md bg-navy px-6 py-14 text-center text-white sm:px-10">
            <h2 className="mx-auto max-w-2xl font-serif text-3xl font-bold sm:text-4xl">
              Ready to own your share of Abuja property?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/72">
              Speak with an adviser, complete verification and make your first contribution — all guided end-to-end.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                Start investing <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-8 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
              >
                Ask a question first
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
