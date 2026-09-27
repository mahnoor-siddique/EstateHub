import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { DataAccessError, IMAGE_COLUMNS, isUuid, toPropertyPhoto } from "@/lib/queries/supabase/shared";
import type { PropertyPhoto } from "@/types/property";

/** Every photo for one property in gallery order. Empty when the property has none or the id is
 *  not a valid uuid. */
export async function getPropertyImages(propertyId: string): Promise<PropertyPhoto[]> {
  if (!isUuid(propertyId)) return [];

  const { data, error } = await createPublicClient()
    .from("property_images")
    .select(IMAGE_COLUMNS)
    .eq("property_id", propertyId)
    .order("sort_order");

  if (error) throw new DataAccessError("load property images", error);
  return data.map(toPropertyPhoto);
}
