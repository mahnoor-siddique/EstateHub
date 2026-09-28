import type { BookingField } from "@/lib/validations/booking";
import type { PropertySummary } from "@/types/property";
import type { Database } from "@/types/database";

export type BookingStatus = Database["public"]["Enums"]["booking_status"];

/** Display labels for the booking statuses in the plan: Pending, Confirmed, Cancelled, Completed. */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** A listing as shown on the booking page, with whether it can still be viewed. */
export type BookableProperty = PropertySummary & { available: boolean };

/** One row of the signed-in user's booking history (/bookings). */
export type UserBooking = {
  id: string;
  reference: string; // short, human-friendly form of the id (first 8 characters, upper case)
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: BookingStatus;
  message: string | null;
  createdAt: string; // ISO timestamp
  /** null only if the listing cannot be read (deleting a listing also deletes its bookings). */
  property: PropertySummary | null;
  agent: { id: string; fullName: string; agencyName: string } | null;
};

/** A booking the user has just created, as echoed back on the success screen. */
export type CreatedBooking = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: BookingStatus;
};

/** State returned by the createBooking Server Action to the form (via useActionState). */
export type BookingFormState =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<BookingField, string>>;
      values: Partial<Record<BookingField, string>>;
    }
  | { status: "success"; booking: CreatedBooking };
