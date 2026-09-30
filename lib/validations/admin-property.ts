import { isUuid } from "@/lib/queries/supabase/shared";
import { CITIES } from "@/lib/site";
import type { Database, TableRow } from "@/types/database";
import { LISTING_TYPES, PROPERTY_TYPES } from "@/types/property";

/*
 * Validation for the admin property form. The Server Action always runs it; the browser's
 * required/min/max attributes are only a convenience. Limits mirror the properties table checks
 * (supabase/migrations/20260927000000_initial_schema.sql), so a valid form never trips a
 * database constraint.
 */

type Enums = Database["public"]["Enums"];

export const PROPERTY_STATUSES = ["available", "pending", "sold", "rented"] as const satisfies readonly Enums["property_status"][];
export const AREA_UNITS = ["Marla", "Kanal", "sq ft"] as const satisfies readonly Enums["area_unit"][];

export const PROPERTY_STATUS_LABELS: Record<Enums["property_status"], string> = {
  available: "Available",
  pending: "Pending",
  sold: "Sold",
  rented: "Rented",
};

/** Amenity checkboxes: form field name = database column. */
export const AMENITY_FIELDS = [
  { name: "has_parking", label: "Parking" },
  { name: "has_garden", label: "Garden" },
  { name: "has_swimming_pool", label: "Swimming pool" },
  { name: "has_security", label: "Security" },
  { name: "has_gym", label: "Gym" },
  { name: "is_furnished", label: "Furnished" },
  { name: "has_air_conditioning", label: "Air conditioning" },
  { name: "has_backup_power", label: "Backup power" },
] as const satisfies readonly { name: keyof TableRow<"properties">; label: string }[];

export const TITLE_MAX = 160;
export const DESCRIPTION_MAX = 5000;
export const LOCATION_MAX = 120;
export const ADDRESS_MAX = 255;
export const PRICE_MAX = 9_999_999_999_999; // numeric(15, 2), whole rupees
export const AREA_MAX = 99_999_999; // numeric(10, 2)
export const ROOMS_MAX = 50;
export const PARKING_MAX = 50;
export const YEAR_MIN = 1800;

export type PropertyField =
  | "title"
  | "description"
  | "property_type"
  | "listing_type"
  | "price"
  | "city"
  | "area_location"
  | "address"
  | "bedrooms"
  | "bathrooms"
  | "area"
  | "area_unit"
  | "year_built"
  | "parking_spaces"
  | "status"
  | "agent_id";

/** The columns the admin form writes, exactly as the database takes them. */
export type PropertyWrite = Pick<
  TableRow<"properties">,
  | PropertyField
  | (typeof AMENITY_FIELDS)[number]["name"]
>;

type Result =
  | { ok: true; data: PropertyWrite }
  | { ok: false; fieldErrors: Partial<Record<PropertyField, string>> };

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function oneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

