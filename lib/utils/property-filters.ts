import { CITIES } from "@/lib/site";
import { PROPERTY_TYPES } from "@/types/property";

/*
 * URL search-param vocabulary for the property listings. The homepage search form and the
 * /properties filter bar both submit these names, so a search from either lands on the same URL.
 *
 * Chunk 3A only reads them back to pre-fill the filter bar. Applying them to the results is a
 * later Phase 3 chunk.
 */

export const LISTING_PARAM_OPTIONS = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
] as const;

export type PropertyFilterValues = {
  city: string;
  type: string;
  listing: string;
  minPrice: string;
  maxPrice: string;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Keeps a value only if it is one of the allowed options (case-insensitive), normalised to its canonical form. */
function oneOf(value: string, allowed: readonly string[]): string {
  return allowed.find((option) => option.toLowerCase() === value.toLowerCase()) ?? "";
}

function wholeNumber(value: string): string {
  return /^\d{1,12}$/.test(value) ? String(Number(value)) : "";
}

/** Reads and sanitises the filter params. Unknown or malformed values fall back to "" (no filter). */
export function readFilterValues(params: RawSearchParams): PropertyFilterValues {
  return {
    city: oneOf(first(params.city), CITIES),
    type: oneOf(first(params.type), PROPERTY_TYPES),
    listing: oneOf(first(params.listing), LISTING_PARAM_OPTIONS.map((o) => o.value)),
    minPrice: wholeNumber(first(params.minPrice)),
    maxPrice: wholeNumber(first(params.maxPrice)),
  };
}

export function hasActiveFilters(values: PropertyFilterValues): boolean {
  return Object.values(values).some(Boolean);
}
