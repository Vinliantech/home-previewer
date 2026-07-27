import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Headset,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHero, PageShell, SectionHeading } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitEnquiry } from "@/lib/enquiry.functions";
import { listPublicPropertyCatalogue } from "@/lib/invest.functions";
import {
  ADDRESS_LINES,
  EMAIL,
  MAP_EMBED_URL,
  OFFICE_HOURS,
  PHONE_1,
  PHONE_1_DISPLAY,
  PHONE_2,
  PHONE_2_DISPLAY,
  WHATSAPP_URL,
  mergeCatalogueProperties,
} from "@/lib/properties";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    try {
      return await listPublicPropertyCatalogue();
    } catch {
      return { properties: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "Contact Kay-Steph Group | Guzape Office, Abuja" },
      {
        name: "description",
        content:
          "Speak with the Kay-Steph team about buying, investing or inspecting a property. Visit our Guzape office, call, email or send an enquiry — we respond within one business day.",
      },
      { property: "og:title", content: "Contact Kay-Steph Group | Guzape Office, Abuja" },
      {
        property: "og:description",
        content: "Call, WhatsApp, email or visit the Kay-Steph office in Guzape, Abuja.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://kaystephgroup.com/contact" }],
  }),
  component: ContactPage,
});

const SUBJECT_OPTIONS = [
  { value: "buy_property", label: "Buying a property" },
  { value: "invest", label: "Fractional / group investment" },
  { value: "site_inspection", label: "Booking a site inspection" },
  { value: "existing_investment", label: "My existing investment" },
  { value: "partnership", label: "Partnership or affiliate" },
  { value: "other", label: "Something else" },
] as const;

const BUDGET_OPTIONS = [
  "Below ₦50M",
  "₦50M – ₦100M",
  "₦100M – ₦250M",
  "₦250M – ₦500M",
  "Above ₦500M",
  "Not sure yet",
];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  propertyInterest: string;
  budget: string;
  message: string;
  consentGiven: boolean;
  company: string; // honeypot
};

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  propertyInterest: "",
  budget: "",
  message: "",
  consentGiven: false,
  company: "",
};

