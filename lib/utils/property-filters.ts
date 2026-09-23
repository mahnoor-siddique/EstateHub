import { CITIES } from "@/lib/site";
import {
  AMENITIES,
  LISTING_TYPES,
  PROPERTY_TYPES,
  type Amenity,
  type ListingType,
  type PropertyType,
} from "@/types/property";

/*
 * URL search params are the single source of truth for the /properties filters and sort order.
 * The homepage search, the Popular Cities links and the /properties filter bar all use these names:
 *
 *   city=Lahore  propertyType=House  listingType=For Rent  minPrice=5000000  maxPrice=90000000
 *   bedrooms=3   bathrooms=2         amenities=Parking&amenities=Garden     sort=price-asc
 *
 * Anything unknown or malformed is ignored rather than causing an error.
 */

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortOption = "newest";

/** "N or more" choices for the bedrooms / bathrooms selects. */
export const ROOM_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;

export type PropertyFilters = {
  city?: (typeof CITIES)[number];
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number; // minimum
  bathrooms?: number; // minimum
  amenities: Amenity[]; // a listing must have every selected amenity
  sort: SortOption;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function all(value: string | string[] | undefined): string[] {
  return (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((v) => v.trim());
}

function first(value: string | string[] | undefined): string {
  return all(value)[0] ?? "";
}

/** Matches one of the allowed options case-insensitively and returns its canonical spelling. */
function oneOf<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  const lower = value.toLowerCase();
  return allowed.find((option) => option.toLowerCase() === lower);
}

function wholeNumber(value: string, max = 1e12): number | undefined {
  if (!/^\d{1,13}$/.test(value)) return undefined;
  const n = Number(value);
  return n <= max ? n : undefined;
}

export function parsePropertyFilters(params: RawSearchParams): PropertyFilters {
  const amenities = all(params.amenities)
    .map((a) => oneOf(a, AMENITIES))
    .filter((a): a is Amenity => a !== undefined);

  return {
    city: oneOf(first(params.city), CITIES),
    propertyType: oneOf(first(params.propertyType), PROPERTY_TYPES),
    listingType: oneOf(first(params.listingType), LISTING_TYPES),
    minPrice: wholeNumber(first(params.minPrice)),
    maxPrice: wholeNumber(first(params.maxPrice)),
    bedrooms: wholeNumber(first(params.bedrooms), 20),
    bathrooms: wholeNumber(first(params.bathrooms), 20),
    amenities: [...new Set(amenities)],
    sort: oneOf(first(params.sort), SORT_OPTIONS.map((o) => o.value)) ?? DEFAULT_SORT,
  };
}

/** Number of active filters (sort order is not a filter). */
export function countActiveFilters(filters: PropertyFilters): number {
  const { city, propertyType, listingType, minPrice, maxPrice, bedrooms, bathrooms, amenities } = filters;
  const single = [city, propertyType, listingType, minPrice, maxPrice, bedrooms, bathrooms];
  return single.filter((v) => v !== undefined && v !== 0).length + amenities.length;
}

/** Serialises filters back to a query string, omitting empty values and the default sort. */
export function toSearchParams(filters: Partial<PropertyFilters>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === "sort" && value === DEFAULT_SORT) continue;
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== undefined) params.append(key, String(v));
    }
  }
  return params;
}

/** /properties link that clears every filter but keeps the chosen sort order. */
export function clearFiltersHref(filters: PropertyFilters): string {
  const query = toSearchParams({ sort: filters.sort }).toString();
  return query ? `/properties?${query}` : "/properties";
}
