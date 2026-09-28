import { describe, expect, it } from "vitest";
import {
  BOOKING_TIME_SLOTS,
  addDays,
  bookingDateRange,
  pakistanNow,
  validateBooking,
} from "@/lib/validations/booking";

// Server-side validation for the viewing-request form. `now` is fixed so dates are deterministic.

// 2026-10-01 09:00 UTC = 14:00 in Pakistan (UTC+5).
const NOW = new Date("2026-10-01T09:00:00Z");
const PROPERTY_ID = "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264";

const valid = {
  propertyId: PROPERTY_ID,
  date: "2026-10-03",
  time: "10:30",
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "0300 1234567",
  message: "Could we see the garden too?",
};

function form(overrides: Partial<typeof valid> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...valid, ...overrides })) data.set(key, value);
  return data;
}

function fieldError(overrides: Partial<typeof valid>, field: string) {
  const result = validateBooking(form(overrides), NOW);
  return result.ok ? undefined : result.fieldErrors[field as keyof typeof result.fieldErrors];
}

describe("time helpers", () => {
  it("reads the date and time in Pakistan", () => {
    expect(pakistanNow(NOW)).toEqual({ date: "2026-10-01", time: "14:00" });
    // 20:30 UTC is already the next day in Pakistan.
    expect(pakistanNow(new Date("2026-10-01T20:30:00Z"))).toEqual({ date: "2026-10-02", time: "01:30" });
  });

  it("offers 30-minute slots from 10:00 to 17:30", () => {
    expect(BOOKING_TIME_SLOTS[0]).toBe("10:00");
    expect(BOOKING_TIME_SLOTS.at(-1)).toBe("17:30");
    expect(BOOKING_TIME_SLOTS).toHaveLength(16);
  });

  it("allows booking from today up to 60 days ahead", () => {
    expect(bookingDateRange(NOW)).toEqual({ min: "2026-10-01", max: "2026-11-30" });
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("validateBooking", () => {
  it("accepts a valid request and tidies the text", () => {
    const result = validateBooking(form({ name: "  Ayesha   Khan ", message: "   " }), NOW);
    expect(result).toEqual({
      ok: true,
      data: { ...valid, name: "Ayesha Khan", message: null },
    });
  });

  it("rejects a missing or tampered property id without field errors", () => {
    for (const propertyId of ["", "abc", "1; drop table bookings"]) {
      const result = validateBooking(form({ propertyId }), NOW);
      expect(result).toEqual({
        ok: false,
        fieldErrors: {},
        formError: "Please choose a property to view first.",
      });
    }
  });

  it("reports every missing field for an empty form", () => {
    const data = new FormData();
    data.set("propertyId", PROPERTY_ID);
    const result = validateBooking(data, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["date", "email", "name", "phone", "time"]);
    }
  });

  it.each([
    ["2026-09-30", "Choose today or a future date."],
    ["2026-12-01", "Choose a date within the next 60 days."],
    ["2026-02-30", "Enter a valid date."],
    ["03/10/2026", "Enter a valid date."],
  ])("rejects the date %j", (date, message) => {
    expect(fieldError({ date }, "date")).toBe(message);
  });

  it("accepts the first and last days of the window", () => {
    for (const date of ["2026-10-01", "2026-11-30"]) {
      expect(validateBooking(form({ date, time: "17:30" }), NOW).ok).toBe(true);
    }
  });

  it.each(["09:00", "18:00", "10:15", "25:00", "10:30:00"])("rejects the off-schedule time %j", (time) => {
    expect(fieldError({ time }, "time")).toBe("Choose one of the available times.");
  });

  it("rejects a slot that has already passed today", () => {
    expect(fieldError({ date: "2026-10-01", time: "13:30" }, "time")).toMatch(/already passed/);
    expect(fieldError({ date: "2026-10-01", time: "14:00" }, "time")).toMatch(/already passed/);
    expect(validateBooking(form({ date: "2026-10-01", time: "14:30" }), NOW).ok).toBe(true);
  });

  it.each(["0300 1234567", "+92 300 1234567", "0300-1234567", "(042) 3571-2345"])(
    "accepts the phone number %j",
    (phone) => expect(fieldError({ phone }, "phone")).toBeUndefined(),
  );

  it.each(["12345", "call me maybe", "+92 300 1234567 ext 12", "1".repeat(16)])(
    "rejects the phone number %j",
    (phone) => expect(fieldError({ phone }, "phone")).toMatch(/valid phone number/),
  );

  it("validates name, email and message limits", () => {
    expect(fieldError({ name: "A" }, "name")).toMatch(/at least 2/);
    expect(fieldError({ name: "x".repeat(121) }, "name")).toMatch(/120 characters/);
    expect(fieldError({ email: "not-an-email" }, "email")).toBe("Enter a valid email address.");
    expect(fieldError({ message: "x".repeat(2001) }, "message")).toMatch(/under 2000/);
    expect(fieldError({ message: "x".repeat(2000) }, "message")).toBeUndefined();
  });
});
