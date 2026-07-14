import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  FileText,
  Landmark,
  MessageCircle,
  PiggyBank,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { PageHero, PageShell } from "@/components/site/PageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { PHONE_1_DISPLAY, WHATSAPP_URL } from "@/lib/properties";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Property Ownership & Fractional Investment — Kay-Steph" },
      {
        name: "description",
        content:
          "Detailed answers about buying Kay-Steph property, fractional investment, minimum contributions, SPVs, tokenization, rental income, withdrawals, resale, legal documents, payments, risks and account security.",
      },
      { property: "og:title", content: "Kay-Steph FAQ | Clear Answers Before You Decide" },
      {
        property: "og:description",
        content:
          "Everything investors ask about ownership, fractional investing, SPVs, tokenization, returns and security.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/faq" }],
  }),
  component: FaqPage,
});

type FaqItem = { question: string; answer: string };
type FaqCategory = {
  id: string;
  icon: typeof Building2;
  title: string;
  description: string;
  items: FaqItem[];
};

const categories: FaqCategory[] = [
  {
    id: "ownership",
    icon: Building2,
    title: "Buying & property ownership",
    description: "Outright purchase, inspections, handover and titles.",
    items: [
      {
        question: "What types of property does Kay-Steph offer?",
        answer:
          "Our current portfolio includes fully detached homes in Guzape and Karsana, serviced apartments in Jahi, contemporary terraces in Life Camp, and surveyed estate land behind Abacha Barracks (Phase II). Every listing is detailed on the Properties page with pricing, specifications and available units.",
      },
      {
        question: "How do I buy a property outright?",
        answer:
          "Choose a property, book a private inspection (by WhatsApp, phone or the contact form), and our sales team will walk you through pricing, payment terms and documentation. Once payment is completed and confirmed, we process your title transfer and hand over the property with all supporting documents.",
      },
      {
        question: "Can I schedule a private site inspection?",
        answer:
          "Yes. Inspections run across all active projects and are confirmed by appointment. Request a slot on WhatsApp, by phone or through the contact page and we will confirm timing within one business day. There is no fee and no obligation.",
      },
      {
        question: "Do the properties have verified titles?",
        answer:
          "Yes. Before any property is listed, our legal team completes a registry title search, reviews encumbrances and verifies survey plans on the ground. Title information is disclosed to you in writing before you commit, and you are free to have your own lawyer verify everything independently.",
      },
      {
        question: "Can Nigerians in the diaspora buy or invest?",
        answer:
          "Absolutely. Much of our client base is in the diaspora. Inspections can be attended by a representative or done by live video, documents are executed remotely where the law allows, and our team guides foreign-currency contributors through compliant conversion and transfer.",
      },
    ],
  },
  {
    id: "fractional",
    icon: PiggyBank,
    title: "Fractional & group investment",
    description: "How co-ownership works and what it costs to start.",
    items: [
      {
        question: "How does fractional property investment work?",
        answer:
          "A verified property is opened for contributions. You invest an amount you choose (at or above the property's minimum), and receive a proportional ownership interest — for example, ₦14M into a ₦140M property gives you a 10% interest. Your ownership, current value, income and documents are tracked in your investor dashboard.",
      },
      {
        question: "What is the minimum contribution?",
        answer:
          "It varies by property and model. Tokenized projects start from about ₦1M per unit, fractional contributions typically start from ₦5M, and group-purchase pools set their own thresholds (commonly from ₦10M). The exact minimum is always displayed on each property before you commit.",
      },
      {
        question: "How is group purchase different from fractional ownership?",
        answer:
          "Group purchase coordinates a pool of buyers toward a specific target — for example, a bulk allocation of units — with contribution milestones, participant records and a defined closing date. Fractional ownership divides a single property into proportional interests you can buy directly. Both are documented and tracked in the portal.",
      },
      {
        question: "Can I create a private group with family or friends?",
        answer:
          "Yes. We can set up a private pool restricted to people you invite — common for families buying together or diaspora groups. Everyone completes verification, sees the same milestones and documents, and receives participant-level records. Contact us to structure one.",
      },
      {
        question: "Can I invest in more than one property?",
        answer:
          "Yes. Many investors spread contributions across several properties to diversify. Your dashboard aggregates all holdings — total invested, current value, income received and documents — in one portfolio view.",
      },
    ],
  },
  {
    id: "structure",
    icon: Landmark,
    title: "SPVs & tokenization",
    description: "The legal machinery behind co-ownership.",
    items: [
      {
        question: "What is an SPV and why does it matter?",
        answer:
          "A Special Purpose Vehicle is a separate legal entity created to hold one property and nothing else. Your ownership interest is recorded against the SPV, which means the asset is ring-fenced: it cannot be touched by liabilities of Kay-Steph's other operations or of other projects. It is the same structure institutional investors use.",
      },
      {
        question: "How does property tokenization work at Kay-Steph?",
        answer:
          "Selected properties are divided into fixed-value digital units (tokens). Each unit represents a defined fraction of the property held through the SPV. You buy the number of units you can afford, receive income distributions per unit, and can list units for resale to other verified investors when you want liquidity. Token status — reserved, active, listed for resale, transferred — is tracked in the portal.",
      },
      {
        question: "Is tokenization the same as cryptocurrency?",
        answer:
          "No. Our units are records of beneficial interest in a real, verified property held through a legal SPV structure — not a tradeable cryptocurrency. There is no speculative coin; the value of your units follows the professionally assessed value of the underlying property.",
      },
      {
        question: "What happens to the SPV when the property is sold?",
        answer:
          "When a property is sold, the sale proceeds flow into the SPV and are distributed to interest-holders in proportion to their ownership, following the process disclosed at investment. Records of the distribution are issued to every participant before the SPV is wound down.",
      },
    ],
  },
  {
    id: "returns",
    icon: TrendingUp,
    title: "Returns, rental income & appreciation",
    description: "How and when you earn.",
    items: [
      {
        question: "How do I earn rental income?",
        answer:
          "For income-generating properties, Kay-Steph manages tenanting and rent collection. Net rental income (after disclosed management costs) is distributed to owners in proportion to their interest, on the schedule stated for each project — typically quarterly. Distributions are recorded in your dashboard with statements you can download.",
      },
      {
        question: "How does property appreciation benefit me?",
        answer:
          "Your interest is a share of the property itself, so when its market value rises, the value of your share rises proportionally. Properties are professionally revalued periodically and your dashboard reflects the updated value. You realise appreciation when the property is sold or when you resell your interest.",
      },
      {
        question: "What returns should I expect?",
        answer:
          "Indicative projected total returns across current projects range from roughly 15% to 22% per year, combining rental yield and appreciation. These are projections based on recent district performance — they are stated per property, before fees, and are never guaranteed. Read each property's disclosure before deciding.",
      },
      {
        question: "When do distributions start?",
        answer:
          "It depends on the property's stage. An already-tenanted apartment can distribute from the next cycle after acquisition completes; a development project distributes once it is completed and income-generating. Each listing states its status — funding, acquisition, income-generating — so you know what to expect.",
      },
    ],
  },
  {
    id: "exit",
    icon: Banknote,
    title: "Withdrawals & resale",
    description: "Getting your money out.",
    items: [
      {
        question: "Can I withdraw my investment?",
        answer:
          "Yes, through the documented exit process. You submit a withdrawal or resale request from your dashboard; it is reviewed, approved for listing, matched with a qualified buyer, and settled with a full transfer record. Because real estate is not instantly liquid, timing depends on finding a buyer for your interest — this is disclosed before you invest.",
      },
      {
        question: "How do I resell my ownership units?",
        answer:
          "List them for resale from your portfolio. Other verified investors can purchase them at the prevailing assessed value (or an agreed price). Once payment is confirmed, the units transfer and both parties receive updated ownership records. Kay-Steph administers the transfer so documentation stays clean.",
      },
      {
        question: "Is there a lock-in period?",
        answer:
          "Some projects specify a minimum holding period — particularly developments where capital is committed to construction. Any lock-in is stated clearly in the property's terms before you contribute. Where none is stated, you may request exit at any time through the standard process.",
      },
      {
        question: "What if the group target is not reached?",
        answer:
          "Each pool sets a participation threshold and closing date. If the target is not reached by closing, the pool either extends (with participants' consent) or contributions are refunded according to the pool's stated terms. Your contribution status is visible in your dashboard throughout.",
      },
    ],
  },
  {
    id: "legal",
    icon: FileText,
    title: "Legal documentation",
    description: "What you receive and how to verify it.",
    items: [
      {
        question: "What documents do I receive as an investor?",
        answer:
          "Depending on the model: an allocation letter or sale agreement for direct purchases; SPV interest records and an ownership certificate for fractional and group investments; and unit records for tokenized holdings. All documents live in your portal, alongside title information, risk disclosures and contribution terms shown before you committed.",
      },
      {
        question: "Can I verify my ownership certificate independently?",
        answer:
          "Yes. Certificates carry a verification token that can be checked through our public verification page — anyone (a bank, a lawyer, a buyer of your interest) can confirm authenticity without needing access to your account.",
      },
      {
        question: "What documents can I review before committing?",
        answer:
          "Property-specific title information, risk disclosures, contribution terms, projected returns, and exit conditions are presented before an investment is submitted. Additional transaction documents are released as the deal progresses through its stages.",
      },
      {
        question: "Can my lawyer review the paperwork?",
        answer:
          "We encourage it. Every disclosure and agreement can be downloaded and shared with your legal adviser before you commit, and our team will answer their questions directly.",
      },
    ],
  },
  {
    id: "security",
    icon: ShieldCheck,
    title: "Verification, payments & security",
    description: "KYC, paying safely and protecting your account.",
    items: [
      {
        question: "Why do I need to complete KYC verification?",
        answer:
          "Verification protects every participant: it ensures you co-own with identified people, prevents fraud, and is required for compliant distributions and transfers. You submit a government-issued ID and basic details; our compliance team typically verifies within one business day. KYC documents are stored in protected storage, never publicly.",
      },
      {
        question: "How do I make payments safely?",
        answer:
          "Only pay into the verified project account details displayed inside the portal for your specific investment — never to personal accounts. After transfer, upload your payment evidence in the portal; finance confirms it before your investment is approved. If bank details are ever unavailable in the portal, contact Kay-Steph finance directly rather than using details from any other source.",
      },
      {
        question: "How is my account secured?",
        answer:
          "Portal access is protected by authenticated sessions, row-level security on all investor data, and audit logs on sensitive changes. Your KYC documents and payment evidence sit in protected storage accessible only to authorised staff. Use a strong, unique password and never share login codes with anyone — Kay-Steph staff will never ask for your password.",
      },
      {
        question: "What are the main risks I should understand?",
        answer:
          "Four, honestly stated: market risk (values can fall as well as rise), liquidity risk (exits take time), rental risk (occupancy and rents vary), and execution risk (developments can face delays or cost changes). Every property page carries specific disclosures. Never invest money you may need at short notice, and read the terms before committing.",
      },
      {
        question: "Is Kay-Steph regulated? Who actually holds the property?",
        answer:
          "Kay-Steph Group is a registered Nigerian property development and investment company headquartered in Guzape, Abuja. Co-owned properties are held by dedicated SPVs in which your interest is formally recorded — so the asset is held by the legal structure you invest through, not informally by the company.",
      },
    ],
  },
];

