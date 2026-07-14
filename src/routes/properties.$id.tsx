import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import {
  getProperty,
  properties,
  PHONE_1,
  PHONE_1_DISPLAY,
  WHATSAPP_URL,
  ADDRESS_LINES,
  type Property,
} from "@/lib/properties";

export const Route = createFileRoute("/properties/$id")({
  loader: ({ params }) => {
    const property = getProperty(params.id);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Property not found — Kay-Steph Group" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.property;
    const title = `${p.title} — ${p.location} · Kay-Steph Group`;
    const description = `${p.tagline}. ${p.highlight}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: PropertyDetail,
  notFoundComponent: PropertyNotFound,
});

function PropertyNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="font-serif text-4xl font-bold text-navy">Property not found</h1>
        <p className="mt-3 text-muted-foreground">
          This property may have been reserved or renamed.
        </p>
        <Link
          to="/"
          hash="projects"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
      </div>
    </div>
  );
}

function PropertyDetail() {
  const { property: p } = Route.useLoaderData() as { property: Property };
  const others = properties.filter((x) => x.id !== p.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImg} alt="Kay-Steph Group" className="h-10 w-10" width={40} height={40} />
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold text-navy">Kay-Steph</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Group
              </div>
            </div>
          </Link>
          <Link
            to="/"
            hash="projects"
            className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy hover:text-navy-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All Projects
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <img
          src={p.image}
          alt={p.title}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          width={1200}
          height={800}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/60 to-navy" />
        <div className="container relative z-10 mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <MapPin className="h-3.5 w-3.5" /> {p.location}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-6xl">
              {p.title}
            </h1>
            <p className="mt-4 text-lg text-navy-foreground/80 md:text-xl">{p.tagline}</p>
            <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div className="font-serif text-3xl font-bold text-gold">{p.price}</div>
              <div className="text-sm text-navy-foreground/70">{p.priceNote}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-background py-16">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Overview + units */}
          <div>
            <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-6">
              {p.specs.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1 text-center">
                  <s.icon className="h-5 w-5 text-gold" />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>

            <h2 className="mt-12 font-serif text-3xl font-bold text-navy">Overview</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
              {p.overview.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>

            <h2 className="mt-12 font-serif text-3xl font-bold text-navy">What's included</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-gold" /> {f}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 font-serif text-3xl font-bold text-navy">Units & Pricing</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-navy text-navy-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Unit</th>
                    <th className="px-5 py-3 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {p.units.map((u) => (
                    <tr key={u.label} className="border-t border-border bg-card">
                      <td className="px-5 py-4">{u.label}</td>
                      <td className="px-5 py-4 text-right font-semibold text-navy">{u.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reservation form */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ReserveForm propertyTitle={p.title} units={p.units.map((u) => u.label)} />
          </aside>
        </div>
      </section>

      {/* Other projects */}
      <section className="bg-cream py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-3xl font-bold text-navy md:text-4xl">
              Other Kay-Steph projects
            </h2>
            <Link
              to="/"
              hash="projects"
              className="text-sm font-semibold text-gold hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.id}
                to="/properties/$id"
                params={{ id: o.id }}
                className="group overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={o.image}
                    alt={o.title}
                    loading="lazy"
                    width={1200}
                    height={800}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="text-xs uppercase tracking-widest text-gold">{o.location}</div>
                  <div className="mt-1 font-serif text-lg font-bold text-navy">{o.title}</div>
                  <div className="mt-2 text-sm font-semibold text-navy">{o.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-navy py-10 text-navy-foreground">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="" className="h-8 w-8" width={32} height={32} />
              <span className="font-serif text-lg font-bold">Kay-Steph Group</span>
            </div>
            <p className="mt-3 text-xs text-navy-foreground/70">
              © {new Date().getFullYear()} Kay-Steph Group. All rights reserved.
            </p>
          </div>
          <div className="text-sm text-navy-foreground/80">
            {ADDRESS_LINES.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div className="flex flex-col items-start gap-2 text-sm md:items-end">
            <a href={`tel:${PHONE_1}`} className="hover:text-gold">
              {PHONE_1_DISPLAY}
            </a>
            <a href={WHATSAPP_URL} className="hover:text-gold" target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ReserveForm({
  propertyTitle,
  units,
}: {
  propertyTitle: string;
  units: string[];
}) {
  const initialUnit = units[0] ?? "";
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    unit: initialUnit,
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handle(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = [
      `Reservation enquiry — ${propertyTitle}`,
      "",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email ? `Email: ${form.email}` : null,
      form.unit ? `Unit: ${form.unit}` : null,
      form.message ? `\n${form.message}` : null,
    ].filter(Boolean);
    const msg = encodeURIComponent(lines.join("\n"));
    setSubmitted(true);
    window.open(`${WHATSAPP_URL}?text=${msg}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      id="reserve"
      className="scroll-mt-28 rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
        <Calendar className="h-4 w-4" /> Reservation
      </div>
      <h3 className="mt-3 font-serif text-2xl font-bold text-navy">Reserve This Plot</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Send us your details and we'll confirm availability, share the reservation terms and
        schedule your site visit within 24 hours.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Full name">
          <input
            required
            value={form.name}
            onChange={handle("name")}
            className="input"
            placeholder="Your name"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone / WhatsApp">
            <input
              required
              value={form.phone}
              onChange={handle("phone")}
              className="input"
              placeholder="0803 000 0000"
              inputMode="tel"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              value={form.email}
              onChange={handle("email")}
              className="input"
              placeholder="you@example.com"
            />
          </Field>
        </div>
        {units.length > 1 && (
          <Field label="Preferred unit">
            <select value={form.unit} onChange={handle("unit")} className="input">
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Message (optional)">
          <textarea
            value={form.message}
            onChange={handle("message")}
            className="input min-h-[100px]"
            placeholder="Any specific questions or timing?"
          />
        </Field>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:scale-[1.01]"
        >
          <MessageCircle className="h-4 w-4" /> Reserve via WhatsApp
        </button>

        <a
          href={`tel:${PHONE_1}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-navy/20 px-6 py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-navy-foreground"
        >
          <Phone className="h-4 w-4" /> Or call {PHONE_1_DISPLAY}
        </a>

        {submitted && (
          <p className="text-center text-xs text-muted-foreground">
            WhatsApp is opening in a new tab — send the message to complete your reservation.
          </p>
        )}
      </form>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-background);padding:0.65rem 0.9rem;font-size:0.875rem;color:var(--color-foreground);}
.input:focus{outline:2px solid var(--color-gold);outline-offset:1px;}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-navy/70">
        {label}
      </span>
      {children}
    </label>
  );
}
