import { isUuid } from "@/lib/queries/supabase/shared";
import { EMAIL_MAX, FULL_NAME_MAX, FULL_NAME_MIN } from "@/lib/validations/auth";

/*
 * Validation for the viewing-request form. The Server Action always runs it; the browser's
 * required/min/max attributes are only a convenience. Limits mirror the bookings table
 * (name <= 120, email <= 254, phone 7–30 chars, message <= 2000).
 *
 * Dates and times are in Pakistan time (Asia/Karachi), where all listings are.
 */

export const BOOKING_TIME_ZONE = "Asia/Karachi";
export const BOOKING_WINDOW_DAYS = 60;
export const MESSAGE_MAX = 2000;

/** Viewing slots offered each day: every 30 minutes from 10:00 to 17:30. */
export const BOOKING_TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const minutes = 10 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 === 0 ? "00" : "30"}`;
});

export type BookingField = "date" | "time" | "name" | "email" | "phone" | "message";

export type BookingInput = {
  propertyId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM, one of BOOKING_TIME_SLOTS
  name: string;
  email: string;
  phone: string;
  message: string | null;
};

type Result =
  | { ok: true; data: BookingInput }
  | { ok: false; fieldErrors: Partial<Record<BookingField, string>>; formError?: string };

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Digits with optional leading +, spaces, dashes or brackets, e.g. "+92 300 1234567", "0300-1234567".
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/** Today's date and the current HH:MM in Pakistan, e.g. { date: "2026-09-28", time: "14:05" }. */
export function pakistanNow(now: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** First and last bookable dates: today (Pakistan time) through BOOKING_WINDOW_DAYS ahead. */
export function bookingDateRange(now: Date = new Date()) {
  const today = pakistanNow(now).date;
  return { min: today, max: addDays(today, BOOKING_WINDOW_DAYS) };
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function validateBooking(formData: FormData, now: Date = new Date()): Result {
  const propertyId = text(formData.get("propertyId")).trim();
  const date = text(formData.get("date")).trim();
  const time = text(formData.get("time")).trim();
  const name = text(formData.get("name")).trim().replace(/\s+/g, " ");
  const email = text(formData.get("email")).trim();
  const phone = text(formData.get("phone")).trim().replace(/\s+/g, " ");
  const message = text(formData.get("message")).trim();

  // The property comes from a hidden field; a bad value means a tampered or stale form.
  if (!isUuid(propertyId)) {
    return { ok: false, fieldErrors: {}, formError: "Please choose a property to view first." };
  }

  const fieldErrors: Partial<Record<BookingField, string>> = {};
  const { date: today, time: nowTime } = pakistanNow(now);
  const { max } = bookingDateRange(now);

  if (!date) fieldErrors.date = "Choose a date for the viewing.";
  else if (!isRealDate(date)) fieldErrors.date = "Enter a valid date.";
  else if (date < today) fieldErrors.date = "Choose today or a future date.";
  else if (date > max) fieldErrors.date = `Choose a date within the next ${BOOKING_WINDOW_DAYS} days.`;

  if (!time) fieldErrors.time = "Choose a time for the viewing.";
  else if (!BOOKING_TIME_SLOTS.includes(time)) fieldErrors.time = "Choose one of the available times.";
  else if (!fieldErrors.date && date === today && time <= nowTime)
    fieldErrors.time = "That time has already passed today. Choose a later time.";

  if (!name) fieldErrors.name = "Enter your full name.";
  else if (name.length < FULL_NAME_MIN)
    fieldErrors.name = `Your name must be at least ${FULL_NAME_MIN} characters.`;
  else if (name.length > FULL_NAME_MAX)
    fieldErrors.name = `Your name must be ${FULL_NAME_MAX} characters or fewer.`;

  if (!email) fieldErrors.email = "Enter your email address.";
  else if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email))
    fieldErrors.email = "Enter a valid email address.";

  const digits = phone.replace(/\D/g, "").length;
  if (!phone) fieldErrors.phone = "Enter a phone number the agent can reach you on.";
  else if (!PHONE_PATTERN.test(phone) || digits < 10 || digits > 15 || phone.length > 30)
    fieldErrors.phone = "Enter a valid phone number, e.g. 0300 1234567 or +92 300 1234567.";

  if (message.length > MESSAGE_MAX)
    fieldErrors.message = `Keep your message under ${MESSAGE_MAX} characters.`;

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return {
    ok: true,
    data: { propertyId, date, time, name, email, phone, message: message || null },
  };
}
