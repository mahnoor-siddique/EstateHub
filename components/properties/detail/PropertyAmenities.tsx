import { CheckIcon } from "@/components/ui/icons";
import type { Amenity } from "@/types/property";

export function PropertyAmenities({ amenities }: { amenities: Amenity[] }) {
  if (amenities.length === 0) {
    return <p className="text-base text-stone">No amenities have been listed for this property.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {amenities.map((amenity) => (
        <li key={amenity} className="flex items-center gap-3 text-base text-charcoal">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-gold">
            <CheckIcon className="size-4" />
          </span>
          {amenity}
        </li>
      ))}
    </ul>
  );
}
