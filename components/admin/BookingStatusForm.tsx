"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { updateBookingStatus } from "@/lib/admin/bookings/actions";
import type { AdminFormState } from "@/lib/admin/types";
import { cn } from "@/lib/utils/cn";
import { BOOKING_STATUSES } from "@/lib/validations/admin-booking";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/booking";

const initialState: AdminFormState = { status: "idle" };

/** Status dropdown + Update button for one viewing request on the admin bookings list. */
export function BookingStatusForm({
  bookingId,
  reference,
  status,
}: {
  bookingId: string;
  reference: string;
  status: BookingStatus;
}) {
  const [state, formAction, pending] = useActionState(updateBookingStatus, initialState);
  const id = useId();

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-stone uppercase">
        Status<span className="sr-only"> of booking {reference}</span>
      </label>
      <div className="flex gap-2">
        <div className="w-36">
          <Select id={id} name="status" defaultValue={status} className="h-11 bg-white">
            {BOOKING_STATUSES.map((value) => (
              <option key={value} value={value}>
                {BOOKING_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary" disabled={pending} className="min-h-11 px-4">
          {pending ? "Saving…" : "Update"}
        </Button>
      </div>
      <p
        aria-live="polite"
        className={cn("min-h-5 max-w-xs text-xs", state.status === "error" ? "text-danger" : "text-gold-strong")}
      >
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
