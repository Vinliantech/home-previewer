import type { LucideIcon } from "lucide-react";
import { Bed, Bath, Car, Ruler, Building2, MapPin } from "lucide-react";
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
  | "full_purchase"
  | "group_purchase"
  | "fractional"
  | "spv"
  | "tokenized";

export const INVESTMENT_MODEL_LABEL: Record<InvestmentModel, string> = {
  full_purchase: "Full purchase",
  group_purchase: "Group purchase",
  fractional: "Fractional ownership",
  spv: "SPV co-ownership",
  tokenized: "Tokenized units",
};

export type PropertyType = "Detached home" | "Apartment" | "Terrace" | "Estate land";

export type FundingStatus = "available" | "selling" | "funding_open" | "fully_funded";

export const FUNDING_STATUS_LABEL: Record<FundingStatus, string> = {
  available: "Available now",
  selling: "Selling",
  funding_open: "Funding open",
  fully_funded: "Fully funded",
};

export type PropertyUnit = { label: string; price: string };

export type Property = {
  id: string;
  image: string;
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
  propertyType: PropertyType;
  investmentModels: InvestmentModel[];
  /** Lowest entry price in naira, used for filtering and sorting. */
  priceValue: number;
  /** Indicative projected total annual return (rental yield + appreciation), %. */
  expectedReturnPct: number;
  fundingStatus: FundingStatus;
};

