"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/queries/supabase/shared";
import { validateBooking } from "@/lib/validations/booking";
import type { BookingFormState } from "@/types/booking";

/*
 * Server Action behind the /booking form. It re-checks the signed-in user (the proxy alone is not
 * trusted), validates every field, and inserts with the user's own Supabase session, so RLS and the
 * bookings_set_defaults trigger decide the rest: the row must belong to the caller, the agent comes
 * from the listing, and the status always starts as pending.
 */
export async function createBooking(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const rawPropertyId = String(formData.get("propertyId") ?? "");
  const returnTo = isUuid(rawPropertyId)
    ? `/booking?${new URLSearchParams({ propertyId: rawPropertyId })}`
    : "/booking";
  const user = await requireUser(returnTo);

  const values = Object.fromEntries(
    (["date", "time", "name", "email", "phone", "message"] as const).map((field) => [
      field,
      String(formData.get(field) ?? ""),
    ]),
  );

  const result = validateBooking(formData);
  if (!result.ok) {
    return { status: "error", message: result.formError, fieldErrors: result.fieldErrors, values };
  }

  const { propertyId, date, time, name, email, phone, message } = result.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      property_id: propertyId,
      booking_date: date,
      booking_time: time,
      name,
      email,
      phone,
      message,
    })
    .select("id, booking_date, booking_time, status")
    .single();

  if (error) return { status: "error", message: bookingErrorMessage(error), values };

  return {
    status: "success",
    booking: {
      id: data.id,
      date: data.booking_date,
      time: data.booking_time.slice(0, 5), // Postgres returns HH:MM:SS
      status: data.status,
    },
  };
}

/** Friendly message for a failed insert. Only the error code is logged — never the form data. */
function bookingErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case "23505": // bookings_unique_active_slot_idx
      return "You've already requested a viewing of this property at that date and time.";
    case "P0001": // raised by bookings_set_defaults: listing is sold, rented or pending
      return "This property is no longer accepting viewing requests.";
    case "23503": // property deleted in the meantime
      return "We couldn't find this property. It may have been removed.";
    default:
      console.error("[booking] insert failed", { code: error.code });
      return "We couldn't save your viewing request. Please try again.";
  }
}
