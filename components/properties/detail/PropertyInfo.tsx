import { formatPrice } from "@/lib/utils/format";
import type { PropertyDetail } from "@/types/property";

function formatDate(iso: string) {
  // UTC so the date never shifts with the server's time zone.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Full specification list, laid out as label/value rows in two columns on wider screens. */
export function PropertyInfo({ property }: { property: PropertyDetail }) {
  const rows: Array<[string, string]> = [
    ["Property type", property.propertyType],
    ["Listing type", property.listingType],
    ["Price", formatPrice(property.price, property.listingType)],
    ["City", property.city],
    ["Location", property.location],
    ["Area", `${property.area.toLocaleString("en-US")} ${property.areaUnit}`],
    ["Bedrooms", String(property.bedrooms)],
    ["Bathrooms", String(property.bathrooms)],
    ["Parking spaces", String(property.parkingSpaces)],
    ["Year built", property.yearBuilt ? String(property.yearBuilt) : "N/A"],
    ["Listed on", formatDate(property.listedAt)],
    ["Reference", property.id],
  ];

  return (
    <dl className="grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-4 border-b border-line px-4 py-3.5 sm:[&:nth-last-child(-n+2)]:border-b-0 last:border-b-0 sm:odd:border-r"
        >
          <dt className="text-sm text-stone">{label}</dt>
          <dd className="text-right text-sm font-semibold break-words text-charcoal [overflow-wrap:anywhere]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
