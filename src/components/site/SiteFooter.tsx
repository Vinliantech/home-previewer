import logoImg from "@/assets/logo.png";
import { ADDRESS_LINES, EMAIL, PHONE_1, PHONE_1_DISPLAY, WHATSAPP_URL } from "@/lib/properties";

const exploreLinks = [
  { label: "Properties", href: "/properties" },
  { label: "Invest", href: "/invest" },
  { label: "Why Kay-Steph", href: "/why-kaysteph" },
  { label: "Market Report", href: "/market-report" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
] as const;

const companyLinks = [
  { label: "About Kay-Steph", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[#05091f] py-14 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 border-b border-white/12 pb-10 sm:grid-cols-2 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="" className="h-11 w-11" width={44} height={44} />
              <div>
                <div className="font-serif text-xl font-bold">Kay-Steph Group</div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold">Abuja, Nigeria</div>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              Premium homes, estate land and structured property ownership with a clear path from
              enquiry to handover.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Explore</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              {exploreLinks.map((link) => (
                <a key={link.href} href={link.href} className="block hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Company</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              {companyLinks.map((link) => (
                <a key={link.href} href={link.href} className="block hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Portals</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <a href="/auth" className="block hover:text-white">Client portal</a>
              <a href="/affiliate/auth" className="block hover:text-white">Affiliate portal</a>
              <a href="/admin/auth" className="block hover:text-white">Administrator</a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Contact</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <div>{ADDRESS_LINES.join(" ")}</div>
              <a href={`tel:${PHONE_1}`} className="block hover:text-white">{PHONE_1_DISPLAY}</a>
              <a href={`mailto:${EMAIL}`} className="block hover:text-white">{EMAIL}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="block hover:text-white">
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kay-Steph Group. All rights reserved.</p>
          <p>Property availability and pricing are subject to confirmation.</p>
        </div>
      </div>
    </footer>
  );
}
