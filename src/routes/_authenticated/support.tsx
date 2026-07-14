import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy, Mail, MessageCircle, Phone } from "lucide-react";
import { Card, PageHeader, PortalShell } from "@/components/portal/PortalShell";
import {
  EMAIL,
  PHONE_1,
  PHONE_1_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/properties";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <PortalShell>
      <PageHeader
        title="Support"
        subtitle="Speak with your dedicated Kay-Steph client advisor."
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-navy">
            <Phone className="h-5 w-5" />
          </span>
          <p className="mt-3 font-bold text-navy">Call us</p>
          <p className="text-xs text-navy/60">Mon–Fri, 9:00 – 18:00 WAT</p>
          <a
            href={`tel:${PHONE_1}`}
            className="mt-3 inline-block text-sm font-bold text-navy hover:text-gold"
          >
            {PHONE_1_DISPLAY}
          </a>
        </Card>

        <Card>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-navy">
            <MessageCircle className="h-5 w-5" />
          </span>
          <p className="mt-3 font-bold text-navy">WhatsApp</p>
          <p className="text-xs text-navy/60">Fastest reply, within 15 minutes</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-bold text-navy hover:text-gold"
          >
            Open chat →
          </a>
        </Card>

        <Card>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-navy">
            <Mail className="h-5 w-5" />
          </span>
          <p className="mt-3 font-bold text-navy">Email</p>
          <p className="text-xs text-navy/60">For documents and detailed queries</p>
          <a
            href={`mailto:${EMAIL}`}
            className="mt-3 inline-block text-sm font-bold text-navy hover:text-gold"
          >
            {EMAIL}
          </a>
        </Card>
      </div>

      <Card className="mt-5 flex flex-wrap items-center gap-4 bg-navy text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-[240px]">
          <p className="font-serif text-base font-bold">Need something else?</p>
          <p className="text-xs text-white/70">Browse our FAQ or book a private consultation.</p>
        </div>
        <Link
          to="/faq"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-4 py-2 text-xs font-bold hover:bg-white/10"
        >
          Read FAQ
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-xs font-bold text-gold-foreground hover:bg-gold/90"
        >
          Book a call
        </Link>
      </Card>
    </PortalShell>
  );
}
