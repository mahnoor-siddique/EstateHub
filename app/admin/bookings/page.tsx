import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BookingStatusForm } from "@/components/admin/BookingStatusForm";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/ui";
import { BookingStatusBadge } from "@/components/booking/BookingHistoryCard";
import { CalendarCheckIcon } from "@/components/ui/icons";
import { getAdminBookings } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatBookingDate, formatBookingTime } from "@/lib/utils/format";
import { BOOKING_STATUSES } from "@/lib/validations/admin-booking";
import { BOOKING_STATUS_LABELS } from "@/types/booking";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin("/admin/bookings");
  return { title: "Manage bookings" };
}

const createdFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

/*
 * /admin/bookings — every viewing request with the customer's details and a status control.
 * requireAdmin runs here (not only in the layout); the database only returns all bookings to
 * admins, and only lets them change the status.
 */
export default async function AdminBookingsPage() {
  await requireAdmin("/admin/bookings");
  const bookings = await getAdminBookings();
  const counts = BOOKING_STATUSES.map((status) => ({
    status,
    count: bookings.filter((booking) => booking.status === status).length,
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin"
        title="Bookings"
        description="Every viewing request, newest viewing date first. Change a request's status as it progresses; the customer sees the new status on their bookings page."
      />

      {bookings.length === 0 ? (
        <AdminEmptyState icon={<CalendarCheckIcon className="size-7" />} title="No viewing requests yet">
          When customers request a viewing from a property page, their requests appear here.
        </AdminEmptyState>
      ) : (
        <section aria-labelledby="all-bookings-heading" className="mt-10">
          <h2 id="all-bookings-heading" className="flex items-baseline gap-3 text-2xl font-semibold">
            All requests
            <span className="font-sans text-sm font-medium text-stone">{bookings.length}</span>
          </h2>
          <p className="mt-2 text-sm text-stone">
            {counts.map(({ status, count }) => `${count} ${BOOKING_STATUS_LABELS[status].toLowerCase()}`).join(" · ")}
          </p>

          <ul className="mt-5 flex flex-col gap-4">
            {bookings.map((booking) => (
              <li key={booking.id} className="rounded-card border border-line bg-white p-5 shadow-card">
                <article aria-labelledby={`booking-${booking.id}`}>
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <BookingStatusBadge status={booking.status} />
                        <span className="text-xs font-semibold tracking-wide text-stone uppercase">
                          Ref {booking.reference}
                        </span>
                      </div>
                      <h3 id={`booking-${booking.id}`} className="mt-3 text-xl font-semibold break-words">
                        {booking.property ? (
                          <Link href={`/admin/properties/${booking.property.id}`} className="hover:text-gold-strong">
                            {booking.property.title}
                          </Link>
                        ) : (
                          "Property unavailable"
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-stone">
                        {formatBookingDate(booking.date)} at {formatBookingTime(booking.time)}
                        {booking.property && ` · ${booking.property.city}`}
                      </p>

                      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <Detail term="Customer" value={booking.name} />
                        <Detail term="Email">
                          <a href={`mailto:${booking.email}`} className="text-navy underline-offset-4 hover:underline">
                            {booking.email}
                          </a>
                        </Detail>
                        <Detail term="Phone">
                          <a href={`tel:${booking.phone.replace(/[^\d+]/g, "")}`} className="text-navy underline-offset-4 hover:underline">
                            {booking.phone}
                          </a>
                        </Detail>
                        <Detail term="Agent" value={booking.agent?.fullName ?? "—"} />
                        <Detail term="Requested" value={createdFormat.format(new Date(booking.createdAt))} />
                      </dl>

                      {booking.message && (
                        <div className="mt-4 rounded-lg bg-ivory px-4 py-3 text-sm">
                          <p className="text-xs font-semibold tracking-wide text-stone uppercase">Message</p>
                          <p className="mt-1 whitespace-pre-line break-words text-charcoal">{booking.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="xl:shrink-0">
                      <BookingStatusForm bookingId={booking.id} reference={booking.reference} status={booking.status} />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Detail({ term, value, children }: { term: string; value?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold tracking-wide text-stone uppercase">{term}</dt>
      <dd className="mt-0.5 truncate text-charcoal" title={value}>
        {children ?? value}
      </dd>
    </div>
  );
}
