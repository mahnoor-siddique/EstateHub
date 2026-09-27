import { connection } from "next/server";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { getProperties } from "@/lib/queries/supabase/properties";
import { parsePropertyFilters } from "@/lib/utils/property-filters";
import type { PropertySummary } from "@/types/property";

const FEATURED_COUNT = 6;

/** The newest listings, via the same query and default sort as /properties. Returns [] if Supabase
 *  fails, so one section can never take the whole homepage down. */
async function getFeaturedProperties(): Promise<PropertySummary[]> {
  try {
    const { properties } = await getProperties(parsePropertyFilters({}));
    return properties.slice(0, FEATURED_COUNT);
  } catch (error) {
    console.error("Featured properties unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function FeaturedProperties() {
  // Listings come from Supabase, so render on each request instead of freezing a build-time snapshot.
  await connection();
  const properties = await getFeaturedProperties();

  // With no listings to feature, leave the section out rather than show an empty grid.
  if (properties.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="pb-20 lg:pb-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Featured properties"
            title={<span id="featured-heading">Homes worth a closer look</span>}
            description="A preview of the kind of properties you'll find on EstateHub."
          />
          <ButtonLink href="/properties" variant="secondary" className="self-start sm:self-auto">
            View all properties
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {properties.map((property, index) => (
            <li key={property.id} className="flex">
              <PropertyCard property={property} tone={index % 2 === 0 ? "dusk" : "slate"} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
