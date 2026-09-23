import type { ReactNode } from "react";
import { AreaIcon, BathIcon, BedIcon, CalendarCheckIcon } from "@/components/ui/icons";
import type { PropertyDetail } from "@/types/property";

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-white p-4 lg:flex-row lg:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-gold-strong">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-wide text-stone uppercase">{label}</dt>
        <dd className="text-lg font-semibold text-navy">{value}</dd>
      </div>
    </div>
  );
}

/** The four headline numbers under the image: bedrooms, bathrooms, area and year built. */
export function PropertyKeyFacts({ property }: { property: PropertyDetail }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <Fact icon={<BedIcon className="size-5" />} label="Bedrooms" value={property.bedrooms} />
      <Fact icon={<BathIcon className="size-5" />} label="Bathrooms" value={property.bathrooms} />
      <Fact
        icon={<AreaIcon className="size-5" />}
        label="Area"
        value={`${property.area.toLocaleString("en-US")} ${property.areaUnit}`}
      />
      <Fact
        icon={<CalendarCheckIcon className="size-5" />}
        label="Year built"
        value={property.yearBuilt ?? "N/A"}
      />
    </dl>
  );
}
