import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Landmark,
  Loader2,
  Lock,
  MessageCircle,
  Target,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { submitGroupBuyRequest, type GroupBuyInput } from "@/lib/groupbuy.functions";
import { WHATSAPP_URL, properties } from "@/lib/properties";

export const Route = createFileRoute("/invest/group-buy")({
  head: () => ({
    meta: [
      { title: "Group Buy | Buy Abuja Property Together — Kay-Steph" },
      {
        name: "description",
        content:
          "Pool funds with verified buyers toward a specific Kay-Steph development. Start a private group with family or friends, or join an open pool — coordinated milestones, documented contributions and SPV-protected ownership.",
      },
      { property: "og:title", content: "Kay-Steph Group Buy | Buy Together, At Scale" },
      {
        property: "og:description",
        content:
          "Coordinated property pools from ~₦10M per member — same verified assets, shared buying power.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/invest/group-buy" }],
  }),
  component: GroupBuyPage,
});

const steps = [
  {
    title: "Choose a pool",
    body: "Review the project, target amount, participation threshold and closing date — or name the property your own group wants to target.",
  },
  {
    title: "Reserve interest",
    body: "Complete identity verification and state the contribution you intend to make. Every participant is KYC-verified — you pool with identified people, never anonymous money.",
  },
  {
    title: "Reach the target",
    body: "Follow participant growth and contribution milestones from your dashboard. Reminders keep everyone on schedule; the audit history keeps everyone honest.",
  },
  {
    title: "Complete purchase",
    body: "When the target is met, the purchase completes and you receive allocation records, documents and project updates in one place.",
  },
];

const MEMBER_OPTIONS = ["2 – 4 members", "5 – 8 members", "9 – 15 members", "16+ members"];
const CONTRIBUTION_OPTIONS = [
  "₦5M – ₦10M each",
  "₦10M – ₦25M each",
  "₦25M – ₦50M each",
  "Above ₦50M each",
  "Not sure yet",
];
const TIMELINE_OPTIONS = ["Within 1 month", "1 – 3 months", "3 – 6 months", "Flexible"];

const faqs = [
  {
    question: "What is the minimum to join a group buy?",
    answer:
      "Each pool sets its own threshold — typically from ₦10M per member, depending on the target property. The exact figure is stated before you commit anything.",
  },
  {
    question: "What happens if the pool doesn't reach its target?",
    answer:
      "Every pool has a stated closing date. If the target is not reached, the pool either extends with participants' consent or contributions are refunded according to the pool's written terms. Your status is visible throughout.",
  },
  {
    question: "Can I form a group with only family and friends?",
    answer:
      "Yes — that is exactly what private pools are for. You choose who is invited, everyone completes verification, and the pool is closed to outsiders. It's the most common structure for families and diaspora groups buying together.",
  },
  {
    question: "How is our shared ownership held?",
    answer:
      "Where a pool ends in shared ownership, the asset is held by a dedicated Special Purpose Vehicle (SPV) — a separate legal entity whose only asset is that property. Each member's interest is formally recorded against the SPV, ring-fenced from every other project.",
  },
];

function GroupBuyPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Group Buy"
        title={
          <>
            More buying power.
            <span className="block text-gold">Clearer coordination.</span>
          </>
        }
        description="Join qualified buyers around selected developments and move toward bulk purchase or co-ownership targets through a structured, transparent process — no fragmented chats, no spreadsheets."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#start-group"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            <UsersRound className="h-4 w-4" /> Start a private group
          </a>
          <a
            href="#join-pool"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            <UserPlus className="h-4 w-4" /> Join an open pool
          </a>
        </div>
        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
          {[
            { icon: Users, label: "Entry", value: "From ~₦10M" },
            { icon: ClipboardCheck, label: "Process", value: "Milestone-tracked" },
            { icon: Landmark, label: "Ownership", value: "SPV protected" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-md border border-white/15 bg-white/5 p-4">
              <Icon className="mx-auto mb-2 h-5 w-5 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">{label}</div>
              <div className="text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </PageHero>

      {/* How it works */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="From shared interest to documented purchase."
            description="Participants see the same verified milestones, contribution status, documents and project updates — with admin approval and a full audit history behind every step."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
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

      {/* Private vs open + worked example */}
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              Two ways to pool
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
              Private with your people, or open with verified buyers.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <div className="border border-white/12 bg-white/5 p-8">
              <UsersRound className="h-7 w-7 text-gold" />
              <h3 className="mt-5 font-serif text-2xl font-bold">Private group</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">
                You choose the property and invite only the people you trust — family, friends, a
                diaspora circle. The pool is closed to outsiders.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Invitation-only membership",
                  "Your own target and timeline",
                  "Participant-level records for each member",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-white/85">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-white/12 bg-white/5 p-8">
              <UserPlus className="h-7 w-7 text-gold" />
              <h3 className="mt-5 font-serif text-2xl font-bold">Open pool</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Kay-Steph opens a pool on a selected development and verified buyers join until the
                target is met. Ideal when you want the buying power without organising the buyers.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Join with your own contribution",
                  "Every participant KYC-verified",
                  "Pool terms stated before you commit",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-white/85">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Worked example */}
            <div className="rounded-md border border-gold/40 bg-white/5 p-8">
              <Target className="h-7 w-7 text-gold" />
              <h3 className="mt-5 font-serif text-2xl font-bold">A pool in numbers</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Illustration: 8 verified buyers target a ₦240M development at ₦30M each.
              </p>
              <div className="mt-5">
                <div className="mb-1 flex justify-between text-xs text-white/60">
                  <span>₦110.4M committed</span>
                  <span>46% of ₦240M</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[46%] rounded-full bg-gold" />
                </div>
              </div>
              <dl className="mt-5 space-y-2.5 text-sm">
                {[
                  ["Target", "₦240,000,000"],
                  ["Members", "8 of 8 places"],
                  ["Per member", "₦30,000,000"],
                  ["Outcome", "Allocation or SPV co-ownership"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-white/10 pb-2"
                  >
                    <dt className="text-white/60">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-5 text-white/50">
                Figures are illustrative. Each pool's target, threshold and closing date are stated
                in writing before you commit.
              </p>
            </div>
          </div>

          {/* SPV note */}
          <div className="mt-10 flex flex-col items-start gap-4 rounded-md border border-gold/40 bg-[#0a0f2e] p-6 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <p className="flex-1 text-sm leading-6 text-white/80">
              <span className="font-bold text-white">How your ownership is protected: </span>
              where a pool ends in shared ownership, the asset is held by a dedicated Special
              Purpose Vehicle — a separate legal entity whose only asset is that property, with each
              member's interest formally recorded and ring-fenced.
            </p>
            <Link
              to="/invest"
              hash="spv-protection"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-gold hover:underline"
            >
              Learn about the SPV <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* The two forms */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Get started"
            title="Tell us how you want to buy together."
            description="Submit either form and our team confirms your group and opens your pool within one business day — with the terms in writing before anyone contributes a naira."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <StartGroupForm />
            <JoinPoolForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeading eyebrow="Common questions" title="Group buying, answered." />
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`gb-faq-${index}`}
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
          <p className="mt-8 text-center text-sm text-muted-foreground">
            More questions?{" "}
            <Link to="/faq" className="font-semibold text-navy underline hover:text-gold">
              Read the full FAQ
            </Link>{" "}
            or{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-navy underline hover:text-gold"
            >
              ask us on WhatsApp
            </a>
            .
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">
              Rather buy on your own terms?
            </h2>
            <p className="mt-3 max-w-xl text-white/72">
              Own outright from ₦32.5M, or start with tokenized units from ₦1M — every route is
              verified and documented.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/properties"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              Browse properties <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/invest/tokenized"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              Tokenized ownership
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

function useGroupBuySubmit(requestType: GroupBuyInput["requestType"]) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(payload: Omit<GroupBuyInput, "requestType">) {
    setSubmitting(true);
    try {
      await submitGroupBuyRequest({ data: { ...payload, requestType } });
      setSubmitted(true);
      toast.success("Request received. We will confirm your pool within one business day.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "We could not submit your request. Please try again or contact us on WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, submitted, setSubmitted, submit };
}

function FormSuccess({ onReset, message }: { onReset: () => void; message: string }) {
  return (
    <div className="rounded-md border border-gold/40 bg-cream p-8 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-gold" />
      <h3 className="mt-4 font-serif text-xl font-bold text-navy">Request received.</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground"
        >
          <MessageCircle className="h-4 w-4" /> Chat with us now
        </a>
        <Button variant="outline" onClick={onReset}>
          Send another request
        </Button>
      </div>
    </div>
  );
}

function PropertySelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Target property" id={id}>
        <SelectValue placeholder="Choose a property" />
      </SelectTrigger>
      <SelectContent>
        {properties.map((property) => (
          <SelectItem key={property.id} value={property.title}>
            {property.title} — {property.location}
          </SelectItem>
        ))}
        <SelectItem value="Another property / not sure yet">
          Another property / not sure yet
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function StartGroupForm() {
  const { submitting, submitted, setSubmitted, submit } = useGroupBuySubmit("start_private_group");
  const [form, setForm] = useState({
    groupName: "",
    fullName: "",
    email: "",
    phone: "",
    targetProperty: "",
    expectedMembers: "",
    contributionPerMember: "",
    timeline: "",
    message: "",
    company: "",
  });

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.targetProperty) return void toast.error("Please choose a target property.");
    submit({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      targetProperty: form.targetProperty,
      groupName: form.groupName || undefined,
      expectedMembers: form.expectedMembers || undefined,
      contributionPerMember: form.contributionPerMember || undefined,
      timeline: form.timeline || undefined,
      message: form.message || undefined,
      company: form.company || undefined,
    });
  }

  return (
    <div
      id="start-group"
      className="scroll-mt-28 rounded-md border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
          <UsersRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-bold text-navy">Start a private group</h3>
          <p className="text-sm text-muted-foreground">
            For families, friends and circles who want to buy together.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="mt-6">
          <FormSuccess
            onReset={() => setSubmitted(false)}
            message="Our team will call you to confirm the group, agree the terms in writing and open your private pool — within one business day."
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sg-group-name">Group name (optional)</Label>
            <Input
              id="sg-group-name"
              placeholder="e.g. Okafor Family Pool"
              value={form.groupName}
              onChange={(e) => set("groupName")(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sg-name">Your full name *</Label>
              <Input
                id="sg-name"
                required
                minLength={2}
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => set("fullName")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sg-phone">Phone *</Label>
              <Input
                id="sg-phone"
                required
                type="tel"
                minLength={7}
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-email">Email *</Label>
            <Input
              id="sg-email"
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-property">Target property *</Label>
            <PropertySelect
              id="sg-property"
              value={form.targetProperty}
              onChange={set("targetProperty")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Expected members</Label>
              <Select value={form.expectedMembers} onValueChange={set("expectedMembers")}>
                <SelectTrigger aria-label="Expected members">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contribution per member</Label>
              <Select
                value={form.contributionPerMember}
                onValueChange={set("contributionPerMember")}
              >
                <SelectTrigger aria-label="Contribution per member">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timeline</Label>
            <Select value={form.timeline} onValueChange={set("timeline")}>
              <SelectTrigger aria-label="Timeline">
                <SelectValue placeholder="When do you want to start?" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-message">Anything else? (optional)</Label>
            <Textarea
              id="sg-message"
              rows={3}
              placeholder="Tell us about your group and what you want to achieve."
              value={form.message}
              onChange={(e) => set("message")(e.target.value)}
            />
          </div>
          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={form.company}
            onChange={(e) => set("company")(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-full bg-gold text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                Start my private group <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            No commitment yet — this registers your group. Terms are agreed in writing before any
            member contributes.
          </p>
        </form>
      )}
    </div>
  );
}

function JoinPoolForm() {
  const { submitting, submitted, setSubmitted, submit } = useGroupBuySubmit("join_open_pool");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    targetProperty: "",
    intendedContribution: "",
    message: "",
    company: "",
  });

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.targetProperty) return void toast.error("Please choose a property of interest.");
    submit({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      targetProperty: form.targetProperty,
      intendedContribution: form.intendedContribution || undefined,
      message: form.message || undefined,
      company: form.company || undefined,
    });
  }

  return (
    <div
      id="join-pool"
      className="scroll-mt-28 rounded-md border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-gold-foreground">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-bold text-navy">Join an open pool</h3>
          <p className="text-sm text-muted-foreground">
            Register your interest and we will place you when a pool opens.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-md bg-cream p-4 text-sm leading-6 text-navy">
        Pools open per project as demand gathers. Register below and you will be first in line —
        with the pool's target, threshold and closing date sent to you in writing before you commit.
      </div>

      {submitted ? (
        <div className="mt-6">
          <FormSuccess
            onReset={() => setSubmitted(false)}
            message="You are on the list. As soon as a pool opens on your chosen property, we will send you the terms and your reservation link — within one business day."
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jp-name">Your full name *</Label>
              <Input
                id="jp-name"
                required
                minLength={2}
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => set("fullName")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jp-phone">Phone *</Label>
              <Input
                id="jp-phone"
                required
                type="tel"
                minLength={7}
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jp-email">Email *</Label>
            <Input
              id="jp-email"
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jp-property">Property of interest *</Label>
            <PropertySelect
              id="jp-property"
              value={form.targetProperty}
              onChange={set("targetProperty")}
            />
          </div>
          <div className="space-y-2">
            <Label>Intended contribution</Label>
            <Select value={form.intendedContribution} onValueChange={set("intendedContribution")}>
              <SelectTrigger aria-label="Intended contribution">
                <SelectValue placeholder="Select a range" />
              </SelectTrigger>
              <SelectContent>
                {CONTRIBUTION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jp-message">Anything else? (optional)</Label>
            <Textarea
              id="jp-message"
              rows={3}
              placeholder="Timeline, questions, or anything we should know."
              value={form.message}
              onChange={(e) => set("message")(e.target.value)}
            />
          </div>
          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={form.company}
            onChange={(e) => set("company")(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-full bg-navy text-sm font-bold text-white hover:bg-gold hover:text-gold-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                Register my interest <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Registering costs nothing and creates no obligation. We never share your details.
          </p>
        </form>
      )}
    </div>
  );
}
