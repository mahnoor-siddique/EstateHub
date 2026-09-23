import { PlaceholderImage, type Scene, type Tone } from "@/components/ui/PlaceholderImage";
import type { PropertySummary, PropertyType } from "@/types/property";

const SCENE_BY_TYPE: Record<PropertyType, Scene> = {
  House: "house",
  Villa: "villa",
  Apartment: "apartment",
  Commercial: "commercial",
};

/**
 * A listing's cover photo (its first image), or the designed placeholder for its property type until real photos exist.
 * Fills its parent, which sets the aspect ratio and must be `relative`.
 */
export function PropertyImage({
  property,
  tone = "dusk",
  sizes,
  className,
}: {
  property: PropertySummary;
  tone?: Tone;
  sizes?: string;
  className?: string;
}) {
  const { title, location, city } = property;
  const cover = property.images?.[0];
  return (
    <PlaceholderImage
      scene={SCENE_BY_TYPE[property.propertyType]}
      tone={tone}
      src={cover?.src}
      alt={cover?.alt ?? `${title} in ${location}, ${city}`}
      sizes={sizes}
      className={className}
    />
  );
}
