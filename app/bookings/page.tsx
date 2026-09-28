import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BookingHistoryCard } from "@/components/booking/BookingHistoryCard";
import { BookingsHeader } from "@/components/booking/BookingsHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CalendarCheckIcon } from "@/components/ui/icons";
import { requireUser } from "@/lib/auth/session";
import { groupBookings } from "@/lib/booking/history";
import { getUserBookings } from "@/lib/queries/supabase/bookings";
import { pakistanNow } from "@/lib/validations/booking";
import type { UserBooking } from "@/types/booking";

export const metadata: Metadata = {
  title: "My bookings",
  description: "Your EstateHub viewing requests and their status.",
  robots: { index: false },
};

/*
 * /bookings — the signed-in user's viewing requests. proxy.ts redirects signed-out visitors early;
 * requireUser is the authoritative check, and getUserBookings runs with the user's own session so
 * Row Level Security limits the result to their rows. loading.tsx and error.tsx cover the other
 * states.
 */
export default async function BookingsPage() {
  const user = await requireUser("/bookings");
  const bookings = await getUserBookings(user.id);
  const { upcoming, past } = groupBookings(bookings, pakistanNow().date);

  return (
    <Container className="py-10 sm:py-12 lg:py-16">
      <BookingsHeader>
        {bookings.length > 0 && (
          <ButtonLink href="/properties" variant="secondary" className="shrink-0">
            Browse properties
          </ButtonLink>
        )}
      </BookingsHeader>

      {bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          <BookingSection id="upcoming-heading" title="Upcoming" bookings={upcoming}>
            <p className="rounded-card border border-dashed border-line bg-white px-5 py-6 text-sm text-stone">
              No upcoming viewings. Find a property you like and select Book a Viewing.
            </p>
          </BookingSection>
          {past.length > 0 && <BookingSection id="past-heading" title="Past and closed" bookings={past} />}
        </div>
      )}
    </Container>
  );
}

function BookingSection({
  id,
  title,
  bookings,
  children,
}: {
  id: string;
  title: string;
  bookings: UserBooking[];
  children?: ReactNode; // shown when the section is empty
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="flex items-baseline gap-3 text-2xl font-semibold">
        {title}
        <span className="font-sans text-sm font-medium text-stone">{bookings.length}</span>
      </h2>
      {bookings.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-5">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <BookingHistoryCard booking={booking} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5">{children}</div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center rounded-card border border-line bg-white px-6 py-16 text-center shadow-card">
      <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-strong">
        <CalendarCheckIcon className="size-7" />
      </span>
      <h2 className="mt-6 text-2xl font-semibold">No viewings yet</h2>
      <p className="mt-3 max-w-md text-base leading-relaxed text-stone">
        When you request a viewing from a property&apos;s page, it will appear here with its status.
      </p>
      <ButtonLink href="/properties" className="mt-8">
        Browse properties
      </ButtonLink>
    </div>
  );
}
