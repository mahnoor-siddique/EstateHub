import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PropertiesHero } from "@/components/properties/PropertiesHero";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { DEMO_PROPERTIES } from "@/lib/data/demo";
import { hasActiveFilters, readFilterValues } from "@/lib/utils/property-filters";

export const metadata: Metadata = {
  title: "Properties",
  description:
    "Browse houses, apartments, villas and commercial properties for sale and rent across Lahore, Islamabad, Karachi and more.",
};

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const filters = readFilterValues(await searchParams);
  // Demo data for now. Applying the filters, sorting and Supabase data come in later Phase 3/6 chunks.
  const properties = DEMO_PROPERTIES;
  const count = properties.length;

  return (
    <>
      <PropertiesHero />

      <Container className="py-10 sm:py-12 lg:py-16">
        {/* key: remount on URL change so defaultValues follow client-side navigation (e.g. "Clear all"). */}
        <PropertyFilters key={JSON.stringify(filters)} values={filters} />

        <section aria-labelledby="results-heading" className="mt-10 lg:mt-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 id="results-heading" className="font-sans text-lg font-semibold text-charcoal">
              {count} {count === 1 ? "property" : "properties"}
            </h2>
            <p className="text-sm text-stone">Sample listings for demonstration only.</p>
          </div>

          {hasActiveFilters(filters) && (
            <p
              role="status"
              className="mb-6 rounded-lg border border-gold/40 bg-sand px-4 py-3 text-sm text-charcoal"
            >
              Filtering is not active yet, so all sample listings are shown. Your search is saved in the
              link and will apply once filtering is added.
            </p>
          )}

          <PropertyGrid properties={properties} />
        </section>
      </Container>
    </>
  );
}
