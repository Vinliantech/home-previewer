import type { ReactNode } from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WHATSAPP_URL } from "@/lib/properties";

/** Standard page frame: fixed header, footer and floating WhatsApp action. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Kay-Steph on WhatsApp"
        className="fixed bottom-5 right-5 z-40 hidden min-h-12 items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-gold-foreground shadow-2xl hover:bg-gold/90 sm:inline-flex"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Chat with Kay-Steph</span>
        <ChevronRight className="h-4 w-4" />
      </a>
    </div>
  );
}

/** Compact navy hero used at the top of interior pages. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-navy pb-16 pt-[136px] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

/** Centered section heading used across interior pages. */
export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl font-bold text-navy sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-5 text-base leading-7 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
