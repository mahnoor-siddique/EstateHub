import { DEMO_PROPERTIES } from "@/lib/data/demo";
import type { PropertyFilters, SortOption } from "@/lib/utils/property-filters";
import type { PropertySummary } from "@/types/property";

/*
 * Property data access. It filters the local demo listings for now. Phase 6 replaces the body of
 * getProperties with a Supabase query using the same filters, so pages and components stay unchanged.
 */

function matches(property: PropertySummary, filters: PropertyFilters): boolean {
  const { city, propertyType, listingType, minPrice, maxPrice, bedrooms, bathrooms, amenities } = filters;
  if (city && property.city !== city) return false;
  if (propertyType && property.propertyType !== propertyType) return false;
  if (listingType && property.listingType !== listingType) return false;
  if (minPrice !== undefined && property.price < minPrice) return false;
  if (maxPrice !== undefined && property.price > maxPrice) return false;
  if (bedrooms && property.bedrooms < bedrooms) return false;
  if (bathrooms && property.bathrooms < bathrooms) return false;
  return amenities.every((amenity) => property.amenities.includes(amenity));
}

const COMPARATORS: Record<SortOption, (a: PropertySummary, b: PropertySummary) => number> = {
  newest: (a, b) => b.listedAt.localeCompare(a.listedAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

export type PropertyResults = {
  properties: PropertySummary[];
  /** Total listings before filtering, for "Showing X of Y". */
  total: number;
};

export async function getProperties(filters: PropertyFilters): Promise<PropertyResults> {
  const properties = DEMO_PROPERTIES.filter((p) => matches(p, filters)).sort(
    (a, b) => COMPARATORS[filters.sort](a, b) || a.id.localeCompare(b.id), // stable tie-break
  );
  return { properties, total: DEMO_PROPERTIES.length };
}
