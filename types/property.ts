/** Shared property vocabulary (mirrors the planned Supabase enums). */
export const PROPERTY_TYPES = ["House", "Apartment", "Villa", "Commercial"] as const;
export const LISTING_TYPES = ["For Sale", "For Rent"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type ListingType = (typeof LISTING_TYPES)[number];

/** Card-level property data. Phase 6 will fill this from Supabase instead of demo data. */
export type PropertySummary = {
  id: string;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number; // PKR; monthly rent when listingType is "For Rent"
  city: string;
  location: string; // neighbourhood / society
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: "Marla" | "Kanal" | "sq ft";
  imageUrl?: string; // optional real image; a designed placeholder is used when absent
  imageAlt?: string;
};
