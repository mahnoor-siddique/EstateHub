import { BookingsHeader } from "@/components/booking/BookingsHeader";
import { Container } from "@/components/ui/Container";

/** Shown while the bookings load: the real header plus card-shaped placeholders. */
export default function BookingsLoading() {
  return (
    <Container className="py-10 sm:py-12 lg:py-16">
      <BookingsHeader />
      <div className="mt-10" role="status" aria-live="polite">
        <span className="sr-only">Loading your bookings…</span>
        <div aria-hidden="true" className="h-7 w-32 animate-pulse rounded bg-sand" />
        <ul aria-hidden="true" className="mt-5 flex flex-col gap-5">
          {[0, 1].map((i) => (
            <li
              key={i}
              className="flex flex-col overflow-hidden rounded-card border border-line bg-white sm:flex-row"
            >
              <div className="aspect-[16/9] animate-pulse bg-sand sm:aspect-auto sm:h-48 sm:w-52 lg:w-60" />
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="h-6 w-24 animate-pulse rounded-full bg-sand" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-sand" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-sand" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-sand" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
