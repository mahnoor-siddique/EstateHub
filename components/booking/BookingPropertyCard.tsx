import Link from "next/link";
import { PropertyImage } from "@/components/properties/PropertyImage";
import { PinIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { PropertySummary } from "@/types/property";

/** Compact summary of the listing being booked, shown beside the form. */
export function BookingPropertyCard({ property }: { property: PropertySummary }) {
  const sale = property.listingType === "For Sale";
  return (
    <article className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="relative aspect-[16/10] bg-sand">
        <PropertyImage property={property} sizes="(min-width: 1024px) 24rem, 100vw" />
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
            sale ? "bg-navy text-white" : "bg-gold text-navy",
          )}
        >
          {property.listingType}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-gold-strong uppercase">
          You&apos;re booking
        </p>
        <h2 className="mt-2 text-xl font-semibold text-balance">
          <Link
            href={`/properties/${property.id}`}
            className="transition-colors hover:text-gold-strong"
          >
            {property.title}
          </Link>
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-stone">
          <PinIcon className="size-4 shrink-0 text-gold-strong" />
          {property.location}, {property.city}
        </p>
        <p className="mt-3 font-serif text-2xl font-semibold text-navy">
          {formatPrice(property.price, property.listingType)}
        </p>
      </div>
    </article>
  );
}
