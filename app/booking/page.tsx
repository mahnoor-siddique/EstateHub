import type { Metadata } from "next";
import Link from "next/link";
import { BookingForm } from "@/components/booking/BookingForm";
import { BookingPropertyCard } from "@/components/booking/BookingPropertyCard";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowLeftIcon, CalendarCheckIcon } from "@/components/ui/icons";
import { requireUser } from "@/lib/auth/session";
import { getBookableProperty } from "@/lib/queries/supabase/bookings";
import { bookingDateRange } from "@/lib/validations/booking";

export const metadata: Metadata = {
  title: "Book a viewing",
  description: "Request a viewing of an EstateHub property.",
  robots: { index: false },
};

/*
 * /booking?propertyId=<uuid> — request a viewing. Signed-in only: proxy.ts redirects signed-out
 * visitors early, and requireUser below is the authoritative check.
 */
export default async function BookingPage({ searchParams }: PageProps<"/booking">) {
  const { propertyId } = await searchParams;
  const id = typeof propertyId === "string" ? propertyId : "";
  const user = await requireUser(id ? `/booking?${new URLSearchParams({ propertyId: id })}` : "/booking");

  if (!id) {
    return (
      <BookingNotice
        title="Choose a property first"
        text="Viewings are booked from a property's page. Find a listing you like and select Book a Viewing."
      />
    );
  }

  const property = await getBookableProperty(id);
  if (!property) {
    return (
      <BookingNotice
        title="We couldn't find that property"
        text="The link may be out of date, or the listing may have been removed."
      />
    );
  }
  if (!property.available) {
    return (
      <BookingNotice
        title="Viewings are closed for this property"
        text="This listing is no longer available, so it isn't accepting viewing requests."
        propertyId={property.id}
      />
    );
  }

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <Link
        href={`/properties/${property.id}`}
        className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-navy transition-colors hover:text-gold-strong"
      >
        <ArrowLeftIcon className="size-4" />
        Back to property
      </Link>

      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">
          Book a viewing
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">Request a viewing</h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          Pick a date and time that suits you. The listing agent will confirm your visit.
        </p>
      </header>

      {/* Property first on phones (context), sticky sidebar beside the form from lg. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <aside className="lg:col-start-2 lg:row-start-1">
          <div className="lg:sticky lg:top-28">
            <BookingPropertyCard property={property} />
          </div>
        </aside>
        <section
          aria-label="Viewing request"
          className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8 lg:col-start-1 lg:row-start-1"
        >
          <BookingForm
            propertyId={property.id}
            propertyTitle={property.title}
            defaults={{ name: user.fullName ?? "", email: user.email }}
            dateRange={bookingDateRange()}
          />
        </section>
      </div>
    </Container>
  );
}

function BookingNotice({ title, text, propertyId }: { title: string; text: string; propertyId?: string }) {
  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-strong">
          <CalendarCheckIcon className="size-7" />
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">
          Book a viewing
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-stone sm:text-lg">{text}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/properties">Browse properties</ButtonLink>
          {propertyId && (
            <ButtonLink href={`/properties/${propertyId}`} variant="secondary">
              View listing
            </ButtonLink>
          )}
        </div>
      </div>
    </Container>
  );
}
