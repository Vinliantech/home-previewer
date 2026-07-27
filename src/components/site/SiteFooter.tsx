import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";
import { NewsletterForm } from "@/components/content/Editorial";
import { ADDRESS_LINES, EMAIL, PHONE_1, PHONE_1_DISPLAY, WHATSAPP_URL } from "@/lib/properties";

const exploreLinks = [
  { label: "Properties", to: "/properties" },
  { label: "Invest", to: "/invest" },
  { label: "Why Kay-Steph", to: "/why-kaysteph" },
  { label: "Market Report", to: "/market-report" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact Us", to: "/contact" },
] as const;

const companyLinks = [
  { label: "About Kay-Steph", to: "/about" },
  { label: "Our Team", to: "/team" },
  { label: "Services", to: "/services" },
  { label: "Blog", to: "/blog" },
  { label: "Youth Network", to: "/events/youth-network" },
  { label: "Careers", to: "/careers" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[#05091f] py-14 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 grid gap-5 border-b border-white/12 pb-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Kay-Steph Journal
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">
              Property intelligence, selected for you.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Choose relevant updates and receive verified market guidance without inbox noise.
            </p>
          </div>
          <NewsletterForm compact dark />
        </div>
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
                <Link key={link.to} to={link.to} className="block hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Company</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              {companyLinks.map((link) => (
                <Link key={link.to} to={link.to} className="block hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Portals</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <Link to="/auth" className="block hover:text-white">
                Client portal
              </Link>
              <Link to="/affiliate/auth" className="block hover:text-white">
                Affiliate portal
              </Link>
              <Link to="/admin/auth" className="block hover:text-white">
                Administrator
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Contact</h3>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <div>{ADDRESS_LINES.join(" ")}</div>
              <a href={`tel:${PHONE_1}`} className="block hover:text-white">
                {PHONE_1_DISPLAY}
              </a>
              <a href={`mailto:${EMAIL}`} className="block hover:text-white">
                {EMAIL}
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="block hover:text-white"
              >
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
