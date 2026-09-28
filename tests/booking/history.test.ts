import { describe, expect, it } from "vitest";
import { bookingReference, groupBookings } from "@/lib/booking/history";
import type { BookingStatus, UserBooking } from "@/types/booking";

// Grouping and labelling of the user's booking history on /bookings.

function booking(id: string, date: string, time: string, status: BookingStatus): UserBooking {
  return {
    id,
    reference: bookingReference(id),
    date,
    time,
    status,
    message: null,
    createdAt: "2026-09-28T10:00:00Z",
    property: null,
    agent: null,
  };
}

const TODAY = "2026-10-01";

describe("bookingReference", () => {
  it("uses the first 8 characters of the id in upper case", () => {
    expect(bookingReference("be942da7-1234-4abc-9def-000000000000")).toBe("BE942DA7");
  });
});

describe("groupBookings", () => {
  const all = [
    booking("a", "2026-10-05", "11:00", "pending"),
    booking("b", "2026-10-01", "15:00", "confirmed"), // today counts as upcoming
    booking("c", "2026-10-01", "10:00", "pending"),
    booking("d", "2026-09-20", "12:00", "pending"), // date passed, never confirmed
    booking("e", "2026-10-09", "10:00", "cancelled"), // future but cancelled
    booking("f", "2026-09-25", "16:00", "completed"),
  ];

  it("puts pending/confirmed viewings from today on under upcoming, soonest first", () => {
    expect(groupBookings(all, TODAY).upcoming.map((b) => b.id)).toEqual(["c", "b", "a"]);
  });

  it("puts past, cancelled and completed viewings under past, most recent first", () => {
    expect(groupBookings(all, TODAY).past.map((b) => b.id)).toEqual(["e", "f", "d"]);
  });

  it("handles no bookings", () => {
    expect(groupBookings([], TODAY)).toEqual({ upcoming: [], past: [] });
  });

  it("does not modify the input array", () => {
    const input = [...all];
    groupBookings(input, TODAY);
    expect(input.map((b) => b.id)).toEqual(all.map((b) => b.id));
  });
});
