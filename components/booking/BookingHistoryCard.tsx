import Link from "next/link";
import { PropertyImage } from "@/components/properties/PropertyImage";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { CalendarCheckIcon, PinIcon, UserCheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { formatBookingDate, formatBookingTime } from "@/lib/utils/format";
import { BOOKING_STATUS_LABELS, type BookingStatus, type UserBooking } from "@/types/booking";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "border-gold/60 bg-sand text-navy",
  confirmed: "border-navy bg-navy text-white",
  completed: "border-line bg-white text-charcoal",
  cancelled: "border-line bg-white text-stone line-through decoration-stone/50",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        STATUS_STYLES[status],
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

/** One viewing in the user's booking history: listing, when, status, reference and agent. */
export function BookingHistoryCard({ booking }: { booking: UserBooking }) {
  const { property, agent } = booking;
  const requestedOn = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date(booking.createdAt));

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card sm:flex-row">
      <div className="relative aspect-[16/9] shrink-0 bg-sand sm:aspect-auto sm:w-52 lg:w-60">
        {property ? (
          <PropertyImage property={property} sizes="(min-width: 1024px) 15rem, (min-width: 640px) 13rem, 100vw" />
        ) : (
          <PlaceholderImage scene="house" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BookingStatusBadge status={booking.status} />
          <p className="text-xs text-stone">
            Ref <span className="font-mono font-semibold tracking-wider text-charcoal">{booking.reference}</span>
          </p>
        </div>

        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-balance">
            {property ? (
              <Link href={`/properties/${property.id}`} className="transition-colors hover:text-gold-strong">
                {property.title}
              </Link>
            ) : (
              "Listing no longer available"
            )}
          </h3>
          {property && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone">
              <PinIcon className="size-4 shrink-0 text-gold-strong" />
              {property.location}, {property.city}
            </p>
          )}
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <CalendarCheckIcon className="mt-0.5 size-5 shrink-0 text-gold-strong" />
            <div>
              <dt className="sr-only">Viewing date and time</dt>
              <dd className="font-medium text-navy">
                <time dateTime={`${booking.date}T${booking.time}`}>
                  {formatBookingDate(booking.date)}
                  <span className="block text-stone">{formatBookingTime(booking.time)}</span>
                </time>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <UserCheckIcon className="mt-0.5 size-5 shrink-0 text-gold-strong" />
            <div className="min-w-0">
              <dt className="sr-only">Agent</dt>
              <dd>
                {agent ? (
                  <>
                    <Link
                      href={`/agents/${agent.id}`}
                      className="font-medium text-navy transition-colors hover:text-gold-strong"
                    >
                      {agent.fullName}
                    </Link>
                    {agent.agencyName && <span className="block text-stone">{agent.agencyName}</span>}
                  </>
                ) : (
                  <span className="text-stone">Agent details unavailable</span>
                )}
              </dd>
            </div>
          </div>
        </dl>

        {booking.message && (
          <p className="line-clamp-2 border-l-2 border-gold/60 pl-3 text-sm text-stone italic">
            {booking.message}
          </p>
        )}

        <p className="mt-auto text-xs text-stone">Requested on {requestedOn}</p>
      </div>
    </article>
  );
}
