import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
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
import { listOpenProperties } from "@/lib/invest.functions";
import { fmtNGN, PROPERTY_STATUS_LABEL, statusTone } from "@/lib/invest";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { Progress } from "@/components/ui/progress";
import { WHATSAPP_URL } from "@/lib/properties";

const EMPTY_LISTING = { properties: [], funding: {} } as Awaited<
  ReturnType<typeof listOpenProperties>
>;

const propsQuery = queryOptions({
  queryKey: ["invest", "list"],
  // The education content on this page must render even when the live listing
  // backend is unavailable, so degrade to an empty listing instead of erroring.
  queryFn: async () => {
    try {
      return await listOpenProperties();
    } catch (error) {
      console.error("[invest] could not load open properties:", error);
      return EMPTY_LISTING;
    }
  },
});

export const Route = createFileRoute("/invest/")({
  head: () => ({
    meta: [
      { title: "Invest with Kay-Steph | Full Purchase, Group Buy & Tokenized Ownership in Abuja" },
      {
        name: "description",
        content:
          "Three clear routes into verified Abuja property — full purchase, group buy, or tokenized ownership from ₦1M — every shared route protected by a dedicated SPV. Clear steps, documented returns, transparent risks.",
      },
      { property: "og:title", content: "Invest with Kay-Steph | Property Investment in Abuja" },
      {
        property: "og:description",
        content:
          "Three routes into premium Abuja real estate — from ₦1M tokenized units to full purchase, with SPV-protected shared ownership.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/invest" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(propsQuery),
  errorComponent: () => <div className="p-8 text-center">Could not load properties.</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: InvestPage,
});

/**
 * Three product doors. The SPV is deliberately NOT one of them — it is the
 * legal wrapper behind all shared ownership, presented in the trust strip
 * below the cards rather than as a product a customer can choose.
 */
const investmentDoors = [
  {
    icon: Building2,
    title: "Full Purchase",
    tagline: "Own it outright",
    body: "Buy a home, terrace, apartment or plot in your own name (or your company's). You receive the full title, keep all rental income and control resale timing entirely.",
    beats: null as null | { label: string; text: string }[],
    points: [
      "100% ownership and title",
      "All rental income is yours",
      "Sell or hold on your terms",
    ],
    footnote: null as string | null,
    minimum: "From ₦32.5M (estate plots)",
  },
  {
    icon: Users,
    title: "Group Buy",
    tagline: "Buy together, at scale",
    body: "A coordinated pool of verified buyers targets a specific development or bulk allocation. Everyone sees the same milestones, contribution status and documents — no fragmented chats or spreadsheets.",
    beats: null,
    points: [
      "Private or open project pools",
      "Contribution milestones and reminders",
      "Admin approval and audit history",
    ],
    footnote: "Where a pool ends in shared ownership, the asset is held in a dedicated SPV — ",
    minimum: "Set per pool (typically from ₦10M)",
  },
  {
    icon: Coins,
    title: "Tokenized Ownership",
    tagline: "Own a documented fraction, from ₦1M",
    body: null as string | null,
    beats: [
      {
        label: "What you own",
        text: "A proportional interest in a verified property — ₦14M into a ₦140M asset is 10%, in writing.",
      },
      {
        label: "How it's counted",
        text: "Your fraction is issued as fixed-value units, so you can start from one unit (~₦1M), receive income per unit, and list units for resale to verified investors when you want liquidity.",
      },
      {
        label: "What you get",
        text: "Proportional rental income and appreciation, portfolio dashboard, statements and a documented resale route.",
      },
    ],
    points: [
      "Proportional ownership units",
      "Per-unit income distributions",
      "Unit resale to verified investors",
    ],
    footnote: null,
    minimum: "From ₦1M per unit; contributions from ₦5M work the same way — just more units",
  },
];

/** Capital-ladder comparison: one column per door. */
const comparisonRows = [
  {
    label: "You own",
    values: ["The whole asset", "Your allocation / share of a target", "Units of a fraction"],
  },
  { label: "Entry", values: ["₦32.5M+", "~₦10M+", "₦1M / unit"] },
  { label: "Held via", values: ["Direct title", "Direct or SPV", "SPV"] },
  { label: "Income", values: ["All of it", "Per allocation", "Per unit"] },
  {
    label: "Liquidity",
    values: ["Sell whenever", "Per pool terms", "Unit resale to verified investors"],
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
  "Meet the minimum contribution for your chosen property and route",
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

function InvestPage() {
  const { data } = useSuspenseQuery(propsQuery);

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
        description="Three clear routes into premium Abuja real estate — buy outright, buy together through a group pool, or own a documented fraction in tokenized units from ₦1M. Every shared route is protected by a dedicated SPV, and everything is verified, documented and tracked in one investor portal."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Start investing <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#opportunities"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            View open opportunities
          </a>
        </div>
        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
          {[
            { icon: Coins, label: "Start from", value: "₦1M / unit" },
            { icon: TrendingUp, label: "Returns", value: "Rental + growth" },
            { icon: ShieldCheck, label: "Shared ownership", value: "SPV protected" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-md border border-white/15 bg-white/5 p-4">
              <Icon className="mx-auto mb-2 h-5 w-5 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">{label}</div>
              <div className="text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </PageHero>

      {/* Ways to invest: three doors */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Ways to invest"
            title="Three routes. Choose the one that fits your capital."
            description="Every route gives you verified documentation, portal tracking and direct access to the Kay-Steph team. The difference is how much you contribute and how ownership is structured — from ₦1M tokenized units to full purchase."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {investmentDoors.map((door, index) => (
              <div
                key={door.title}
                className="relative flex flex-col border border-border bg-white p-7 shadow-sm"
              >
                <span className="absolute right-5 top-5 font-serif text-3xl font-bold text-gold/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <door.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  {door.tagline}
                </p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-navy">{door.title}</h3>

                {door.body && (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{door.body}</p>
                )}
                {door.beats && (
                  <div className="mt-3 space-y-3">
                    {door.beats.map((beat) => (
                      <p key={beat.label} className="text-sm leading-6 text-muted-foreground">
                        <span className="font-bold text-navy">{beat.label}: </span>
                        {beat.text}
                      </p>
                    ))}
                  </div>
                )}

                <ul className="mt-4 flex-1 space-y-2">
                  {door.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-navy">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {point}
                    </li>
                  ))}
                </ul>

                {door.footnote && (
                  <p className="mt-4 text-xs italic leading-5 text-muted-foreground">
                    {door.footnote}
                    <a
                      href="#spv-protection"
                      className="font-semibold text-navy underline hover:text-gold"
                    >
                      see how your ownership is protected below
                    </a>
                    .
                  </p>
                )}

                <div className="mt-5 border-t border-border pt-4 text-sm">
                  <span className="text-muted-foreground">Entry: </span>
                  <span className="font-semibold text-navy">{door.minimum}</span>
                </div>

                {door.title === "Full Purchase" && (
                  <Link
                    to="/properties"
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/25 px-6 py-2.5 text-sm font-bold text-navy transition-colors hover:border-gold hover:text-gold"
                  >
                    Browse available properties <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {door.title === "Group Buy" && (
                  <Link
                    to="/invest/group-buy"
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-navy/25 px-6 py-2.5 text-sm font-bold text-navy transition-colors hover:border-gold hover:text-gold"
                  >
                    Explore group buying <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {door.title === "Tokenized Ownership" && (
                  <Link
                    to="/invest/tokenized"
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:bg-gold/90"
                  >
                    Explore tokenized ownership <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* SPV trust strip — infrastructure, not a product */}
          <div
            id="spv-protection"
            className="mt-8 scroll-mt-28 rounded-md bg-navy px-6 py-10 text-white sm:px-10"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                <Landmark className="h-7 w-7 text-gold" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
                  How shared ownership is protected
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
                  The SPV: one dedicated legal entity per property.
                </h3>
                <p className="mt-4 max-w-3xl leading-7 text-white/75">
                  Every co-owned property — whether you joined through a group buy or bought
                  tokenized units — is held by a dedicated Special Purpose Vehicle: a separate legal
                  entity whose only asset is that property. Your interest is recorded against the
                  SPV, ring-fenced from every other project and from Kay-Steph's own liabilities,
                  with formal shareholder and trust records you can verify independently.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
                  {[
                    "Dedicated legal entity per property",
                    "Ring-fenced from company liabilities",
                    "Formal shareholder / trust records",
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 text-sm text-white/85"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-gold" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Capital-ladder comparison */}
          <div className="mt-14">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="font-serif text-2xl font-bold text-navy sm:text-3xl">
                Side by side: the capital ladder.
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                From ₦1M to ₦32.5M and beyond — each route answers a different investor's first
                question.
              </p>
            </div>
            <div className="mt-8 overflow-x-auto rounded-md border border-border bg-white shadow-sm">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-cream">
                    <th className="px-5 py-4" />
                    {investmentDoors.map((door) => (
                      <th key={door.title} className="px-5 py-4">
                        <span className="flex items-center gap-2 font-serif text-base font-bold text-navy">
                          <door.icon className="h-4 w-4 text-gold" /> {door.title}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <th
                        scope="row"
                        className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, i) => (
                        <td key={i} className="px-5 py-3.5 leading-6 text-navy">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Not sure which route fits?{" "}
              <Link to="/contact" className="font-bold text-navy underline hover:text-gold">
                Speak with an adviser
              </Link>{" "}
              — tell us your budget and goals and we will recommend the right property and
              structure, no obligation.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">How it works</p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              From first click to documented ownership.
            </h2>
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
            <h2 className="mt-4 font-serif text-3xl font-bold text-navy sm:text-4xl">
              Who can invest?
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Kay-Steph Invest is open to individuals and companies who complete our verification
              process. To participate you must:
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
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Contribution examples
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold text-navy">
              What your money can do.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Illustrative figures assuming a 6% rental yield and 10% annual appreciation, before
              fees. Actual terms are stated per property before you commit.
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
                    <tr
                      key={row.contribution + row.property}
                      className="border-b border-border last:border-0"
                    >
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
              Projections are illustrations only and do not constitute financial advice or a
              guarantee of returns.
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
                  Income-generating properties distribute net rent to owners in proportion to their
                  interest, on the schedule stated for each project (typically quarterly).
                </p>
              </div>
              <div>
                <h3 className="font-bold text-navy">Capital appreciation</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Districts like Guzape, Jahi and Karsana have shown strong multi-year growth. Your
                  share's value is updated with each professional revaluation.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-navy">Exit proceeds</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  When a property is sold — or you resell your interest to a verified investor — you
                  receive your proportional share of the proceeds.
                </p>
              </div>
              <div className="rounded-md bg-cream p-4 text-sm text-navy">
                Indicative projected total returns across current projects range from{" "}
                <span className="font-bold">15% to 22% per year</span> (rental yield plus
                appreciation), stated per property and never guaranteed.
              </div>
            </div>
          </div>

          <div className="border border-border bg-white p-8 shadow-sm">
            <AlertTriangle className="h-7 w-7 text-gold" />
            <h2 className="mt-5 font-serif text-3xl font-bold text-navy">Understand the risks</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We would rather you invest with clear eyes. Every property page includes specific risk
              disclosures; these apply generally:
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
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Legal structure
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              Built so your ownership stands on paper.
            </h2>
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
            description="Live funding status from the investor portal. Sign in to see full documents, disclosures and contribution terms."
          />
          {data.properties.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">
              No properties are currently open for new contributions. Leave your details on the{" "}
              <Link to="/contact" className="font-semibold text-navy underline hover:text-gold">
                contact page
              </Link>{" "}
              and we will notify you when the next opportunity opens.
            </p>
          )}
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.properties.map((p: any) => {
              const f = data.funding[p.id] ?? { approved: 0, pending: 0, investors: 0 };
              const pct = Math.min(100, Math.round((f.approved / Number(p.initial_value)) * 100));
              return (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden border border-border bg-white shadow-sm"
                >
                  <div className="aspect-video w-full overflow-hidden bg-navy/10">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col space-y-4 p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-navy">{p.name}</h3>
                        <div className="text-xs text-muted-foreground">{p.location}</div>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusTone(p.status)}`}
                      >
                        {PROPERTY_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Property value</div>
                        <div className="font-semibold text-navy">{fmtNGN(p.initial_value)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Min investment</div>
                        <div className="font-semibold text-navy">{fmtNGN(p.min_investment)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Rental yield</div>
                        <div className="font-semibold text-navy">
                          {p.expected_rental_yield ?? 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Appreciation</div>
                        <div className="font-semibold text-navy">
                          {p.expected_appreciation ?? 0}%
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Funded</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>{fmtNGN(f.approved)} raised</span>
                        <span>{f.investors} investors</span>
                      </div>
                    </div>
                    <Link
                      to="/invest/$id"
                      params={{ id: p.id }}
                      className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground hover:bg-gold/90"
                    >
                      Invest in this property <ArrowRight className="h-4 w-4" />
                    </Link>
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
              Create your account, complete verification and make your first contribution — all in
              one secure portal.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                Start investing <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
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