function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact us"
        title={
          <>
            Start with a real conversation.
            <span className="block text-gold">We respond within one business day.</span>
          </>
        }
        description="Whether you are buying a home, exploring fractional investment or booking a private inspection, the team at our Guzape office is ready to guide your next step."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
          >
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
          <a
            href={`tel:${PHONE_1}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
          >
            <Phone className="h-4 w-4" /> Call {PHONE_1_DISPLAY}
          </a>
        </div>
      </PageHero>

      {/* Contact channels */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ChannelCard icon={Phone} title="Call us">
              <a href={`tel:${PHONE_1}`} className="block font-semibold text-navy hover:text-gold">
                {PHONE_1_DISPLAY}
              </a>
              <a href={`tel:${PHONE_2}`} className="block font-semibold text-navy hover:text-gold">
                {PHONE_2_DISPLAY}
              </a>
              <p className="mt-2">Lines are open during office hours.</p>
            </ChannelCard>
            <ChannelCard icon={MessageCircle} title="WhatsApp">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-navy hover:text-gold"
              >
                Message {PHONE_1_DISPLAY}
              </a>
              <p className="mt-2">
                Fastest channel for enquiries, brochures and inspection bookings.
              </p>
            </ChannelCard>
            <ChannelCard icon={Mail} title="Email">
              <a href={`mailto:${EMAIL}`} className="font-semibold text-navy hover:text-gold">
                {EMAIL}
              </a>
              <p className="mt-2">For documents, formal requests and detailed questions.</p>
            </ChannelCard>
            <ChannelCard icon={MapPin} title="Visit our office">
              {ADDRESS_LINES.map((line) => (
                <div key={line} className="font-semibold text-navy">
                  {line}
                </div>
              ))}
              <p className="mt-2">
                Walk-ins welcome during office hours; inspections by appointment.
              </p>
            </ChannelCard>
          </div>
        </div>
      </section>

      {/* Enquiry form + office details */}
      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-md border border-border bg-white p-6 shadow-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Enquiry form</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-navy">Tell us what you need.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Complete the form and a Kay-Steph adviser will contact you within one business day.
              Your details go directly to our client team and are never shared with third parties.
            </p>
            <EnquiryForm />
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-md border border-border bg-white shadow-sm">
              <iframe
                title="Kay-Steph Group head office — 43 Kenneth Minimah Crescent, Guzape, Abuja"
                src={MAP_EMBED_URL}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <div className="flex items-start gap-3 p-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div className="text-sm leading-6 text-muted-foreground">
                  <div className="font-serif text-base font-bold text-navy">Head office</div>
                  {ADDRESS_LINES.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-gold" />
                <h3 className="font-serif text-lg font-bold text-navy">Office hours</h3>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                {OFFICE_HOURS.map((row) => (
                  <div
                    key={row.days}
                    className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground">{row.days}</dt>
                    <dd className="font-semibold text-navy">{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-md border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarCheck2 className="h-5 w-5 text-gold" />
                <h3 className="font-serif text-lg font-bold text-navy">Private inspections</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Site visits run across all active projects and are confirmed by appointment. Request
                a slot by WhatsApp, phone or the enquiry form and we will confirm timing within one
                business day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support options */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Customer support"
            title="The right team for every request."
            description="Route your question to the desk that can resolve it fastest."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <SupportCard
              icon={Building2}
              title="Sales & inspections"
              body="Availability, pricing, brochures and site-visit bookings for every listed project."
              action={<SupportLink href={WHATSAPP_URL} external label="WhatsApp the sales desk" />}
            />
            <SupportCard
              icon={Users}
              title="Investor relations"
              body="Fractional ownership, group purchases, SPV terms, contributions and payout questions."
              action={
                <Link
                  to="/invest"
                  className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
                >
                  Explore investing <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <SupportCard
              icon={ShieldCheck}
              title="Verification & KYC"
              body="Identity verification, account access and document upload support for investors."
              action={
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
                >
                  Investor sign in <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <SupportCard
              icon={Headset}
              title="General support"
              body="Existing owners, documentation requests, complaints and every other enquiry."
              action={<SupportLink href={`mailto:${EMAIL}`} label={EMAIL} />}
            />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">Prefer to browse first?</h2>
            <p className="mt-3 max-w-xl text-white/72">
              Explore current homes, land and investment opportunities, then reach out when you find
              the right fit.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/properties"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90"
            >
              View properties <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/faq"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white hover:text-navy"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function EnquiryForm() {
  const { properties: catalogueRows } = Route.useLoaderData();
  const properties = mergeCatalogueProperties(catalogueRows);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.subject) {
      toast.error("Please choose what your enquiry is about.");
      return;
    }
    if (!form.consentGiven) {
      toast.error("Please agree to the contact and privacy notice.");
      return;
    }
    setSubmitting(true);
    try {
      await submitEnquiry({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          subject: form.subject as (typeof SUBJECT_OPTIONS)[number]["value"],
          propertyInterest: form.propertyInterest || undefined,
          budget: form.budget || undefined,
          message: form.message,
          consentGiven: form.consentGiven,
          company: form.company || undefined,
        },
      });
      setSubmitted(true);
      setForm(EMPTY_FORM);
      toast.success("Enquiry received. We will contact you within one business day.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "We could not submit your enquiry. Please try again or contact us on WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-8 rounded-md border border-gold/40 bg-cream p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-gold" />
        <h3 className="mt-4 font-serif text-2xl font-bold text-navy">
          Thank you — enquiry received.
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A Kay-Steph adviser will contact you within one business day. For anything urgent, reach
          us directly on WhatsApp at {PHONE_1_DISPLAY}.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-gold-foreground"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp us
          </a>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Send another enquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name *</Label>
          <Input
            id="fullName"
            required
            minLength={2}
            autoComplete="name"
            placeholder="e.g. Adaeze Okafor"
            value={form.fullName}
            onChange={(e) => set("fullName")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number *</Label>
          <Input
            id="phone"
            required
            type="tel"
            minLength={7}
            autoComplete="tel"
            placeholder="e.g. 0803 000 0000"
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address *</Label>
        <Input
          id="email"
          required
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 rounded-md border border-border bg-cream/40 p-4 text-sm leading-6 text-muted-foreground">
        <Checkbox
          checked={form.consentGiven}
          onCheckedChange={(checked) =>
            setForm((previous) => ({ ...previous, consentGiven: checked === true }))
          }
          required
          aria-label="Consent to receive communication from Kay-Steph"
          className="mt-1"
        />
        <span>
          I agree that Kay-Steph may use the information provided to contact me about properties,
          events and investment opportunities. I understand that I can unsubscribe at any time.
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>What is your enquiry about? *</Label>
          <Select value={form.subject} onValueChange={set("subject")}>
            <SelectTrigger aria-label="Enquiry subject">
              <SelectValue placeholder="Choose a topic" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Indicative budget (optional)</Label>
          <Select value={form.budget} onValueChange={set("budget")}>
            <SelectTrigger aria-label="Indicative budget">
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Property of interest (optional)</Label>
        <Select value={form.propertyInterest} onValueChange={set("propertyInterest")}>
          <SelectTrigger aria-label="Property of interest">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.title}>
                {property.title} — {property.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Your message *</Label>
        <Textarea
          id="message"
          required
          minLength={10}
          rows={5}
          placeholder="Tell us what you are looking for, your preferred timeline and any questions you have."
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
        className="min-h-12 w-full rounded-full bg-gold text-sm font-bold text-gold-foreground hover:bg-gold/90 sm:w-auto sm:px-10"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Send enquiry <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        We protect your contact information and retain the consent record with this enquiry.
      </p>
    </form>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Phone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 font-serif text-lg font-bold text-navy">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

function SupportCard({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Building2;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col border border-border bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-gold-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-bold text-navy">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function SupportLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </a>
  );
}
