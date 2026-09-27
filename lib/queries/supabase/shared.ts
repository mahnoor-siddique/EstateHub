import type { PostgrestError } from "@supabase/supabase-js";
import type { TableRow } from "@/types/database";
import type { Agent } from "@/types/agent";
import type { Amenity, PropertyDetail, PropertyPhoto, PropertySummary } from "@/types/property";

/*
 * Shared pieces of the Supabase query layer: the columns each query selects, row → app-type mappers
 * (so components keep using the existing camelCase types) and one error type for failed queries.
 */

/** Thrown when Supabase returns an error. The message names the failed action; the original
 *  PostgrestError (code, details) is kept as `cause` for server logs. */
export class DataAccessError extends Error {
  readonly code: string;

  constructor(action: string, error: PostgrestError) {
    super(`Could not ${action}: ${error.message}`, { cause: error });
    this.name = "DataAccessError";
    this.code = error.code;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids are uuids in the database. Checking first turns a malformed id (e.g. an old demo slug) into a
 *  clean "not found" instead of a Postgres "invalid input syntax for type uuid" error. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Database column behind each amenity. Typed as a full Record so adding an amenity to AMENITIES
 *  without a column is a compile error. */
export const AMENITY_COLUMNS = {
  Parking: "has_parking",
  Garden: "has_garden",
  "Swimming Pool": "has_swimming_pool",
  Security: "has_security",
  Gym: "has_gym",
  Furnished: "is_furnished",
  "Air Conditioning": "has_air_conditioning",
  "Backup Power": "has_backup_power",
} as const satisfies Record<Amenity, keyof TableRow<"properties">>;

// Select lists. Kept as literal strings so supabase-js can infer the result types from them.
export const IMAGE_COLUMNS = "image_url, alt_text, label, sort_order";

const PROPERTY_CORE_COLUMNS = "id, title, property_type, listing_type, price, city, area_location";
const PROPERTY_SIZE_COLUMNS = "bedrooms, bathrooms, area, area_unit, created_at";
const PROPERTY_AMENITY_COLUMNS =
  "has_parking, has_garden, has_swimming_pool, has_security, has_gym, is_furnished, has_air_conditioning, has_backup_power";

export const PROPERTY_SUMMARY_COLUMNS = `${PROPERTY_CORE_COLUMNS}, ${PROPERTY_SIZE_COLUMNS}, ${PROPERTY_AMENITY_COLUMNS}`;

export const PROPERTY_DETAIL_COLUMNS = `${PROPERTY_SUMMARY_COLUMNS}, description, year_built, parking_spaces, agent_id`;

export const AGENT_COLUMNS = "id, full_name, title, bio, agency_name, profile_image";

type ImageRow = Pick<TableRow<"property_images">, "image_url" | "alt_text" | "label" | "sort_order">;
type AmenityColumn = (typeof AMENITY_COLUMNS)[Amenity];

type PropertySummaryRow = Pick<
  TableRow<"properties">,
  | "id"
  | "title"
  | "property_type"
  | "listing_type"
  | "price"
  | "city"
  | "area_location"
  | "bedrooms"
  | "bathrooms"
  | "area"
  | "area_unit"
  | "created_at"
  | AmenityColumn
> & { property_images: ImageRow[] };

type PropertyDetailRow = PropertySummaryRow &
  Pick<TableRow<"properties">, "description" | "year_built" | "parking_spaces" | "agent_id">;

export type AgentRow = Pick<
  TableRow<"agents">,
  "id" | "full_name" | "title" | "bio" | "agency_name" | "profile_image"
>;

export function toPropertyPhoto(row: ImageRow): PropertyPhoto {
  return { src: row.image_url, alt: row.alt_text, label: row.label ?? "" };
}

export function toPropertySummary(row: PropertySummaryRow): PropertySummary {
  const amenities = (Object.keys(AMENITY_COLUMNS) as Amenity[]).filter(
    (amenity) => row[AMENITY_COLUMNS[amenity]],
  );
  // Images are embedded already ordered; sorting again keeps the mapper correct on its own.
  const images = [...row.property_images].sort((a, b) => a.sort_order - b.sort_order).map(toPropertyPhoto);

  return {
    id: row.id,
    title: row.title,
    propertyType: row.property_type,
    listingType: row.listing_type,
    price: Number(row.price),
    city: row.city,
    location: row.area_location,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: Number(row.area),
    areaUnit: row.area_unit,
    amenities,
    // The UI expects a calendar date (YYYY-MM-DD); timestamps come back from Supabase in UTC.
    listedAt: row.created_at.slice(0, 10),
    images,
  };
}

export function toPropertyDetail(row: PropertyDetailRow): PropertyDetail {
  return {
    ...toPropertySummary(row),
    description: row.description ?? "",
    yearBuilt: row.year_built ?? undefined,
    parkingSpaces: row.parking_spaces,
    agentId: row.agent_id,
  };
}

export function toAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    fullName: row.full_name,
    agencyName: row.agency_name ?? "",
    title: row.title ?? "",
    bio: row.bio ?? "",
    profileImage: row.profile_image ?? undefined,
  };
}