export const properties: Property[] = [
  {
    id: "guzape-dream-homes",
    image: guzapeImg,
    tag: "Signature",
    location: "Guzape, Abuja",
    title: "Guzape Dream Homes",
    tagline: "Five signature residences on Kay-Steph's home street",
    price: "₦500,000,000",
    priceNote: "per unit",
    specs: [
      { icon: Ruler, label: "5 units" },
      { icon: Bed, label: "5 Bedrooms" },
      { icon: Car, label: "Private compound" },
    ],
    highlight:
      "A five-unit collection of fully detached residences on Kenneth Minimah Crescent — the same premium street where our HQ lives.",
    features: ["Fully Detached", "5 Units Available", "Prime Guzape Address"],
    overview: [
      "Five fully-detached residences on Kenneth Minimah Crescent, Guzape — the same premium street where Kay-Steph is headquartered.",
      "Each home is designed for a principal family: expansive living, private compound, dedicated staff quarters and a driveway that comfortably holds multiple vehicles.",
      "Guzape has become one of Abuja's fastest-appreciating districts, with proximity to Asokoro, Maitama and the diplomatic zone.",
    ],
    units: [{ label: "5-Bedroom Fully Detached Residence", price: "₦500,000,000" }],
    propertyType: "Detached home",
    investmentModels: ["full_purchase", "group_purchase", "spv"],
    priceValue: 500_000_000,
    expectedReturnPct: 18,
    fundingStatus: "available",
  },
  {
    id: "rubys-apartment-jahi",
    image: rubysImg,
    tag: "Available",
    location: "Jahi, Abuja",
    title: "Ruby's Apartment",
    tagline: "Modern city apartments in Jahi",
    price: "₦160M / ₦140M",
    priceNote: "top / lower floor",
    specs: [
      { icon: Bed, label: "3 Bedrooms" },
      { icon: Bath, label: "En-suite" },
      { icon: Building2, label: "Serviced" },
    ],
    highlight:
      "Sun-lit apartments with premium finishes, balconies and secure parking — priced for the top and lower floors respectively.",
    features: ["Serviced", "Balcony Views", "24/7 Security"],
    overview: [
      "Contemporary serviced apartments in Jahi — one of Abuja's most connected residential districts, minutes from Jabi Lake and the airport road.",
      "Every unit features open-plan living, en-suite bedrooms, a private balcony, secure covered parking and 24/7 estate management.",
      "Two price tiers are available depending on floor selection — ideal for professionals, expatriates and yield-focused investors.",
    ],
    units: [
      { label: "3-Bedroom Apartment · Top Floor", price: "₦160,000,000" },
      { label: "3-Bedroom Apartment · Lower Floor", price: "₦140,000,000" },
    ],
    propertyType: "Apartment",
    investmentModels: ["full_purchase", "fractional", "spv", "tokenized"],
    priceValue: 140_000_000,
    expectedReturnPct: 15,
    fundingStatus: "funding_open",
  },
  {
    id: "lillycrest-terrace-lifecamp",
    image: terraceImg,
    tag: "Selling",
    location: "Life Camp, Abuja",
    title: "Lillycrest Terrace",
    tagline: "Contemporary terraces in Life Camp",
    price: "₦250,000,000",
    priceNote: "per terrace",
    specs: [
      { icon: Bed, label: "4 Bedrooms" },
      { icon: Bath, label: "All en-suite" },
      { icon: Car, label: "Private garage" },
    ],
    highlight:
      "A boutique cluster of tall, light-filled terraces — designed for professional households who want a lock-and-leave city home.",
    features: ["Terrace", "Smart Layout", "Life Camp"],
    overview: [
      "A boutique cluster of four-bedroom terraces in Life Camp, one of Abuja's most sought-after professional neighbourhoods.",
      "Tall ceilings, floor-to-ceiling glazing, en-suite bedrooms across all floors, private garage and a compact but well-planned rear yard.",
      "Perfect for professional households who want the lock-and-leave convenience of a terrace with the privacy of a detached home.",
    ],
    units: [{ label: "4-Bedroom Terrace", price: "₦250,000,000" }],
    propertyType: "Terrace",
    investmentModels: ["full_purchase", "group_purchase", "fractional"],
    priceValue: 250_000_000,
    expectedReturnPct: 16,
    fundingStatus: "selling",
  },
  {
    id: "lillycrest-residence-karsana",
    image: residenceImg,
    tag: "Multiple Units",
    location: "Karsana, Abuja",
    title: "Lillycrest Residence",
    tagline: "4-bedroom detached homes with BQ",
    price: "₦210M / ₦180M / ₦155M / ₦90M",
    priceNote: "unit tiers",
    specs: [
      { icon: Bed, label: "4 Bedrooms + BQ" },
      { icon: Bath, label: "En-suite" },
      { icon: Car, label: "2-car garage" },
    ],
    highlight:
      "A tiered collection of detached family residences with boys' quarters — priced from ₦90M through ₦210M so families can enter at the right level.",
    features: ["Detached", "Boys' Quarter", "Tiered Pricing"],
    overview: [
      "A tiered collection of four-bedroom detached residences with boys' quarters in Karsana — a rapidly developing corridor with strong long-term appreciation.",
      "Four price tiers make Lillycrest Residence accessible to a wide range of families, from first-time detached-home buyers to established households upgrading in-district.",
      "Each unit sits on a generous plot with a private compound, dedicated parking and full staff quarters.",
    ],
    units: [
      { label: "4-Bedroom Detached + BQ · Type A", price: "₦210,000,000" },
      { label: "4-Bedroom Detached + BQ · Type B", price: "₦180,000,000" },
      { label: "4-Bedroom Detached + BQ · Type C", price: "₦155,000,000" },
      { label: "4-Bedroom Detached + BQ · Type D", price: "₦90,000,000" },
    ],
    propertyType: "Detached home",
    investmentModels: ["full_purchase", "group_purchase", "spv"],
    priceValue: 90_000_000,
    expectedReturnPct: 17,
    fundingStatus: "selling",
  },
  {
    id: "estate-plots-phase-ii",
    image: plotsImg,
    tag: "Land",
    location: "Behind Abacha Barracks — Phase II",
    title: "Estate Plots — Phase II",
    tagline: "Surveyed estate land, ready to build",
    price: "₦65,000",
    priceNote: "per sqm",
    specs: [
      { icon: Ruler, label: "Estate plots" },
      { icon: MapPin, label: "Phase II" },
      { icon: Building2, label: "Secure title" },
    ],
    highlight:
      "Fully surveyed estate parcels behind Abacha Barracks — a rare land-banking opportunity in a rapidly appreciating corridor.",
    features: ["Secure Title", "Flexible Sizing", "High Appreciation"],
    overview: [
      "Fully surveyed estate parcels located behind Abacha Barracks — one of the FCT's most secure and rapidly appreciating corridors.",
      "Phase II is available now at ₦65,000 per square metre, with flexible plot sizing to suit personal builds, small developers and land-bankers.",
      "Every plot comes with verified title documentation and estate-level infrastructure planning.",
    ],
    units: [{ label: "Estate Plot · Phase II", price: "₦65,000 / sqm" }],
    propertyType: "Estate land",
    investmentModels: ["full_purchase", "group_purchase", "tokenized"],
    priceValue: 32_500_000,
    expectedReturnPct: 22,
    fundingStatus: "available",
  },
];

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}
