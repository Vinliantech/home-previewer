import type { LucideIcon } from "lucide-react";
import { Bed, Bath, Car, Ruler, Building2, MapPin } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import guzapeImg from "@/assets/guzape-dream-homes.jpg";
import rubysImg from "@/assets/rubys-apartment.jpg";
import terraceImg from "@/assets/lillycrest-terrace.jpg";
import residenceImg from "@/assets/lillycrest-residence.jpg";
import plotsImg from "@/assets/estate-plots.jpg";

export const PHONE_1 = "+2348166666724";
export const PHONE_2 = "+2348166666216";
export const PHONE_1_DISPLAY = "0816 666 6724";
export const PHONE_2_DISPLAY = "0816 666 6216";
export const ADDRESS_LINES = ["No. 43 Kenneth Minimah Crescent,", "Guzape, Abuja FCT, Nigeria"];
export const WHATSAPP_URL = `https://wa.me/${PHONE_1.replace(/[^0-9]/g, "")}`;
export const EMAIL = "info@kaystephgroup.com";
export const MAP_EMBED_URL =
  "https://www.google.com/maps?q=43+Kenneth+Minimah+Crescent,+Guzape,+Abuja,+Nigeria&output=embed";
export const OFFICE_HOURS = [
  { days: "Monday – Friday", hours: "9:00 – 18:00" },
  { days: "Saturday", hours: "10:00 – 15:00" },
  { days: "Sunday & public holidays", hours: "By appointment only" },
];

export type InvestmentModel =
  "full_purchase" | "group_purchase" | "fractional" | "spv" | "tokenized";

export const INVESTMENT_MODEL_LABEL: Record<InvestmentModel, string> = {
  full_purchase: "Full purchase",
  group_purchase: "Group purchase",
  fractional: "Fractional ownership",
  spv: "SPV co-ownership",
  tokenized: "Tokenized units",
};

export type PropertyType =
  "Detached home" | "Semi-detached home" | "Apartment" | "Terrace" | "Estate land";

/**
 * Gallery images are discovered from a folder rather than imported one by one,
 * so dropping new renders into src/assets/<slug>/ publishes them with no code
 * change. Filenames sort naturally, so 01-, 02-… fixes the running order.
 */
function loadGallery(files: Record<string, unknown>): string[] {
  return Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, src]) => src as string);
}

