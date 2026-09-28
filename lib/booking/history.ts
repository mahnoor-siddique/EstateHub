import type { UserBooking } from "@/types/booking";

/** Short, human-friendly booking reference: the first 8 characters of the id, upper case. */
export function bookingReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/**
 * Splits a user's bookings for display. Upcoming: pending or confirmed viewings from today on,
 * soonest first. Past: everything else (earlier dates, cancelled, completed), most recent first.
 * `today` is YYYY-MM-DD in Pakistan time (see pakistanNow).
 */
export function groupBookings(bookings: UserBooking[], today: string) {
  const isUpcoming = (b: UserBooking) =>
    b.date >= today && (b.status === "pending" || b.status === "confirmed");
  const byDateTime = (a: UserBooking, b: UserBooking) =>
    a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

  return {
    upcoming: bookings.filter(isUpcoming).sort(byDateTime),
    past: bookings.filter((b) => !isUpcoming(b)).sort((a, b) => byDateTime(b, a)),
  };
}
