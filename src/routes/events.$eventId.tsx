import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MapPin, UsersRound, Video } from "lucide-react";
import { toast } from "sonner";
import { PageHero, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVESTMENT_TYPES, fmtDate, type InvestmentType } from "@/lib/crm";
import { getPublicCrmEvent, registerForCrmEvent } from "@/lib/event.functions";

export const Route = createFileRoute("/events/$eventId")({
  loader: ({ params }) => getPublicCrmEvent({ data: { eventId: params.eventId } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.event.name ?? "Kay-Steph event"} | Registration` },
      {
        name: "description",
        content:
          loaderData?.event.description ??
          "Register for a Kay-Steph property event, workshop or site inspection.",
      },
    ],
  }),
  errorComponent: () => (
    <PageShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 pt-24 text-center">
        <div>
          <h1 className="font-serif text-4xl font-bold text-navy">Registration unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            This event may be full, completed or no longer published.
          </p>
          <Button asChild className="mt-6 bg-gold text-gold-foreground">
            <Link to="/contact">Contact Kay-Steph</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  ),
  component: EventRegistrationPage,
});

function EventRegistrationPage() {
  const { event, registrations } = Route.useLoaderData();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    location: "",
    countryOfResidence: "Nigeria",
    propertyInterest: event.property_name ?? "",
    budgetMin: "",
    budgetMax: "",
    investmentType: "not_decided" as InvestmentType,
    heardAbout: "",
    preferredContactMethod: "whatsapp" as "whatsapp" | "phone" | "email",
    consentGiven: false,
    company: "",
  });
  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  async function submit(eventSubmit: React.FormEvent) {
    eventSubmit.preventDefault();
    if (!form.consentGiven) return toast.error("Please agree to the contact and privacy notice.");
    setBusy(true);
    try {
      await registerForCrmEvent({
        data: {
          eventId: event.id,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          whatsappNumber: form.whatsappNumber,
          location: form.location,
          countryOfResidence: form.countryOfResidence,
          propertyInterest: form.propertyInterest,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
          investmentType: form.investmentType,
          heardAbout: form.heardAbout,
          preferredContactMethod: form.preferredContactMethod,
          consentGiven: true,
          company: form.company || undefined,
        },
      });
      setSubmitted(true);
      toast.success("Your registration is confirmed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Kay-Steph event registration"
        title={
          <>
            {event.name}
            <span className="block text-gold">Reserve your place.</span>
          </>
        }
        description={
          event.description ??
          "Join the Kay-Steph team for a clear, practical property investment briefing."
        }
      />
      <section className="bg-cream py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="self-start border border-border bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-navy">Event details</h2>
            <div className="mt-6 space-y-5 text-sm text-muted-foreground">
              <EventDetail
                icon={CalendarDays}
                label="Date and time"
                value={fmtDate(event.starts_at)}
              />
              <EventDetail
                icon={event.meeting_url ? Video : MapPin}
                label="Venue"
                value={event.venue ?? (event.meeting_url ? "Online meeting" : "To be confirmed")}
              />
              {event.property_name && (
                <EventDetail icon={MapPin} label="Property focus" value={event.property_name} />
              )}
              <EventDetail
                icon={UsersRound}
                label="Availability"
                value={
                  event.capacity
                    ? `${Math.max(0, event.capacity - registrations)} of ${event.capacity} places remaining`
                    : "Registration open"
                }
              />
            </div>
            <div className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              <p className="font-bold text-navy">After you register</p>
              <p className="mt-2">
                We will send confirmation and event details by email. A Kay-Steph adviser may
                contact you about your selected property or investment preference.
              </p>
            </div>
          </aside>
          <div className="border border-border bg-white p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-gold" />
                <h2 className="mt-5 font-serif text-3xl font-bold text-navy">
                  Registration confirmed
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Your details are in the Kay-Steph CRM and the event confirmation workflow has
                  started.
                </p>
                <Button asChild className="mt-6 bg-navy text-white">
                  <Link to="/properties">Explore properties</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                    Registration form
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-bold text-navy">
                    Tell us about your interest
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name *">
                    <Input
                      required
                      minLength={2}
                      value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                    />
                  </Field>
                  <Field label="Email address *">
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </Field>
                  <Field label="Phone number *">
                    <Input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </Field>
                  <Field label="WhatsApp number">
                    <Input
                      type="tel"
                      value={form.whatsappNumber}
                      onChange={(e) => set("whatsappNumber", e.target.value)}
                    />
                  </Field>
                  <Field label="Current location">
                    <Input
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    />
                  </Field>
                  <Field label="Country of residence *">
                    <Input
                      required
                      value={form.countryOfResidence}
                      onChange={(e) => set("countryOfResidence", e.target.value)}
                    />
                  </Field>
                  <Field label="Property or project interest">
                    <Input
                      value={form.propertyInterest}
                      onChange={(e) => set("propertyInterest", e.target.value)}
                    />
                  </Field>
                  <Field label="Investment preference">
                    <Select
                      value={form.investmentType}
                      onValueChange={(value) => set("investmentType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVESTMENT_TYPES.map((item) => (
                          <SelectItem key={item.key} value={item.key}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Budget minimum (NGN)">
                    <Input
                      type="number"
                      min="0"
                      value={form.budgetMin}
                      onChange={(e) => set("budgetMin", e.target.value)}
                    />
                  </Field>
                  <Field label="Budget maximum (NGN)">
                    <Input
                      type="number"
                      min="0"
                      value={form.budgetMax}
                      onChange={(e) => set("budgetMax", e.target.value)}
                    />
                  </Field>
                  <Field label="Preferred contact">
                    <Select
                      value={form.preferredContactMethod}
                      onValueChange={(value) => set("preferredContactMethod", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="How did you hear about this event?">
                    <Input
                      value={form.heardAbout}
                      onChange={(e) => set("heardAbout", e.target.value)}
                    />
                  </Field>
                </div>
                <label className="flex items-start gap-3 border border-border bg-cream/50 p-4 text-xs leading-5 text-muted-foreground">
                  <Checkbox
                    checked={form.consentGiven}
                    onCheckedChange={(checked) => set("consentGiven", checked === true)}
                    className="mt-0.5"
                  />
                  <span>
                    I agree that Kay-Steph may use the information provided to contact me about
                    properties, events and investment opportunities. I understand that I can
                    unsubscribe at any time.
                  </span>
                </label>
                <input
                  type="text"
                  tabIndex={-1}
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  className="hidden"
                  aria-hidden="true"
                />
                <Button
                  type="submit"
                  disabled={busy}
                  className="min-h-12 w-full bg-gold text-sm font-bold text-gold-foreground hover:bg-gold/90"
                >
                  {busy ? "Registering..." : "Confirm registration"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function EventDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-gold">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-navy">{label}</p>
        <p className="mt-1 leading-5">{value}</p>
      </div>
    </div>
  );
}
