import { createPublicClient } from "@/lib/supabase/public";
import {
  DataAccessError,
  IMAGE_COLUMNS,
  PROPERTY_SUMMARY_COLUMNS,
  isUuid,
  toPropertySummary,
} from "@/lib/queries/supabase/shared";
import type { BookableProperty } from "@/types/booking";

/**
 * The listing a viewing is being requested for, or null if the id is malformed or unknown.
 * Listings are public, so the cookie-free client is enough. `available` mirrors the rule the
 * database enforces on insert (only 'available' listings accept viewing requests).
 */
export async function getBookableProperty(id: string): Promise<BookableProperty | null> {
  if (!isUuid(id)) return null;

  const { data, error } = await createPublicClient()
    .from("properties")
    .select(`${PROPERTY_SUMMARY_COLUMNS}, status, property_images(${IMAGE_COLUMNS})`)
    .eq("id", id)
    .order("sort_order", { referencedTable: "property_images" })
    .maybeSingle();

  if (error) throw new DataAccessError("load property for booking", error);
  return data ? { ...toPropertySummary(data), available: data.status === "available" } : null;
}