/** Whole number in [min, max], or an error message. Accepts "1,500" for readability. */
function wholeNumber(raw: string, min: number, max: number): number | null {
  const cleaned = raw.replace(/,/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value >= min && value <= max ? value : null;
}

export function validateProperty(formData: FormData, now: Date = new Date()): Result {
  const title = text(formData, "title").replace(/\s+/g, " ");
  const description = text(formData, "description");
  const propertyType = text(formData, "property_type");
  const listingType = text(formData, "listing_type");
  const priceRaw = text(formData, "price");
  const city = text(formData, "city");
  const areaLocation = text(formData, "area_location").replace(/\s+/g, " ");
  const address = text(formData, "address").replace(/\s+/g, " ");
  const bedroomsRaw = text(formData, "bedrooms");
  const bathroomsRaw = text(formData, "bathrooms");
  const areaRaw = text(formData, "area").replace(/,/g, "");
  const areaUnit = text(formData, "area_unit");
  const yearRaw = text(formData, "year_built");
  const parkingRaw = text(formData, "parking_spaces");
  const status = text(formData, "status");
  const agentId = text(formData, "agent_id");

  const fieldErrors: Partial<Record<PropertyField, string>> = {};
  const maxYear = now.getUTCFullYear() + 5;

  if (!title) fieldErrors.title = "Enter a title.";
  else if (title.length > TITLE_MAX) fieldErrors.title = `Keep the title under ${TITLE_MAX} characters.`;

  if (description.length > DESCRIPTION_MAX)
    fieldErrors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;

  if (!oneOf(PROPERTY_TYPES, propertyType)) fieldErrors.property_type = "Choose a property type.";
  if (!oneOf(LISTING_TYPES, listingType)) fieldErrors.listing_type = "Choose For Sale or For Rent.";

  const price = wholeNumber(priceRaw, 0, PRICE_MAX);
  if (!priceRaw) fieldErrors.price = "Enter the price in PKR.";
  else if (price === null) fieldErrors.price = "Enter the price as a whole number of rupees, e.g. 45000000.";

  if (!oneOf(CITIES, city)) fieldErrors.city = "Choose a city.";

  if (!areaLocation) fieldErrors.area_location = "Enter the area or society, e.g. DHA Phase 6.";
  else if (areaLocation.length > LOCATION_MAX)
    fieldErrors.area_location = `Keep this under ${LOCATION_MAX} characters.`;

  if (address.length > ADDRESS_MAX) fieldErrors.address = `Keep the address under ${ADDRESS_MAX} characters.`;

  const bedrooms = wholeNumber(bedroomsRaw || "0", 0, ROOMS_MAX);
  if (bedrooms === null) fieldErrors.bedrooms = `Enter a whole number from 0 to ${ROOMS_MAX}.`;
  const bathrooms = wholeNumber(bathroomsRaw || "0", 0, ROOMS_MAX);
  if (bathrooms === null) fieldErrors.bathrooms = `Enter a whole number from 0 to ${ROOMS_MAX}.`;

  // Up to two decimal places, above zero (e.g. 10, 1.5 Kanal, 2250 sq ft).
  const area = /^\d+(\.\d{1,2})?$/.test(areaRaw) ? Number(areaRaw) : NaN;
  if (!areaRaw) fieldErrors.area = "Enter the size.";
  else if (!(area > 0 && area <= AREA_MAX)) fieldErrors.area = "Enter a size above 0, with at most 2 decimals.";

  if (!oneOf(AREA_UNITS, areaUnit)) fieldErrors.area_unit = "Choose a unit.";

  const yearBuilt = yearRaw ? wholeNumber(yearRaw, YEAR_MIN, maxYear) : null;
  if (yearRaw && yearBuilt === null) fieldErrors.year_built = `Enter a year from ${YEAR_MIN} to ${maxYear}, or leave it empty.`;

  const parkingSpaces = wholeNumber(parkingRaw || "0", 0, PARKING_MAX);
  if (parkingSpaces === null) fieldErrors.parking_spaces = `Enter a whole number from 0 to ${PARKING_MAX}.`;

  if (!oneOf(PROPERTY_STATUSES, status)) fieldErrors.status = "Choose a status.";

  // Existence is checked against the database by the Server Action; this only rejects junk.
  if (!isUuid(agentId)) fieldErrors.agent_id = "Choose the agent handling this property.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const amenities = Object.fromEntries(
    AMENITY_FIELDS.map(({ name }) => [name, formData.get(name) === "on"]),
  ) as Record<(typeof AMENITY_FIELDS)[number]["name"], boolean>;

  return {
    ok: true,
    data: {
      title,
      description: description || null,
      property_type: propertyType as Enums["property_type"],
      listing_type: listingType as Enums["listing_type"],
      price: price!,
      city,
      area_location: areaLocation,
      address: address || null,
      bedrooms: bedrooms!,
      bathrooms: bathrooms!,
      area,
      area_unit: areaUnit as Enums["area_unit"],
      year_built: yearBuilt,
      parking_spaces: parkingSpaces!,
      status: status as Enums["property_status"],
      agent_id: agentId,
      ...amenities,
    },
  };
}

/** For the quick status change on the properties list. */
export function parseStatus(value: FormDataEntryValue | null): Enums["property_status"] | null {
  return typeof value === "string" && oneOf(PROPERTY_STATUSES, value) ? value : null;
}
