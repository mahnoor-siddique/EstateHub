import type { BookingStatus } from "@/types/booking";

/*
 * The status values an admin may set on a viewing request — exactly the booking_status enum.
 * Any status can be set from any other; the database still enforces the one-active-booking-per-slot
 * rule when a cancelled request is re-opened.
 */

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const satisfies readonly BookingStatus[];

export function parseBookingStatus(value: FormDataEntryValue | null): BookingStatus | null {
  return typeof value === "string" && (BOOKING_STATUSES as readonly string[]).includes(value)
    ? (value as BookingStatus)
    : null;
}
