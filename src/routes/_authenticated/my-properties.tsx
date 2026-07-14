import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHeader, PortalShell, fmtNaira as fmt } from "@/components/portal/PortalShell";
import rubysImg from "@/assets/rubys-apartment.jpg";
import terraceImg from "@/assets/lillycrest-terrace.jpg";
import plotsImg from "@/assets/estate-plots.jpg";

export const Route = createFileRoute("/_authenticated/my-properties")({
  head: () => ({
    meta: [
      { title: "My Properties | Kay-Steph Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPropertiesPage,
});

const holdings = [
  {
    id: "rubys-apartment-jahi",
    name: "Ruby's Apartment",
    location: "Jahi, Abuja",
    img: rubysImg,
    contributed: 14_000_000,
    ownership: "10.00%",
    shareValue: 15_400_000,
    yieldPct: 7.5,
    status: "approved" as const,
  },
  {
    id: "lillycrest-terrace-lifecamp",
    name: "Lillycrest Terrace",
    location: "Life Camp, Abuja",
    img: terraceImg,
    contributed: 12_500_000,
    ownership: "5.00%",
    shareValue: 13_125_000,
    yieldPct: 6.8,
    status: "approved" as const,
  },
  {
    id: "estate-plots-phase-ii",
    name: "Estate Plots — Phase II",
    location: "Behind Abacha Barracks",
    img: plotsImg,
    contributed: 4_000_000,
    ownership: "0.00%",
    shareValue: 0,
    yieldPct: 0,
    status: "pending" as const,
  },
];

function MyPropertiesPage() {
  return (
    <PortalShell>
      <PageHeader
        title="My Properties"
        subtitle="Every property you hold a position in, live-valued monthly."
      />
      <div className="mt-6 grid gap-5">
        {holdings.map((h) => (
          <Card key={h.id} className="p-0">
            <div className="flex flex-wrap gap-6 p-5">
              <img src={h.img} alt="" className="h-28 w-40 rounded-lg object-cover ring-1 ring-navy/10" />
              <div className="flex-1 min-w-[240px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">
                  {h.location}
                </p>
                <h3 className="font-serif text-xl font-bold text-navy">{h.name}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <Stat label="Contributed" value={fmt(h.contributed)} />
                  <Stat label="Ownership" value={h.ownership} />
                  <Stat label="Share value" value={fmt(h.shareValue)} />
                  <Stat label="Yield" value={`${h.yieldPct.toFixed(1)}%`} />
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                {h.status === "approved" ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                    Approved
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                    Awaiting company approval
                  </span>
                )}
                <Link
                  to="/exit-requests"
                  className="text-xs font-bold text-navy hover:text-gold"
                >
                  Request exit →
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PortalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">{label}</p>
      <p className="mt-0.5 font-bold text-navy">{value}</p>
    </div>
  );
}
