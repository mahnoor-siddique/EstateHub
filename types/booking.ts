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
