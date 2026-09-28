"use client";

import { useActionState } from "react";
import { AuthField, FieldFrame, FormAlert, describedBy } from "@/components/auth/AuthFields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { useFocusFirstError } from "@/components/auth/useFocusFirstError";
import { ButtonLink } from "@/components/ui/Button";
import { Select, fieldClass } from "@/components/ui/form";
import { CalendarCheckIcon } from "@/components/ui/icons";
import { createBooking } from "@/lib/booking/actions";
import { bookingReference } from "@/lib/booking/history";
import { cn } from "@/lib/utils/cn";
import { formatBookingDate, formatBookingTime } from "@/lib/utils/format";
import { BOOKING_TIME_SLOTS, MESSAGE_MAX } from "@/lib/validations/booking";
import { BOOKING_STATUS_LABELS, type BookingFormState, type CreatedBooking } from "@/types/booking";

const initialState: BookingFormState = { status: "idle" };
const MESSAGE_HINT = "Anything the agent should know, e.g. questions or who will attend.";

/**
 * Viewing-request form. It posts to the createBooking Server Action (so it works before
 * hydration too); the button is disabled while saving, and on success the form is replaced by a
 * confirmation, so the same request cannot be sent twice by accident.
 */
export function BookingForm({
  propertyId,
  propertyTitle,
  defaults,
  dateRange,
}: {
  propertyId: string;
  propertyTitle: string;
  defaults: { name: string; email: string };
  dateRange: { min: string; max: string };
}) {
  const [state, formAction, pending] = useActionState(createBooking, initialState);
  const formRef = useFocusFirstError(state);

  if (state.status === "success") {
    return (
      <BookingSuccess booking={state.booking} propertyId={propertyId} propertyTitle={propertyTitle} />
    );
  }

  const errors = state.status === "error" ? state : undefined;
  const values = errors?.values ?? { name: defaults.name, email: defaults.email };
  const fieldErrors = errors?.fieldErrors ?? {};

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <FormAlert message={errors?.message} />
      <input type="hidden" name="propertyId" value={propertyId} />

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="sr-only">Preferred date and time</legend>
        <AuthField
          label="Date"
          name="date"
          type="date"
          required
          min={dateRange.min}
          max={dateRange.max}
          defaultValue={values.date}
          error={fieldErrors.date}
        />
        <FieldFrame id="booking-time" label="Time" error={fieldErrors.time}>
          <Select
            id="booking-time"
            name="time"
            required
            defaultValue={values.time ?? ""}
            aria-invalid={fieldErrors.time ? true : undefined}
            aria-describedby={describedBy("booking-time", fieldErrors.time)}
            className={cn("bg-white text-base sm:text-sm", fieldErrors.time && "border-danger")}
          >
            <option value="" disabled>
              Choose a time
            </option>
            {BOOKING_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatBookingTime(slot)}
              </option>
            ))}
          </Select>
        </FieldFrame>
      </fieldset>

      <AuthField
        label="Full name"
        name="name"
        type="text"
        autoComplete="name"
        required
        maxLength={120}
        defaultValue={values.name}
        error={fieldErrors.name}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          defaultValue={values.email}
          error={fieldErrors.email}
        />
        <AuthField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          maxLength={30}
          placeholder="0300 1234567"
          defaultValue={values.phone}
          error={fieldErrors.phone}
        />
      </div>

      <FieldFrame
        id="booking-message"
        label="Message (optional)"
        error={fieldErrors.message}
        hint={MESSAGE_HINT}
      >
        <textarea
          id="booking-message"
          name="message"
          rows={4}
          maxLength={MESSAGE_MAX}
          defaultValue={values.message}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={describedBy("booking-message", fieldErrors.message, MESSAGE_HINT)}
          className={cn(
            fieldClass,
            "h-auto min-h-28 resize-y bg-white py-3 text-base sm:text-sm",
            fieldErrors.message && "border-danger",
          )}
        />
      </FieldFrame>

      <SubmitButton pending={pending} pendingLabel="Sending request…">
        Request viewing
      </SubmitButton>
      <p className="text-center text-xs text-stone">
        Your request is saved as pending until the listing agent confirms it.
      </p>
    </form>
  );
}

function BookingSuccess({
  booking,
  propertyId,
  propertyTitle,
}: {
  booking: CreatedBooking;
  propertyId: string;
  propertyTitle: string;
}) {
  return (
    <div role="status" className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-sand text-gold-strong">
        <CalendarCheckIcon className="size-7" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">Viewing requested</h2>
      <p className="mt-3 text-sm leading-relaxed text-stone">
        Your request has been saved and is waiting for the listing agent to confirm it.
      </p>

      <dl className="mt-6 divide-y divide-line rounded-lg border border-line bg-ivory text-left text-sm">
        {[
          ["Property", propertyTitle],
          ["Date", formatBookingDate(booking.date)],
          ["Time", formatBookingTime(booking.time)],
          ["Status", BOOKING_STATUS_LABELS[booking.status]],
          ["Reference", bookingReference(booking.id)],
        ].map(([term, detail]) => (
          <div key={term} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-stone">{term}</dt>
            <dd className="text-right font-medium text-navy">{detail}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ButtonLink href="/bookings">View my bookings</ButtonLink>
        <ButtonLink href={`/properties/${propertyId}`} variant="secondary">
          Back to property
        </ButtonLink>
      </div>
    </div>
  );
}
