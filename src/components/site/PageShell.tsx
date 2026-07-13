import type { ReactNode } from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WHATSAPP_URL } from "@/lib/properties";

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
