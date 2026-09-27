import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import {
  AMENITY_COLUMNS,
  DataAccessError,
  IMAGE_COLUMNS,
  PROPERTY_DETAIL_COLUMNS,
  PROPERTY_SUMMARY_COLUMNS,
  isUuid,
  toPropertyDetail,
  toPropertySummary,
} from "@/lib/queries/supabase/shared";
import type { PropertyResults } from "@/lib/queries/properties";
import type { PropertyFilters } from "@/lib/utils/property-filters";
import type { PropertyDetail } from "@/types/property";

/*
 * Supabase versions of the property queries in lib/queries/properties.ts, with the same names and
 * signatures, so switching a page over is a one-line import change. Filtering and sorting happen in
 * Postgres. All reads use the public (anonymous) client, so RLS applies.
 */

export { getAgentById } from "@/lib/queries/supabase/agents";

/** Listings matching the /properties filters, sorted, plus the unfiltered total for "Showing X of Y".
 *  Only the cover photo is fetched per listing, since cards show nothing else. */
export async function getProperties(filters: PropertyFilters): Promise<PropertyResults> {
  const supabase = createPublicClient();
  const { city, propertyType, listingType, minPrice, maxPrice, bedrooms, bathrooms, amenities, sort } =
    filters;

  let query = supabase
    .from("properties")
    .select(`${PROPERTY_SUMMARY_COLUMNS}, property_images(${IMAGE_COLUMNS})`)
    .order("sort_order", { referencedTable: "property_images" })
    .limit(1, { referencedTable: "property_images" });

  if (city) query = query.eq("city", city);
  if (propertyType) query = query.eq("property_type", propertyType);
  if (listingType) query = query.eq("listing_type", listingType);
  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);
  if (bedrooms) query = query.gte("bedrooms", bedrooms);
  if (bathrooms) query = query.gte("bathrooms", bathrooms);
  for (const amenity of amenities) query = query.eq(AMENITY_COLUMNS[amenity], true);

  query =
    sort === "newest"
      ? query.order("created_at", { ascending: false })
      : query.order("price", { ascending: sort === "price-asc" });
  query = query.order("id"); // stable tie-break, as in the demo version

  const [listings, total] = await Promise.all([
    query,
    supabase.from("properties").select("id", { count: "exact", head: true }),
  ]);

  if (listings.error) throw new DataAccessError("load properties", listings.error);
  if (total.error) throw new DataAccessError("count properties", total.error);

  return { properties: listings.data.map(toPropertySummary), total: total.count ?? 0 };
}

/** A single listing with all its photos in gallery order, or null when it does not exist. */
export async function getPropertyById(id: string): Promise<PropertyDetail | null> {
  if (!isUuid(id)) return null;

  const { data, error } = await createPublicClient()
    .from("properties")
    .select(`${PROPERTY_DETAIL_COLUMNS}, property_images(${IMAGE_COLUMNS})`)
    .eq("id", id)
    .order("sort_order", { referencedTable: "property_images" })
    .maybeSingle();

  if (error) throw new DataAccessError("load property", error);
  return data ? toPropertyDetail(data) : null;
}

/** Ids of every listing, used to pre-render the details pages at build time. */
export async function getPropertyIds(): Promise<string[]> {
  const { data, error } = await createPublicClient().from("properties").select("id");

  if (error) throw new DataAccessError("load property ids", error);
  return data.map((row) => row.id);
}
