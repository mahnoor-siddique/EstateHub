import Link from "next/link";
import type { ReactNode } from "react";
import { AreaIcon, BathIcon, BedIcon, ArrowRightIcon, PinIcon } from "@/components/ui/icons";
import { PlaceholderImage, type Scene, type Tone } from "@/components/ui/PlaceholderImage";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { PropertySummary, PropertyType } from "@/types/property";

const SCENE_BY_TYPE: Record<PropertyType, Scene> = {
  House: "house",
  Villa: "villa",
  Apartment: "apartment",
  Commercial: "commercial",
};

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-gold-strong">{icon}</span>
      <span className="sr-only">{label}: </span>
      {children}
    </li>
  );
}

/**
 * Property card. The whole card is clickable through a stretched link on the title, so there is a
 * single tab stop per card and screen readers hear one link named after the property.
 * Reusable by the Phase 3 listings page.
 */
export function PropertyCard({ property, tone = "dusk" }: { property: PropertySummary; tone?: Tone }) {
  const { id, title, propertyType, listingType, price, city, location, bedrooms, bathrooms } = property;
  const sale = listingType === "For Sale";

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-[box-shadow,translate] duration-300 hover:-translate-y-1 hover:shadow-lift has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-gold-strong motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <PlaceholderImage
            scene={SCENE_BY_TYPE[propertyType]}
            tone={tone}
            src={property.imageUrl}
            alt={property.imageAlt ?? `${title} in ${location}, ${city}`}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
            sale ? "bg-navy text-white" : "bg-gold text-navy",
          )}
        >
          {listingType}
        </span>
        <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-charcoal uppercase">
          {propertyType}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-serif text-2xl font-semibold text-navy">{formatPrice(price, listingType)}</p>
        <h3 className="mt-1 font-sans text-lg leading-snug font-semibold text-charcoal">
          <Link
            href={`/properties/${id}`}
            className="transition-colors group-hover:text-gold-strong after:absolute after:inset-0 focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone">
          <PinIcon className="size-4 shrink-0" />
          {location}, {city}
        </p>

        <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-charcoal">
          <Fact icon={<BedIcon className="size-[1.125rem]" />} label="Bedrooms">
            {bedrooms}
          </Fact>
          <Fact icon={<BathIcon className="size-[1.125rem]" />} label="Bathrooms">
            {bathrooms}
          </Fact>
          <Fact icon={<AreaIcon className="size-[1.125rem]" />} label="Area">
            {property.area.toLocaleString("en-US")} {property.areaUnit}
          </Fact>
        </ul>

        <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy" aria-hidden="true">
          View details
          <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
        </p>
      </div>
    </article>
  );
}
