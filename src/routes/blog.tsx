import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock3, MessageCircle, Tag } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Insights | Abuja Property Guides — Kay-Steph" },
      {
        name: "description",
        content:
          "Practical guides from the Kay-Steph team: Abuja district insights, tokenized ownership explained, title verification, and buying from the diaspora.",
      },
      { property: "og:title", content: "Kay-Steph Blog & Insights" },
      {
        property: "og:description",
        content: "Practical Abuja property guides written by the team that does the transactions.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/blog" }],
  }),
  component: BlogPage,
});

type Post = {
  id: string;
  category: string;
  readTime: string;
  title: string;
  excerpt: string;
  sections: { heading: string; body: string }[];
};

const posts: Post[] = [
  {
    id: "abuja-districts-guide",
    category: "Market insight",
    readTime: "6 min read",
    title: "Where Abuja is growing: a plain-language guide to five districts",
    excerpt:
      "Guzape, Jahi, Life Camp, Karsana and the Abacha Barracks corridor — why we build where we build, and what each district offers a buyer or investor.",
    sections: [
      {
        heading: "Guzape — the prestige address with room left to grow",
        body: "Minutes from Asokoro, Maitama and the diplomatic zone, Guzape has become the natural next address for principal families. Supply of genuinely premium, title-clean homes remains thin, which supports both price resilience and rental demand at the top end.",
      },
      {
        heading: "Jahi — the connected professional's district",
        body: "Sitting between Jabi Lake and the airport road, Jahi attracts professionals and expatriates who want serviced living close to everything. Serviced apartments here let out quickly and suit yield-focused investors.",
      },
      {
        heading: "Life Camp — established, liveable, lock-and-leave",
        body: "A mature professional neighbourhood where terraces and compact detached homes trade steadily. Life Camp suits owner-occupiers who value convenience and buyers who want dependable, unspectacular growth.",
      },
      {
        heading: "Karsana — the value corridor",
        body: "Karsana is where families get detached living at accessible entry points. Infrastructure is filling in fast, and tiered developments let buyers enter from ₦90M with room to upgrade in-district.",
      },
      {
        heading: "Abacha Barracks corridor — land banking territory",
        body: "Surveyed estate parcels behind Abacha Barracks offer one of the FCT's clearer land-banking cases: security, verified titles and a corridor that appreciates as the city pushes outward.",
      },
    ],
  },
  {
    id: "tokenized-ownership-explained",
    category: "Investing",
    readTime: "5 min read",
    title: "Tokenized property ownership, explained without the jargon",
    excerpt:
      "What a fraction actually is, how SPVs protect you, what returns look like, and the honest limits of liquidity — everything a first-time co-investor should know.",
    sections: [
      {
        heading: "What you actually own",
        body: "When you buy tokenized units, a dedicated legal entity (an SPV) holds the property and your units record a proportional interest in that entity. ₦14M into a ₦140M property is a 10% interest — in writing, verifiable, and visible in your dashboard.",
      },
      {
        heading: "How you earn",
        body: "Two ways: your per-unit share of net rental income, distributed on the schedule stated per project, and your share of the property's appreciation, realised when the asset or your units are sold. Projections are stated per property and are never guarantees.",
      },
      {
        heading: "The honest part: liquidity",
        body: "Real estate is not a savings account. Unit resale follows a documented process and depends on matching your units with a verified buyer. If you may need the money at short notice, tokenized property is the wrong pocket for it.",
      },
      {
        heading: "Why the SPV matters",
        body: "The SPV ring-fences the property: liabilities from other projects or company operations cannot touch it. It is the same structure institutional investors insist on — scaled down to ₦1M unit tickets.",
      },
    ],
  },
  {
    id: "title-verification-checklist",
    category: "Buyer education",
    readTime: "4 min read",
    title: "How to verify a property title in Abuja — the checklist we use",
    excerpt:
      "The exact checks our legal desk runs before any property is listed: registry search, encumbrance review, survey confirmation and consent status.",
    sections: [
      {
        heading: "Start at the registry",
        body: "Every verification starts with a search at the relevant land registry (AGIS for the FCT). You are confirming the seller's name matches the title, the plot's file is intact, and the record is free of adverse notations.",
      },
      {
        heading: "Check for encumbrances",
        body: "Mortgages, court orders, government acquisition notices and pending consent applications all live in the file. Any of them can freeze your purchase — better to find them before money moves.",
      },
      {
        heading: "Walk the land against the survey",
        body: "A title can be clean while the beacons tell a different story. We physically confirm boundaries against the survey plan and check for competing occupation before recommending any parcel.",
      },
      {
        heading: "Get it in writing — from everyone",
        body: "Verification is only as good as its paper trail. Insist on written search reports, signed disclosures and receipts at every step. A serious seller will never resist this; treat resistance itself as a finding.",
      },
    ],
  },
  {
    id: "diaspora-buying-guide",
    category: "Diaspora",
    readTime: "5 min read",
    title: "Buying Abuja property from abroad: a diaspora playbook",
    excerpt:
      "How to inspect remotely, execute documents from overseas, move money compliantly and avoid the mistakes that cost diaspora buyers the most.",
    sections: [
      {
        heading: "Inspect without flying home",
        body: "Live video inspections, a trusted representative with a written mandate, or both. We schedule video walk-throughs at your timezone and share unedited footage of the exact unit and street — not marketing renders.",
      },
      {
        heading: "Paperwork across borders",
        body: "Most documents can be executed remotely where the law allows; where notarisation is required, we guide you to the right process at your nearest mission. Every document lands in your portal, not a WhatsApp thread.",
      },
      {
        heading: "Move money the compliant way",
        body: "Pay only into the verified project account shown in the portal, keep transfer receipts, and let us guide currency conversion through documented channels. Never route funds through a personal account — anyone's.",
      },
      {
        heading: "The mistake that costs the most",
        body: "Buying through an informal contact without independent verification. Distance amplifies trust — and fraud. A documented platform, verifiable certificates and a physical office you (or your lawyer) can visit are your protection.",
      },
    ],
  },
];

function BlogPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Blog & insights"
        title={
          <>
            Property knowledge,
            <span className="block text-gold">from the desk that does it.</span>
          </>
        }
        description="Practical guides written by the Kay-Steph team — no recycled listicles, just what we learn running real Abuja transactions every week. Read the full guides right on this page."
      />

      <section className="bg-background py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                id={post.id}
                className="scroll-mt-28 rounded-md border border-border bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-gold">
                    <Tag className="h-3.5 w-3.5" /> {post.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" /> {post.readTime}
                  </span>
                </div>
                <h2 className="mt-3 font-serif text-2xl font-bold leading-snug text-navy sm:text-3xl">
                  {post.title}
                </h2>
                <p className="mt-3 leading-7 text-muted-foreground">{post.excerpt}</p>
                <Accordion type="single" collapsible className="mt-5">
                  <AccordionItem value={`${post.id}-full`} className="border-t border-border">
                    <AccordionTrigger className="text-sm font-bold text-navy hover:no-underline">
                      <span className="inline-flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gold" /> Read the full guide
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5 pb-2 pt-1">
                      {post.sections.map((section) => (
                        <div key={section.heading}>
                          <h3 className="font-bold text-navy">{section.heading}</h3>
                          <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                            {section.body}
                          </p>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe / ask CTA */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <SectionHeadingDark
            title="Want a question answered in a future guide?"
            body="Tell us what you are wrestling with — district choice, financing, structures, diaspora logistics — and the team will write it up."
          />
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              Suggest a topic <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-8 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
            </a>
          </div>
          <p className="mt-6 text-sm text-white/55">
            Looking for numbers instead?{" "}
            <Link to="/market-report" className="font-bold text-gold hover:underline">
              See the latest market report
            </Link>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function SectionHeadingDark({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h2 className="mx-auto max-w-2xl font-serif text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-white/72">{body}</p>
    </>
  );
}
