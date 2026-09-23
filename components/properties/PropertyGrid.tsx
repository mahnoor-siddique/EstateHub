import { PropertyCard } from "@/components/properties/PropertyCard";
import { cn } from "@/lib/utils/cn";
import type { PropertySummary } from "@/types/property";

/**
 * Responsive list of property cards: 1 column on phones, 2 on tablets, 3 on desktop.
 * Rendered as a <ul> so screen readers announce how many listings there are.
 */
export function PropertyGrid({
  properties,
  className,
}: {
  properties: PropertySummary[];
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8", className)}>
      {properties.map((property, index) => (
        <li key={property.id} className="flex">
          <PropertyCard property={property} tone={index % 2 === 0 ? "dusk" : "slate"} />
        </li>
      ))}
    </ul>
  );
}
