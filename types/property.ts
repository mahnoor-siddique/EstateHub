/** Shared property vocabulary (mirrors the planned Supabase enums). */
export const PROPERTY_TYPES = ["House", "Apartment", "Villa", "Commercial"] as const;
export const LISTING_TYPES = ["For Sale", "For Rent"] as const;

/** Amenities a listing can offer. Kept short and concrete so filtering stays meaningful. */
export const AMENITIES = [
  "Parking",
  "Garden",
  "Swimming Pool",
  "Security",
  "Gym",
  "Furnished",
  "Air Conditioning",
  "Backup Power",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type ListingType = (typeof LISTING_TYPES)[number];
export type Amenity = (typeof AMENITIES)[number];

/** One listing photo. `src` is a path under /public for now; Phase 9 moves photos to storage. */
export type PropertyPhoto = {
  src: string;
  alt: string; // describes what is in the photo, for screen readers
  label: string; // short caption, e.g. "Kitchen"
};

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
  amenities: Amenity[];
  listedAt: string; // ISO date the listing went live; drives "Newest" sorting
  /** Ordered photos (mirrors the planned property_images table). The first one is the cover used on
   *  cards. When empty or absent, the designed placeholder for the property type is shown instead. */
  images?: PropertyPhoto[];
};

/** Full listing data for the details page. Mirrors the planned Supabase `properties` columns. */
export type PropertyDetail = PropertySummary & {
  description: string;
  yearBuilt?: number;
  parkingSpaces: number;
  agentId: string;
};
