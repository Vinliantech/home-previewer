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
  },
];