function FaqPage() {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [query]);

  const totalVisible = visible.reduce((sum, category) => sum + category.items.length, 0);
  const totalItems = categories.reduce((sum, category) => sum + category.items.length, 0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((category) =>
      category.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ),
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PageHero
        eyebrow="Frequently asked questions"
        title={
          <>
            Clear answers,
            <span className="block text-gold">before you decide.</span>
          </>
        }
        description={`${totalItems} detailed answers covering ownership, fractional investment, SPVs, tokenization, returns, withdrawals, documentation, payments and security. If yours isn't here, ask us directly.`}
      >
        <div className="relative mt-8 max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/50" />
          <Input
            type="search"
            placeholder="Search the FAQ — e.g. “minimum”, “SPV”, “resale”…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-full border-white/30 bg-white pl-11 text-navy placeholder:text-navy/45"
            aria-label="Search frequently asked questions"
          />
        </div>
      </PageHero>

      {/* Category quick links */}
      <section className="bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="flex flex-col items-center gap-2 rounded-md border border-border bg-white p-4 text-center shadow-sm transition-colors hover:border-gold"
              >
                <category.icon className="h-5 w-5 text-gold" />
                <span className="text-xs font-semibold leading-4 text-navy">{category.title}</span>
              </a>
            ))}
            <Link
              to="/contact"
              className="flex flex-col items-center justify-center gap-2 rounded-md bg-navy p-4 text-center shadow-sm"
            >
              <MessageCircle className="h-5 w-5 text-gold" />
              <span className="text-xs font-semibold leading-4 text-white">Ask us directly</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {query.trim() && (
            <p className="mb-8 text-center text-sm text-muted-foreground">
              {totalVisible === 0 ? (
                <>
                  No answers match “{query}”. Try another term or{" "}
                  <Link to="/contact" className="font-semibold text-navy underline hover:text-gold">
                    ask us directly
                  </Link>
                  .
                </>
              ) : (
                <>
                  Showing <span className="font-bold text-navy">{totalVisible}</span> answer
                  {totalVisible === 1 ? "" : "s"} matching “{query}”
                </>
              )}
            </p>
          )}

          <div className="space-y-14">
            {visible.map((category) => (
              <div key={category.id} id={category.id} className="scroll-mt-28">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-navy text-gold">
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-navy sm:text-3xl">
                      {category.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <Accordion type="single" collapsible className="mt-6 space-y-3">
                  {category.items.map((item, index) => (
                    <AccordionItem
                      key={item.question}
                      value={`${category.id}-${index}`}
                      className="rounded-md border border-border bg-white px-5 shadow-sm"
                    >
                      <AccordionTrigger className="text-left text-sm font-bold text-navy hover:no-underline sm:text-base">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="max-w-3xl pb-5 leading-7 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl font-bold sm:text-4xl">
            Still have a question?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/72">
            Talk to a real person. Call {PHONE_1_DISPLAY}, message us on WhatsApp, or send an
            enquiry and we will respond within one business day.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-8 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              Send an enquiry <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
