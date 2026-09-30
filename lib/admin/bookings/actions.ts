"use server";

import { revalidatePath } from "next/cache";
import { adminWriteErrorMessage } from "@/lib/admin/errors";
import type { AdminFormState } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/session";
import { isUuid } from "@/lib/queries/supabase/shared";
import { createClient } from "@/lib/supabase/server";
import { BOOKING_STATUS_LABELS } from "@/types/booking";
import { parseBookingStatus } from "@/lib/validations/admin-booking";

/*
 * Server Action behind /admin/bookings. requireAdmin first (guests go to login, everyone else gets
 * a 404); then only the status column is written, with the admin's own session. The database
 * allows admins to update that one column and nothing else on a booking, so the customer, property,
 * agent, date and time can never change through here.
 */

export async function updateBookingStatus(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin("/admin/bookings");
  const bookingId = String(formData.get("bookingId") ?? "");
  const status = parseBookingStatus(formData.get("status"));
  if (!isUuid(bookingId) || !status) return { status: "error", message: "Choose a valid status." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("bookings").update({ status }).eq("id", bookingId).select("id");

  if (error) {
    const message =
      error.code === "23505" // bookings_unique_active_slot_idx
        ? "This customer already has another active request for the same property and time, so this one can't be re-opened."
        : adminWriteErrorMessage(error, "change the status");
    return { status: "error", message };
  }
  if (data.length === 0) return { status: "error", message: "This booking no longer exists." };

  // The customer's own /bookings page shows the status too.
  revalidatePath("/", "layout");
  return { status: "success", message: `Marked ${BOOKING_STATUS_LABELS[status].toLowerCase()}.` };
}
