import type { PropertySummary } from "@/types/property";

/*
 * TEMPORARY demonstration data for the Phase 2 homepage.
 * These are fictional listings, not real properties. Phase 6 replaces them with Supabase data.
 */

export const DEMO_PROPERTIES: PropertySummary[] = [
  {
    id: "demo-dha-lahore-villa",
    title: "Modern Villa with Landscaped Garden",
    propertyType: "Villa",
    listingType: "For Sale",
    price: 185_000_000,
    city: "Lahore",
    location: "DHA Phase 6",
    bedrooms: 5,
    bathrooms: 6,
    area: 1,
    areaUnit: "Kanal",
  },
  {
    id: "demo-clifton-apartment",
    title: "Sea-Facing Luxury Apartment",
    propertyType: "Apartment",
    listingType: "For Rent",
    price: 280_000,
    city: "Karachi",
    location: "Clifton Block 5",
    bedrooms: 3,
    bathrooms: 3,
    area: 2100,
    areaUnit: "sq ft",
  },
  {
    id: "demo-bahria-rawalpindi-house",
    title: "Contemporary Family Home",
    propertyType: "House",
    listingType: "For Sale",
    price: 95_000_000,
    city: "Rawalpindi",
    location: "Bahria Town Phase 8",
    bedrooms: 4,
    bathrooms: 5,
    area: 10,
    areaUnit: "Marla",
  },
  {
    id: "demo-dha-islamabad-house",
    title: "Executive Residence near the Hills",
    propertyType: "House",
    listingType: "For Sale",
    price: 210_000_000,
    city: "Islamabad",
    location: "DHA Phase 2",
    bedrooms: 6,
    bathrooms: 7,
    area: 1,
    areaUnit: "Kanal",
  },
  {
    id: "demo-gulberg-penthouse",
    title: "Skyline Penthouse with Terrace",
    propertyType: "Apartment",
    listingType: "For Sale",
    price: 68_000_000,
    city: "Lahore",
    location: "Gulberg III",
    bedrooms: 3,
    bathrooms: 4,
    area: 2800,
    areaUnit: "sq ft",
  },
  {
    id: "demo-citi-faisalabad-house",
    title: "Bright Corner House, Ready to Move",
    propertyType: "House",
    listingType: "For Rent",
    price: 150_000,
    city: "Faisalabad",
    location: "Citi Housing",
    bedrooms: 4,
    bathrooms: 4,
    area: 10,
    areaUnit: "Marla",
  },
];

/** Demonstration listing counts for the Popular Cities cards (not real inventory). */
export const DEMO_CITY_COUNTS: Record<string, number> = {
  Lahore: 340,
  Islamabad: 260,
  Karachi: 310,
  Rawalpindi: 120,
  Faisalabad: 85,
  Multan: 70,
};

export const DEMO_STATS = [
  { value: "1,200+", label: "Properties" },
  { value: "350+", label: "Trusted Agents" },
  { value: "15+", label: "Cities" },
  { value: "98%", label: "Client Satisfaction" },
] as const;