const lifecampGallery = loadGallery(
  import.meta.glob("../assets/lillycrest-luxury-terrace/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

const guzapeGallery = loadGallery(
  import.meta.glob("../assets/dream-house-guzape/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

const rubysGallery = loadGallery(
  import.meta.glob("../assets/rubys-apartment/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

const karsanaGallery = loadGallery(
  import.meta.glob("../assets/lillycrest-residence/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

const estatePlotsGallery = loadGallery(
  import.meta.glob("../assets/estate-plots/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

const daverekLuxuryGallery = loadGallery(
  import.meta.glob("../assets/daverek-luxury-apartments/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

const daverekApartmentGallery = loadGallery(
  import.meta.glob("../assets/daverek-apartment/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

const daverekCityGallery = loadGallery(
  import.meta.glob("../assets/daverek-city/*.{jpg,jpeg,png,webp}", {
    eager: true,
    import: "default",
  }),
);

export type FundingStatus =
  "available" | "selling" | "funding_open" | "fully_funded" | "coming_soon";

export const FUNDING_STATUS_LABEL: Record<FundingStatus, string> = {
  available: "Available now",
  selling: "Selling",
  funding_open: "Funding open",
  fully_funded: "Fully funded",
  coming_soon: "Coming Soon",
};

export type PropertyUnit = { label: string; price: string };

export type Property = {
  id: string;
  image: string;
  /** Extra renders shown on the detail page. Empty means cover image only. */
  gallery: string[];
  tag: string;
  location: string;
  title: string;
  tagline: string;
  price: string;
  priceNote: string;
  specs: { icon: LucideIcon; label: string }[];
  highlight: string;
  features: string[];
  overview: string[];
  units: PropertyUnit[];
  /** A development may offer several products; every one is filterable. */
  propertyTypes: PropertyType[];
  investmentModels: InvestmentModel[];
  /** Lowest entry price in naira, used for filtering and sorting. */
  priceValue: number;
  /** Indicative projected total annual return (rental yield + appreciation), %. */
  expectedReturnPct: number;
  fundingStatus: FundingStatus;
  /** Admin-controlled visibility on the homepage. */
  showOnHome?: boolean;
  /** Admin-controlled order; lower numbers appear first. */
  homeOrder?: number;
};

export type CataloguePropertyRow = {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  property_type?: string | null;
  images?: string[] | null;
  initial_value: number;
  current_value?: number | null;
  expected_appreciation?: number | null;
  expected_rental_yield?: number | null;
  status?: string | null;
  public_slug?: string | null;
  public_tag?: string | null;
  tagline?: string | null;
  price_label?: string | null;
  price_note?: string | null;
  highlight?: string | null;
  features?: string[] | null;
  overview?: string[] | null;
  public_units?: unknown;
  public_property_types?: string[] | null;
  investment_models?: string[] | null;
  public_funding_status?: string | null;
  is_public?: boolean | null;
  show_on_home?: boolean | null;
  home_order?: number | null;
};

export const properties: Property[] = [
  {
    id: "guzape-dream-homes",
    image: guzapeGallery[0] ?? guzapeImg,
    gallery: guzapeGallery,
    tag: "Move-in Ready",
    location: "Guzape, Abuja",
    title: "Dream House in Guzape",
    tagline: "Five luxury terraces on Kay-Steph's home street — fully built, ready to move in",
    price: "₦500,000,000",
    priceNote: "per unit",
    specs: [
      { icon: Ruler, label: "5 units" },
      { icon: Bed, label: "5 Bedrooms" },
      { icon: Car, label: "Private compound" },
    ],
    highlight:
      "A five-unit collection of luxury terraces on Kenneth Minimah Crescent — construction is complete, so your keys are ready the day your paperwork is.",
    features: ["Luxury Terrace", "Fully Built", "Move-in Ready", "Prime Guzape Address"],
    overview: [
      "Five luxury terraces on Kenneth Minimah Crescent, Guzape — the same premium street where Kay-Steph is headquartered. Construction is fully complete and the homes are ready for immediate move-in.",
      "Each home is designed for a principal family: expansive living across the floors, a private compound, dedicated staff quarters and a driveway that comfortably holds multiple vehicles.",
      "Guzape has become one of Abuja's fastest-appreciating districts, with proximity to Asokoro, Maitama and the diplomatic zone.",
    ],
    units: [{ label: "5-Bedroom Luxury Terrace", price: "₦500,000,000" }],
    propertyTypes: ["Terrace"],
    investmentModels: ["full_purchase", "group_purchase", "spv"],
    priceValue: 500_000_000,
    expectedReturnPct: 18,
    fundingStatus: "available",
  },
  {
    id: "rubys-apartment-jahi",
    image: rubysGallery[0] ?? rubysImg,
    gallery: rubysGallery,
    tag: "Available",
    location: "Jahi, Abuja",
    title: "Ruby's Apartment",
    tagline: "Modern city apartments in Jahi",
    price: "₦160M / ₦140M",
    priceNote: "3-bed / 2-bed",
    specs: [
      { icon: Bed, label: "2 & 3 Bedrooms" },
      { icon: Bath, label: "En-suite" },
      { icon: Building2, label: "Serviced" },
    ],
    highlight:
      "Sun-lit apartments with premium finishes, balconies and secure parking — available as two- and three-bedroom homes.",
    features: ["Serviced", "Balcony Views", "24/7 Security"],
    overview: [
      "Contemporary serviced apartments in Jahi — one of Abuja's most connected residential districts, minutes from Jabi Lake and the airport road.",
      "Every unit features open-plan living, en-suite bedrooms, a private balcony, secure covered parking and 24/7 estate management.",
      "Two- and three-bedroom layouts are available — ideal for professionals, expatriates and yield-focused investors.",
    ],
    units: [
      { label: "3-Bedroom Apartment", price: "₦160,000,000" },
      { label: "2-Bedroom Apartment", price: "₦140,000,000" },
    ],
    propertyTypes: ["Apartment"],
    investmentModels: ["full_purchase", "fractional", "spv", "tokenized"],
    priceValue: 140_000_000,
    expectedReturnPct: 15,
    fundingStatus: "funding_open",
  },
  {
    id: "lillycrest-terrace-lifecamp",
    image: lifecampGallery[0] ?? terraceImg,
    gallery: lifecampGallery,
    tag: "Selling",
    location: "Life Camp, Abuja",
    title: "Lillycrest Luxury Terrace",
    tagline: "Contemporary luxury terraces in Life Camp",
    price: "₦250,000,000",
    priceNote: "per terrace",
    specs: [
      { icon: Bed, label: "4 Bedrooms + BQ" },
      { icon: Bath, label: "All en-suite" },
      { icon: Car, label: "Private garage" },
    ],
    highlight:
      "A boutique cluster of tall, light-filled terraces with boys' quarters — designed for professional households who want a lock-and-leave city home.",
    features: ["Terrace", "Boys' Quarter", "Life Camp"],
    overview: [
      "A boutique cluster of four-bedroom luxury terraces with boys' quarters in Life Camp, one of Abuja's most sought-after professional neighbourhoods.",
      "Tall ceilings, floor-to-ceiling glazing, en-suite bedrooms across all floors, private garage and a compact but well-planned rear yard.",
      "Perfect for professional households who want the lock-and-leave convenience of a terrace with the privacy of a detached home.",
    ],
    units: [{ label: "4-Bedroom Terrace with BQ", price: "₦250,000,000" }],
    propertyTypes: ["Terrace"],
    investmentModels: ["full_purchase", "group_purchase", "fractional"],
    priceValue: 250_000_000,
    expectedReturnPct: 16,
    fundingStatus: "selling",
  },
  {
    id: "lillycrest-residence-karsana",
    image: karsanaGallery[0] ?? residenceImg,
    gallery: karsanaGallery,
    tag: "Multiple Units",
    location: "Karsana, Abuja",
    title: "Lillycrest Residence",
    tagline: "Detached, semi-detached, terrace and apartment units with BQ",
    price: "From ₦90,000,000",
    priceNote: "four unit types",
    specs: [
      { icon: Building2, label: "4 unit types" },
      { icon: Bed, label: "3–4 Bedrooms + BQ" },
      { icon: Car, label: "Dedicated parking" },
    ],
    highlight:
      "One development, four ways in: fully detached, semi-detached, terrace and a 3-bedroom apartment with elevator — priced from ₦90M through ₦210M so families can enter at the right level.",
    features: ["Detached", "Semi-detached", "Terrace", "Apartment + Elevator"],
    overview: [
      "A single Karsana development offering four distinct products — fully detached, semi-detached and terrace homes (all 4-bedroom plus BQ), and a 3-bedroom apartment served by an elevator.",
      "Four price tiers make Lillycrest Residence accessible to a wide range of buyers, from apartment purchasers at ₦90M to established households taking a fully detached home at ₦210M.",
      "Karsana is a rapidly developing corridor with strong long-term appreciation; every unit sits within a secured estate with dedicated parking and full staff quarters.",
    ],
    units: [
      { label: "Fully Detached · 4-Bedroom + BQ", price: "₦210,000,000" },
      { label: "Semi Detached · 4-Bedroom + BQ", price: "₦180,000,000" },
      { label: "Terrace · 4-Bedroom + BQ", price: "₦155,000,000" },
      { label: "Apartment · 3-Bedroom + Elevator", price: "₦90,000,000" },
    ],
    propertyTypes: ["Detached home", "Semi-detached home", "Terrace", "Apartment"],
    investmentModels: ["full_purchase", "group_purchase", "spv"],
    priceValue: 90_000_000,
    expectedReturnPct: 17,
    fundingStatus: "selling",
  },
  {
    id: "estate-plots-phase-ii",
    // The aerial stays as the card cover; the gallery shows the prototype
    // homes buyers can build, then the per-size plot renders.
    image: plotsImg,
    gallery: estatePlotsGallery,
    tag: "Land",
    location: "Phase II, Behind Abacha Barracks",
    title: "Estate Plots — Phase II",
    tagline: "Surveyed estate land, ready to build",
    price: "From ₦22,750,000",
    priceNote: "₦65,000 / sqm",
    specs: [
      { icon: Ruler, label: "350 – 1000 sqm" },
      { icon: MapPin, label: "Phase II" },
      { icon: Building2, label: "Secure title" },
    ],
    highlight:
      "Fully surveyed estate parcels behind Abacha Barracks — a rare land-banking opportunity in a rapidly appreciating corridor, priced at ₦65,000 per sqm.",
    features: ["Secure Title", "350 – 1000 sqm", "High Appreciation"],
    overview: [
      "Fully surveyed estate parcels located behind Abacha Barracks — one of the FCT's most secure and rapidly appreciating corridors.",
      "Phase II is available now at ₦65,000 per square metre, in plot sizes from 350 sqm through 1,000 sqm to suit personal builds, small developers and land-bankers.",
      "Every plot comes with verified title documentation and estate-level infrastructure planning.",
    ],
    units: [
      { label: "350 sqm Plot", price: "₦22,750,000" },
      { label: "500 sqm Plot", price: "₦32,500,000" },
      { label: "600 sqm Plot", price: "₦39,000,000" },
      { label: "1000 sqm Plot", price: "₦65,000,000" },
    ],
    propertyTypes: ["Estate land"],
    investmentModels: ["full_purchase", "group_purchase", "tokenized"],
    priceValue: 22_750_000,
    expectedReturnPct: 22,
    fundingStatus: "available",
  },

  {
    id: "daverek-luxury-apartments-katampe",
    image: daverekLuxuryGallery[0] ?? heroImg,
    gallery: daverekLuxuryGallery,
    tag: "New",
    location: "Katampe, Abuja",
    title: "Daverek Luxury Apartments",
    tagline: "3-bedroom luxury apartments in Katampe",
    price: "₦130,000,000",
    priceNote: "per apartment",
    specs: [
      { icon: Bed, label: "3 Bedrooms" },
      { icon: Building2, label: "Luxury Apartments" },
      { icon: MapPin, label: "Katampe" },
    ],
    highlight:
      "Daverek Luxury Apartments brings 3-bedroom luxury living to Katampe — a separate development from Daverek Apartment in Mbora, available now at ₦130M.",
    features: ["3-Bedroom Luxury", "Katampe", "Available Now"],
    overview: [
      "Daverek Luxury Apartments is a 3-bedroom luxury apartment development in Katampe, one of Abuja's elevated, fast-appreciating districts bordering Maitama.",
      "Each apartment is finished to a luxury specification with generous living space — a distinct project from Daverek Apartment in Mbora.",
      "Units are available now at ₦130,000,000. Reserve below or speak to a Kay-Steph adviser to arrange an inspection.",
    ],
    units: [{ label: "3-Bedroom Luxury Apartment", price: "₦130,000,000" }],
    propertyTypes: ["Apartment"],
    investmentModels: ["full_purchase"],
    priceValue: 130_000_000,
    expectedReturnPct: 15,
    fundingStatus: "available",
  },

  // ----- Coming soon -------------------------------------------------------
  // No price, no units, priceValue 0: the listing page keeps these out of
  // price/return filters and shows them in their own section. Drop renders
  // into the matching src/assets/<slug>/ folder to replace the placeholder.
  {
    id: "daverek-apartment-mbora",
    image: daverekApartmentGallery[0] ?? heroImg,
    gallery: daverekApartmentGallery,
    tag: "Coming Soon",
    location: "Mbora, Abuja",
    title: "Daverek Apartment",
    tagline: "Modern apartments arriving in Mbora",
    price: "Coming soon",
    priceNote: "register your interest",
    specs: [
      { icon: Building2, label: "Apartments" },
      { icon: MapPin, label: "Mbora District" },
      { icon: Ruler, label: "Details TBA" },
    ],
    highlight:
      "A new Daverek apartment development in Mbora — unit types, finishes and pricing will be announced shortly. Register your interest to hear first.",
    features: ["New Development", "Mbora District", "Launching Soon"],
    overview: [
      "Daverek Apartment brings contemporary apartment living to Mbora, one of Abuja's fast-connecting districts along the Kubwa expressway corridor.",
      "Full specifications — unit mix, finishes, amenities and pricing — are being finalised and will be published here.",
      "Register your interest now and a Kay-Steph adviser will contact you with the launch details before public release.",
    ],
    units: [],
    propertyTypes: ["Apartment"],
    investmentModels: ["full_purchase"],
    priceValue: 0,
    expectedReturnPct: 0,
    fundingStatus: "coming_soon",
  },
  {
    id: "daverek-city-lifecamp",
    image: daverekCityGallery[0] ?? heroImg,
    gallery: daverekCityGallery,
    tag: "Coming Soon",
    location: "Life Camp, Abuja",
    title: "Daverek City",
    tagline: "A master-planned Daverek development in Life Camp",
    price: "Coming soon",
    priceNote: "register your interest",
    specs: [
      { icon: Building2, label: "Master-planned" },
      { icon: MapPin, label: "Life Camp" },
      { icon: Ruler, label: "Details TBA" },
    ],
    highlight:
      "Daverek City is a master-planned development coming to Life Camp — the unit mix and pricing will be announced shortly. Register your interest to hear first.",
    features: ["Master-planned", "Life Camp", "Launching Soon"],
    overview: [
      "Daverek City is a new master-planned development in Life Camp, one of Abuja's most sought-after professional neighbourhoods.",
      "The full unit mix — and whether homes will also be offered through group purchase or other investment routes — is being finalised and will be published here.",
      "Register your interest now and a Kay-Steph adviser will contact you with the launch details before public release.",
    ],
    units: [],
    propertyTypes: [],
    investmentModels: ["full_purchase"],
    priceValue: 0,
    expectedReturnPct: 0,
    fundingStatus: "coming_soon",
  },
];

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

const propertyTypeValues: PropertyType[] = [
  "Detached home",
  "Semi-detached home",
  "Apartment",
  "Terrace",
  "Estate land",
];
const investmentModelValues = Object.keys(INVESTMENT_MODEL_LABEL) as InvestmentModel[];
const fundingStatusValues = Object.keys(FUNDING_STATUS_LABEL) as FundingStatus[];

function catalogueSlug(row: CataloguePropertyRow, fallback?: Property): string {
  if (row.public_slug?.trim()) return row.public_slug.trim();
  if (fallback) return fallback.id;
  return row.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function catalogueUnits(value: unknown): PropertyUnit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((unit) => {
    if (!unit || typeof unit !== "object") return [];
    const label = "label" in unit && typeof unit.label === "string" ? unit.label.trim() : "";
    const price = "price" in unit && typeof unit.price === "string" ? unit.price.trim() : "";
    return label ? [{ label, price }] : [];
  });
}

function nairaLabel(value: number): string {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

function mapCatalogueRow(row: CataloguePropertyRow, fallback?: Property): Property {
  const gallery = (row.images ?? []).filter(Boolean);
  const units = catalogueUnits(row.public_units);
  const publicTypes = (row.public_property_types ?? []).filter((value): value is PropertyType =>
    propertyTypeValues.includes(value as PropertyType),
  );
  const models = (row.investment_models ?? []).filter((value): value is InvestmentModel =>
    investmentModelValues.includes(value as InvestmentModel),
  );
  const rowOverview = (row.overview ?? []).filter((paragraph) => paragraph.trim());
  const rowFeatures = (row.features ?? []).filter(Boolean);
  const fundingStatus = fundingStatusValues.includes(
    row.public_funding_status as FundingStatus,
  )
    ? (row.public_funding_status as FundingStatus)
    : row.status === "fully_funded"
      ? "fully_funded"
      : row.status === "under_review"
        ? "coming_soon"
        : "available";
  const fallbackOverview = fallback?.overview ?? [];
  const resolvedOverview = rowOverview.length
    ? rowOverview
    : row.description?.trim()
      ? [row.description.trim()]
      : fallbackOverview;
  const resolvedUnits = units.length ? units : (fallback?.units ?? []);
  const resolvedTypes = publicTypes.length ? publicTypes : (fallback?.propertyTypes ?? []);
  const resolvedModels = models.length ? models : (fallback?.investmentModels ?? ["full_purchase"]);
  const primaryType = resolvedTypes[0] ?? row.property_type ?? "Property";
  const priceValue = Number(row.initial_value ?? fallback?.priceValue ?? 0);
  const image = gallery[0] ?? fallback?.image ?? heroImg;

  return {
    id: catalogueSlug(row, fallback),
    image,
    gallery: gallery.length ? gallery : (fallback?.gallery ?? [image]),
    tag: row.public_tag?.trim() || fallback?.tag || FUNDING_STATUS_LABEL[fundingStatus],
    location: row.location || fallback?.location || "Abuja",
    title: row.name || fallback?.title || "Kay-Steph Property",
    tagline:
      row.tagline?.trim() ||
      fallback?.tagline ||
      row.description?.trim() ||
      `${primaryType} in ${row.location}`,
    price:
      row.price_label?.trim() ||
      (fundingStatus === "coming_soon" ? "Coming soon" : nairaLabel(priceValue)),
    priceNote:
      row.price_note?.trim() ||
      fallback?.priceNote ||
      (fundingStatus === "coming_soon" ? "register your interest" : "starting price"),
    specs:
      fallback?.specs ?? [
        { icon: Building2, label: primaryType },
        { icon: Ruler, label: resolvedUnits.length ? `${resolvedUnits.length} unit option${resolvedUnits.length === 1 ? "" : "s"}` : "Details available" },
        { icon: MapPin, label: row.location },
      ],
    highlight:
      row.highlight?.trim() ||
      fallback?.highlight ||
      row.description?.trim() ||
      `${row.name} is a Kay-Steph property opportunity in ${row.location}.`,
    features: rowFeatures.length ? rowFeatures : (fallback?.features ?? [primaryType, row.location]),
    overview: resolvedOverview,
    units: resolvedUnits,
    propertyTypes: resolvedTypes,
    investmentModels: resolvedModels,
    priceValue,
    expectedReturnPct:
      Number(row.expected_rental_yield ?? 0) + Number(row.expected_appreciation ?? 0),
    fundingStatus,
    showOnHome: row.show_on_home ?? fallback?.showOnHome ?? true,
    homeOrder: row.home_order ?? fallback?.homeOrder ?? 100,
  };
}

/**
 * Merge live admin-managed rows with the shipped catalogue. Matching records
 * replace their fallback; new records are added and hidden records are removed.
 */
export function mergeCatalogueProperties(rows: CataloguePropertyRow[] | null | undefined): Property[] {
  if (!rows?.length) return properties;
  const merged = [...properties];

  for (const row of rows) {
    const fallbackIndex = merged.findIndex(
      (property) =>
        property.id === row.public_slug ||
        property.title.trim().toLowerCase() === row.name.trim().toLowerCase(),
    );
    const fallback = fallbackIndex >= 0 ? merged[fallbackIndex] : undefined;
    if (fallbackIndex >= 0) merged.splice(fallbackIndex, 1);
    if (row.is_public !== false) merged.push(mapCatalogueRow(row, fallback));
  }

  return merged.sort(
    (a, b) =>
      (a.homeOrder ?? 100) - (b.homeOrder ?? 100) ||
      a.title.localeCompare(b.title),
  );
}

export function getCatalogueProperty(
  id: string,
  rows: CataloguePropertyRow[] | null | undefined,
): Property | undefined {
  return mergeCatalogueProperties(rows).find((property) => property.id === id);
}
