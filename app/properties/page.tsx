import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PropertiesHero } from "@/components/properties/PropertiesHero";
import { PropertyEmptyState } from "@/components/properties/PropertyEmptyState";
import { FILTER_FORM_ID, PropertyFilters } from "@/components/properties/PropertyFilters";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { SortSelect } from "@/components/properties/SortSelect";
import { getProperties } from "@/lib/queries/properties";
import { clearFiltersHref, parsePropertyFilters } from "@/lib/utils/property-filters";

export const metadata: Metadata = {
  title: "Properties",
  description:
    "Browse houses, apartments, villas and commercial properties for sale and rent across Lahore, Islamabad, Karachi and more.",
};

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  // The URL is the source of truth: parse it, then query with it.
  const filters = parsePropertyFilters(await searchParams);
  const { properties, total } = await getProperties(filters);
  const count = properties.length;
  // Remount the form whenever the URL changes so every field's defaultValue follows client-side navigation.
  const formKey = JSON.stringify(filters);

  return (
    <>
      <PropertiesHero />

      <Container className="py-10 sm:py-12 lg:py-16">
        <PropertyFilters key={formKey} filters={filters} />

        <section aria-labelledby="results-heading" className="mt-10 lg:mt-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="results-heading" className="font-sans text-lg font-semibold text-charcoal">
                <span aria-live="polite">
                  {count < total ? `${count} of ${total} properties` : `${count} ${count === 1 ? "property" : "properties"}`}
                </span>
              </h2>
              <p className="text-sm text-stone">Sample listings for demonstration only.</p>
            </div>
            <SortSelect key={formKey} formId={FILTER_FORM_ID} value={filters.sort} />
          </div>

          {count > 0 ? (
            <PropertyGrid properties={properties} />
          ) : (
            <PropertyEmptyState clearHref={clearFiltersHref(filters)} />
          )}
        </section>
      </Container>
    </>
  );
}
