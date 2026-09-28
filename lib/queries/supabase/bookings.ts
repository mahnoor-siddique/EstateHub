import { bookingReference } from "@/lib/booking/history";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import {
  DataAccessError,
  IMAGE_COLUMNS,
  PROPERTY_SUMMARY_COLUMNS,
  isUuid,
  toPropertySummary,
} from "@/lib/queries/supabase/shared";
import type { BookableProperty, UserBooking } from "@/types/booking";

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

const USER_BOOKING_COLUMNS = `id, booking_date, booking_time, status, message, created_at, properties(${PROPERTY_SUMMARY_COLUMNS}, property_images(${IMAGE_COLUMNS})), agents(id, full_name, agency_name)`;

/**
 * The signed-in user's bookings with the listing and agent, newest date first.
 *
 * Uses the per-request server client, so the query runs with the user's own session and Row Level
 * Security only ever returns their rows. The explicit user_id filter repeats that rule in the query
 * itself (and uses bookings_user_id_idx); pass the id from requireUser(), never from the request.
 */
export async function getUserBookings(userId: string): Promise<UserBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(USER_BOOKING_COLUMNS)
    .eq("user_id", userId)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false });

  if (error) throw new DataAccessError("load your bookings", error);

  return data.map((row) => ({
    id: row.id,
    reference: bookingReference(row.id),
    date: row.booking_date,
    time: row.booking_time.slice(0, 5), // Postgres returns HH:MM:SS
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    property: row.properties ? toPropertySummary(row.properties) : null,
    agent: row.agents
      ? {
          id: row.agents.id,
          fullName: row.agents.full_name,
          agencyName: row.agents.agency_name ?? "",
        }
      : null,
  }));
}
