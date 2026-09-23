import type { PropertySummary } from "@/types/property";
import { PropertyImage } from "../PropertyImage";
import { PropertyGallery } from "./PropertyGallery";

/**
 * Image area at the top of the details page. Listings with several photos get the full gallery;
 * a listing with one photo, or none yet (its type's designed placeholder), gets a single large frame.
 */
export function PropertyMainImage({ property }: { property: PropertySummary }) {
  const images = property.images ?? [];

  if (images.length > 1) {
    return <PropertyGallery images={images} title={property.title} />;
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand shadow-card sm:aspect-[16/9]">
      <PropertyImage property={property} sizes="(min-width: 1280px) 1216px, 100vw" />
    </div>
  );
}
