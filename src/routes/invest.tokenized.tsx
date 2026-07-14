import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Coins,
  FileText,
  Landmark,
  LayoutDashboard,
  MessageCircle,
  Repeat,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
  // Marketing content must render even when the live listing backend is
  // unavailable, so degrade to an empty listing instead of erroring.
  queryFn: async () => {
    try {
      return await listOpenProperties();
    } catch (error) {
      console.error("[tokenized] could not load open properties:", error);
      return EMPTY_LISTING;
    }
  },
});

export const Route = createFileRoute("/invest/tokenized")({
  head: () => ({
    meta: [
      { title: "Tokenized Ownership | Own Verified Abuja Property from ₦1M — Kay-Steph" },
      {
        name: "description",
        content:
          "Own a documented fraction of verified Abuja property from ₦1M per unit. Fixed-value units, per-unit rental income, SPV protection, portfolio dashboard and a documented resale route.",
      },
      { property: "og:title", content: "Tokenized Ownership from ₦1M — Kay-Steph" },
      {
        property: "og:description",
        content:
          "Fixed-value property units, per-unit income and SPV-protected ownership — starting from ₦1M.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/invest/tokenized" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(propsQuery),
  errorComponent: () => <div className="p-8 text-center">Could not load properties.</div>,
  component: TokenizedPage,
});

const features = [
  {
    icon: Coins,
    title: "Fixed-value units",
    body: "Each active property is divided into equal, fixed-value units (typically ₦1M). One unit is one verifiable slice of the property — no odd fractions, no ambiguity.",
  },
  {
    icon: Wallet,
    title: "Per-unit income",
    body: "When the property earns rent, net income is distributed per unit on the schedule stated for the project. Five units earn exactly five times what one unit earns.",
  },
  {
    icon: Repeat,
    title: "Resale for liquidity",
    body: "Want out before the property sells? List your units for resale to other verified investors through the documented exit process — no informal side deals.",
  },
  {
    icon: Landmark,
    title: "SPV-protected",
    body: "The property is held by a dedicated Special Purpose Vehicle whose only asset is that property. Your units are recorded against it, ring-fenced from every other business.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard & statements",
    body: "Your units, current value, income received and documents live in the client portal — with downloadable statements whenever you or your advisers need them.",
  },
  {
    icon: FileText,
    title: "Certificates you can verify",
    body: "Approved investments receive ownership certificates with public verification tokens — a bank, lawyer or buyer can confirm authenticity independently.",
  },
];

/** Worked examples at ₦1M per unit on a ₦140M property (6% yield, 10% appreciation, before fees). */
const unitExamples = [
  {
    units: "1 unit",
    outlay: "₦1,000,000",
    ownership: "0.71%",
    rental: "≈ ₦60,000 / yr",
    growth: "≈ ₦100,000 / yr",
  },
  {
    units: "5 units",
    outlay: "₦5,000,000",
    ownership: "3.6%",
    rental: "≈ ₦300,000 / yr",
    growth: "≈ ₦500,000 / yr",
  },
  {
    units: "14 units",
    outlay: "₦14,000,000",
    ownership: "10%",
    rental: "≈ ₦840,000 / yr",
    growth: "≈ ₦1,400,000 / yr",
  },
  {
    units: "35 units",
    outlay: "₦35,000,000",
    ownership: "25%",
    rental: "≈ ₦2,100,000 / yr",
    growth: "≈ ₦3,500,000 / yr",
  },
];

const steps = [
  {
    title: "Register & verify",
    body: "Create your client account and complete KYC — typically verified within one business day.",
  },
  {
    title: "Choose an active property",
    body: "Review the tokenized properties currently open below: valuation, title status, projected returns, risks and funding progress.",
  },
  {
    title: "Buy your units",
    body: "Decide how many units you want, transfer to the verified project account and upload your payment evidence in the portal.",
  },
  {
    title: "Get documented",
    body: "Finance confirms payment; your units and ownership certificate are issued into your dashboard.",
  },
  {
    title: "Earn, track and exit",
    body: "Receive per-unit distributions, watch revaluations, and resell units to verified investors whenever you want liquidity.",
  },
];

const tokenFaqs = [
  {
    question: "Is this cryptocurrency?",
    answer:
      "No. Units are records of beneficial interest in a real, verified property held through a legal SPV structure — not a tradeable coin. Unit value follows the professionally assessed value of the underlying property, nothing else.",
  },
  {
    question: "What exactly do I own?",
    answer:
      "A recorded interest in the SPV that holds the property, proportional to your units. It is evidenced by formal records and a certificate you can verify independently — not a promise in a chat thread.",
  },
  {
    question: "How do I get my money out?",
    answer:
      "Two routes: list your units for resale to verified investors through the documented exit process, or receive your proportional share of proceeds when the property is sold. Real estate is not instantly liquid — timing depends on finding a buyer.",
  },
  {
    question: "Can I buy more units later?",
    answer:
      "Yes. While a property remains open you can add units at any time, and your dashboard aggregates everything into one position per property.",
  },
];

function TokenizedPage() {
  const { data } = useSuspenseQuery(propsQuery);

  return (
    <PageShell>
      <PageHero
        eyebrow="Kay-Steph Invest · Tokenized Ownership"
        title={
          <>
            Own a documented fraction,
            <span className="block text-gold">from ₦1M per unit.</span>
          </>
        }
        description="Selected verified properties are divided into fixed-value units. Buy the number you can afford, earn income per unit, watch your value grow with the property — and resell to verified investors when you want liquidity. Every unit is SPV-protected and evidenced in writing."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Start with ₦1M <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#active-properties"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            See active properties
          </a>
        </div>
        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
          {[
            { icon: Banknote, label: "Entry", value: "₦1M / unit" },
            { icon: TrendingUp, label: "You earn", value: "Rent + growth" },
            { icon: ShieldCheck, label: "Held via", value: "Dedicated SPV" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-md border border-white/15 bg-white/5 p-4">
              <Icon className="mx-auto mb-2 h-5 w-5 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">{label}</div>
              <div className="text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </PageHero>

      {/* How units work — the three beats */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="One property. Equal units. Your share, in writing."
            description="Tokenized ownership is fractional ownership counted in fixed-value units — the same verified assets, the same documentation, at a ticket size that fits."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                step: "What you own",
                body: "A proportional interest in a verified property, held through a dedicated SPV. ₦14M into a ₦140M asset is 10% — recorded formally, never informally.",
              },
              {
                step: "How it's counted",
                body: "The property is divided into equal, fixed-value units (typically ₦1M). Your fraction is simply the number of units you hold — easy to buy, easy to add to, easy to resell.",
              },
              {
                step: "What you get",
                body: "Per-unit rental distributions, your share of appreciation at each revaluation, a portfolio dashboard with statements, an ownership certificate and a documented resale route.",
              },
            ].map((item, index) => (
              <div key={item.step} className="border border-border bg-white p-7 shadow-sm">
                <span className="font-serif text-4xl font-bold text-gold/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-xl font-bold text-navy">{item.step}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Not crypto */}
          <div className="mt-8 flex flex-col gap-4 rounded-md border border-gold/40 bg-cream p-6 sm:flex-row sm:items-start sm:p-8">
            <Sparkles className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <h3 className="font-serif text-lg font-bold text-navy">
                To be clear: this is not cryptocurrency.
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                There is no coin and no speculation. A unit is a formal record of beneficial
                interest in a real Abuja property held through a legal SPV. Its value follows the
                professionally assessed value of the building and land — nothing else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Worked examples */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Worked examples"
            title="What your units can do."
            description="Illustrative figures for a ₦140M income-generating property at ₦1M per unit, assuming a 6% rental yield and 10% annual appreciation, before fees. Actual terms are stated per property before you commit."
          />
          <div className="mx-auto mt-12 max-w-4xl overflow-x-auto rounded-md border border-border bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-5 py-4 font-semibold">You buy</th>
                  <th className="px-5 py-4 font-semibold">Outlay</th>
                  <th className="px-5 py-4 font-semibold">You own</th>
                  <th className="px-5 py-4 font-semibold">Rental share</th>
                  <th className="px-5 py-4 font-semibold">Growth share</th>
                </tr>
              </thead>
              <tbody>
                {unitExamples.map((row) => (
                  <tr key={row.units} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-bold text-navy">{row.units}</td>
                    <td className="px-5 py-3.5 text-navy">{row.outlay}</td>
                    <td className="px-5 py-3.5 font-semibold text-gold">{row.ownership}</td>
                    <td className="px-5 py-3.5 text-navy">{row.rental}</td>
                    <td className="px-5 py-3.5 text-navy">{row.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-4xl text-xs leading-5 text-muted-foreground">
            Projections are illustrations only and do not constitute financial advice or a guarantee
            of returns. Unit value, minimums and schedules are stated per property.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="What's built in"
            title="Small ticket. Full machinery."
            description="A ₦1M unit gets the same verification, protection and reporting as a ₦500M purchase."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="border border-border bg-white p-7 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-navy">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Want the full legal picture?{" "}
            <Link
              to="/invest"
              hash="spv-protection"
              className="font-bold text-navy underline hover:text-gold"
            >
              See how the SPV protects shared ownership
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              From ₦1M to documented owner
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              Five steps. One business day to verify.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step.title} className="border border-white/12 bg-white/5 p-6">
                <span className="font-serif text-3xl font-bold text-white/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active tokenized properties */}
      <section id="active-properties" className="scroll-mt-24 bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Active now"
            title="Properties currently open for tokenized investment."
            description="Live funding status from the investor portal. Sign in to see full documents, disclosures, unit values and contribution terms."
          />
          {data.properties.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">
              No properties are currently open for new units. Leave your details on the{" "}
              <Link to="/contact" className="font-semibold text-navy underline hover:text-gold">
                contact page
              </Link>{" "}
              and we will notify you the moment the next tokenized opportunity opens.
            </p>
          )}
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.properties.map((p) => {
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
                      View units & invest <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading eyebrow="Quick answers" title="Asked before every first unit." />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {tokenFaqs.map((faq) => (
              <div key={faq.question} className="border border-border bg-white p-7 shadow-sm">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-navy">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            More questions answered in the{" "}
            <Link to="/faq" className="font-bold text-navy underline hover:text-gold">
              full FAQ
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-md bg-navy px-6 py-14 text-center text-white sm:px-10">
            <h2 className="mx-auto max-w-2xl font-serif text-3xl font-bold sm:text-4xl">
              Your first unit is one verification away.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/72">
              Register, complete KYC and buy your first units — documented, SPV-protected and
              visible in your dashboard from day one.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
              >
                Start with ₦1M <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-8 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
              >
                <MessageCircle className="h-4 w-4" /> Ask a question first
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
