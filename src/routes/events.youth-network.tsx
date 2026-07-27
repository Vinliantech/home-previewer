import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { WHATSAPP_URL } from "@/lib/properties";
import {
  YOUTH_NETWORK_GENDERS,
  YOUTH_NETWORK_INTERESTS,
  submitYouthNetworkRegistration,
} from "@/lib/youth-network.functions";

import bannerImg from "@/assets/youth-network/01-banner.jpg";
import hostsImg from "@/assets/youth-network/02-hosts.jpg";
import speakingImg from "@/assets/youth-network/03-participant-speaking.jpg";
import speakerImg from "@/assets/youth-network/04-speaker.jpg";
import audienceFrontImg from "@/assets/youth-network/05-audience-front.jpg";
import discussionImg from "@/assets/youth-network/06-discussion.jpg";
import audienceRearImg from "@/assets/youth-network/07-audience-rear.jpg";
import guestImg from "@/assets/youth-network/08-guest.jpg";
import siteVisitImg from "@/assets/youth-network/09-site-visit.jpg";

export const Route = createFileRoute("/events/youth-network")({
  head: () => ({
    meta: [
      { title: "Workshop 2.0 — Own Your Future | Kay-Steph Youth Network" },
      {
        name: "description",
        content:
          "Workshop 2.0 — real estate as a career, a skill and a wealth tool. Saturday 8 August 2026 at Phoenix Apartment, Katampe, Abuja. Free registration for young people ready to build.",
      },
      { property: "og:title", content: "Workshop 2.0 — Own Your Future | Kay-Steph Youth Network" },
      {
        property: "og:description",
        content:
          "The journey continues. 8 August 2026, Phoenix Apartment, Katampe, Abuja — build real estate knowledge, marketing skills and sales confidence.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/events/youth-network" }],
  }),
  component: YouthNetworkPage,
});

const EVENT_META = [
  { icon: CalendarDays, label: "Date", value: "Saturday, 8 August 2026" },
  { icon: MapPin, label: "Venue", value: "Phoenix Apartment, Katampe, Abuja" },
  { icon: Ticket, label: "Admission", value: "Registration required" },
];

const OUTCOMES = [
  "Understand Kay-Steph properties, titles and documentation.",
  "Learn digital lead generation, pitching and follow-up techniques.",
  "Create a personal marketing action plan you can use immediately.",
  "Connect with mentors, participants and Kay-Steph team members.",
];

const GAINS = [
  {
    title: "Real Estate Knowledge",
    body: "Understand property products, locations, documentation and the sales journey.",
  },
  {
    title: "Marketing Skills",
    body: "Learn practical approaches to social media promotion, lead generation and follow-up.",
  },
  {
    title: "Sales Confidence",
    body: "Improve pitching, objection handling, relationship building and closing techniques.",
  },
  {
    title: "Professional Network",
    body: "Connect with young professionals, mentors and the Kay-Steph community.",
  },
  {
    title: "Income Pathway",
    body: "Discover opportunities in referrals, affiliate marketing and property sales.",
  },
  {
    title: "Personal Action Plan",
    body: "Leave with clear next steps for applying your knowledge after the workshop.",
  },
];

const PROGRAMME = [
  {
    title: "Welcome and Introduction",
    body: "Meet the Kay-Steph team and understand the purpose of the Youth Network.",
  },
  {
    title: "Real Estate Fundamentals",
    body: "Property products, locations, titles, documentation and the sales process.",
  },
  {
    title: "Digital Lead Generation",
    body: "How to attract, capture and follow up with potential property buyers.",
  },
  {
    title: "Pitching and Closing",
    body: "Presenting opportunities clearly, handling objections and closing responsibly.",
  },
  {
    title: "Career and Affiliate Pathways",
    body: "Learn how qualified participants can join the Kay-Steph network.",
  },
  {
    title: "Networking and Q&A",
    body: "Ask questions, build relationships and define your next steps.",
  },
];

const GALLERY = [
  { src: hostsImg, caption: "Kay-Steph Youth Network hosts" },
  { src: audienceFrontImg, caption: "Building a strong youth network" },
  { src: speakerImg, caption: "Workshop presentation session" },
  { src: discussionImg, caption: "Questions, discussion and participation" },
  { src: siteVisitImg, caption: "Practical property site exposure" },
  { src: audienceRearImg, caption: "Interactive learning environment" },
  { src: guestImg, caption: "Participants and invited guests" },
];

const EMPTY_FORM = {
  fullName: "",
  location: "",
  gender: "",
  phone: "",
  email: "",
  whatsapp: "",
  occupation: "",
  interest: "",
  expectation: "",
};

function YouthNetworkPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Youth Network · Workshop 2.0"
        title={
          <>
            Own your future:
            <span className="block text-gold">
              real estate as a career, a skill and a wealth tool.
            </span>
          </>
        }
        description="The journey continues. A practical real estate and sales workshop for young people ready to learn, network and discover new income opportunities."
        backgroundImage={bannerImg}
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#register"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Register for the workshop <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#programme"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            Explore the programme
          </a>
        </div>

        <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
          {EVENT_META.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-md border border-white/15 bg-white/5 p-4">
              <Icon className="mb-2 h-5 w-5 text-gold" />
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">{label}</div>
              <div className="mt-1 text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </PageHero>

      {/* About */}
      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <img
            src={speakingImg}
            alt="A participant speaking at the Kay-Steph Youth Network workshop"
            loading="lazy"
            width={800}
            height={1067}
            className="w-full rounded-2xl border border-border object-cover shadow-sm lg:aspect-[4/5]"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
              About the workshop
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-navy sm:text-4xl">
              Practical knowledge for real estate, sales and entrepreneurship.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              The Kay-Steph Youth Network Workshop equips NYSC corps members, young adults and
              aspiring entrepreneurs with practical real estate product knowledge, marketing skills,
              sales confidence and a pathway into the Kay-Steph sales or referral network.
            </p>
            <ul className="mt-8 grid gap-4">
              {OUTCOMES.map((outcome) => (
                <li key={outcome} className="flex gap-3 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What you gain */}
      <section className="border-y border-border bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="What you will gain"
            title="Turn interest into practical capability."
            description="Every session is designed to help participants understand, communicate and sell real estate opportunities with confidence."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {GAINS.map((gain, index) => (
              <div key={gain.title} className="border border-border bg-background p-7 shadow-sm">
                <span className="font-serif text-4xl font-bold text-gold/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-navy">{gain.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{gain.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programme */}
      <section className="bg-background py-20" id="programme">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Workshop programme"
            title="A focused learning and networking experience."
          />
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-2">
            {PROGRAMME.map((item, index) => (
              <article
                key={item.title}
                className="flex gap-5 rounded-lg border border-border bg-white p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy font-bold text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-navy">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <GallerySection />
      <RegistrationSection />

      {/* Closing CTA */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">
              Kay-Steph Youth Network
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              Your next opportunity may begin in the room.
            </h2>
          </div>
          <a
            href="#register"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            Register now <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </PageShell>
  );
}

function GallerySection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = openIndex === null ? null : GALLERY[openIndex];

  return (
    <section className="border-y border-border bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Event gallery"
          title="Learning, conversation and community in action."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Enlarge photo: ${item.caption}`}
              className="group relative overflow-hidden rounded-2xl border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <img
                src={item.src}
                alt={item.caption}
                loading="lazy"
                width={800}
                height={600}
                className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                  index === 0 ? "aspect-[4/3] lg:aspect-[16/10]" : "aspect-[4/3]"
                }`}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 to-transparent px-4 pb-3 pt-10 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {item.caption}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{active?.caption ?? "Event photo"}</DialogTitle>
          {active && (
            <figure className="m-0">
              <img
                src={active.src}
                alt={active.caption}
                className="max-h-[80vh] w-full rounded-2xl object-contain"
              />
              <figcaption className="mt-3 text-center text-sm text-white">
                {active.caption}
              </figcaption>
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

type Confirmation = {
  reference: string;
  email: string;
  firstName: string;
  alreadyRegistered: boolean;
};

function RegistrationSection() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) return toast.error("Please accept the consent statement.");
    setStatus("submitting");
    try {
      const result = await submitYouthNetworkRegistration({
        data: {
          fullName: form.fullName,
          location: form.location,
          gender: form.gender as (typeof YOUTH_NETWORK_GENDERS)[number],
          phone: form.phone,
          email: form.email,
          whatsapp: form.whatsapp || undefined,
          occupation: form.occupation || undefined,
          interest: form.interest as (typeof YOUTH_NETWORK_INTERESTS)[number],
          expectation: form.expectation || undefined,
          consentGiven: consent,
          company: company || undefined,
        },
      });
      setConfirmation({
        reference: result.reference,
        email: result.email,
        firstName: form.fullName.trim().split(/\s+/)[0] || form.fullName.trim(),
        alreadyRegistered: result.alreadyRegistered,
      });
      setStatus("idle");
      setForm(EMPTY_FORM);
      setConsent(false);
    } catch (error) {
      setStatus("error");
      toast.error(
        error instanceof Error ? error.message : "Your registration could not be completed.",
      );
    }
  }

  return (
    <section className="bg-background py-20" id="register">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="h-max rounded-2xl bg-navy p-8 text-white lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
            Reserve your place
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold">Register for the next workshop.</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Saturday, 8 August 2026 at Phoenix Apartment, Katampe, Abuja. Complete the form and the
            Kay-Steph team will confirm your place and send the arrival details.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-white/85">
            {[
              "Practical workshop sessions",
              "Networking with ambitious young people",
              "Access to Kay-Steph opportunities",
              "Email confirmation and event reminders",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          {confirmation ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
              <h2 className="mt-5 font-serif text-2xl font-bold text-navy">
                Registration received
              </h2>
              <p className="mt-4 text-base font-semibold text-navy">
                Thank you, {confirmation.firstName}.
              </p>
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                Your registration reference is{" "}
                <strong className="font-mono text-base text-navy">{confirmation.reference}</strong>.
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                A confirmation email has been sent to{" "}
                <strong className="text-navy">{confirmation.email}</strong>.
              </p>
              {confirmation.alreadyRegistered && (
                <p className="mx-auto mt-4 max-w-md rounded-lg bg-gold/10 px-4 py-3 text-xs leading-6 text-navy">
                  You were already registered for this workshop, so this is your original reference
                  — your place is still held.
                </p>
              )}
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                We will see you on Saturday, 8 August 2026 at Phoenix Apartment, Katampe, Abuja.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <Link to="/properties">Browse properties</Link>
                </Button>
                <Button asChild className="bg-navy text-white hover:bg-navy/90">
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Chat with us
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-2xl font-bold text-navy">Participant registration</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fields marked with * are required.
              </p>

              <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
                {/* Honeypot: hidden from people, tempting to bots. */}
                <input
                  type="text"
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                <Field label="Full name *" className="sm:col-span-2">
                  <Input
                    value={form.fullName}
                    onChange={(e) => set("fullName")(e.target.value)}
                    autoComplete="name"
                    placeholder="Enter your full name"
                    required
                  />
                </Field>

                <Field label="Location *">
                  <Input
                    value={form.location}
                    onChange={(e) => set("location")(e.target.value)}
                    placeholder="City or state"
                    required
                  />
                </Field>

                <Field label="Gender *">
                  <Select value={form.gender} onValueChange={set("gender")}>
                    <SelectTrigger aria-label="Gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {YOUTH_NETWORK_GENDERS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Phone number *">
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+234..."
                    required
                  />
                </Field>

                <Field label="Email address *">
                  <Input
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </Field>

                <Field label="WhatsApp number">
                  <Input
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp")(e.target.value)}
                    type="tel"
                    placeholder="+234..."
                  />
                </Field>

                <Field label="Occupation">
                  <Input
                    value={form.occupation}
                    onChange={(e) => set("occupation")(e.target.value)}
                    placeholder="Student, NYSC, entrepreneur..."
                  />
                </Field>

                <Field label="Area of interest *" className="sm:col-span-2">
                  <Select value={form.interest} onValueChange={set("interest")}>
                    <SelectTrigger aria-label="Area of interest">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {YOUTH_NETWORK_INTERESTS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="What do you hope to gain?" className="sm:col-span-2">
                  <Textarea
                    value={form.expectation}
                    onChange={(e) => set("expectation")(e.target.value)}
                    rows={4}
                    placeholder="Tell us briefly what you want to learn or achieve."
                  />
                </Field>

                <div className="flex gap-3 sm:col-span-2">
                  <Checkbox
                    id="youth-consent"
                    checked={consent}
                    onCheckedChange={(value) => setConsent(value === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="youth-consent"
                    className="text-xs font-normal leading-6 text-muted-foreground"
                  >
                    I agree that Kay-Steph Group may use the information provided to manage my
                    registration and contact me about this event, related training and relevant
                    opportunities.
                  </Label>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={status === "submitting"}
                    className={`min-h-12 w-full sm:w-auto sm:min-w-56 ${
                      status === "error"
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "bg-gold text-gold-foreground hover:bg-gold/90"
                    }`}
                  >
                    {status === "submitting" && (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                      </>
                    )}
                    {status === "error" && (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4" /> Try again
                      </>
                    )}
                    {status === "idle" && "Complete registration"}
                  </Button>
                  {status === "error" && (
                    <p role="alert" className="text-xs leading-6 text-destructive">
                      Your registration did not go through. Check your details and try again, or
                      reach us on WhatsApp and we will register you directly.
                    </p>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
