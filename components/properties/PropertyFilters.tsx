import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, PriceInput, Select } from "@/components/ui/form";
import { SearchIcon } from "@/components/ui/icons";
import { CITIES } from "@/lib/site";
import {
  hasActiveFilters,
  LISTING_PARAM_OPTIONS,
  type PropertyFilterValues,
} from "@/lib/utils/property-filters";
import { PROPERTY_TYPES } from "@/types/property";

/**
 * Filter bar at the top of /properties.
 * A plain GET form back to /properties, so it works without client JavaScript and every search is a
 * shareable URL. Fields are pre-filled from the current URL. It uses the same param names as the
 * homepage search.
 */
export function PropertyFilters({ values }: { values: PropertyFilterValues }) {
  const active = hasActiveFilters(values);

  return (
    <form
      role="search"
      action="/properties"
      method="get"
      aria-labelledby="filters-heading"
      className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="filters-heading" className="font-sans text-base font-semibold text-navy">
          Search &amp; filter
        </h2>
        {active && (
          <Link
            href="/properties"
            className="-my-2 inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-gold-strong underline-offset-4 hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
        <Field label="City" htmlFor="filter-city" className="col-span-2 sm:col-span-1">
          <Select id="filter-city" name="city" defaultValue={values.city}>
            <option value="">All cities</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Property type" htmlFor="filter-type" className="col-span-2 sm:col-span-1">
          <Select id="filter-type" name="type" defaultValue={values.type}>
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Listing type" htmlFor="filter-listing" className="col-span-2 md:col-span-1">
          <Select id="filter-listing" name="listing" defaultValue={values.listing}>
            <option value="">Sale or rent</option>
            {LISTING_PARAM_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        {/* Price range: min + max side by side even on phones. */}
        <Field label="Min price (PKR)" htmlFor="filter-min">
          <PriceInput id="filter-min" name="minPrice" placeholder="No min" defaultValue={values.minPrice} />
        </Field>

        <Field label="Max price (PKR)" htmlFor="filter-max">
          <PriceInput id="filter-max" name="maxPrice" placeholder="No max" defaultValue={values.maxPrice} />
        </Field>

        <Button type="submit" size="lg" className="col-span-2 md:col-span-1 lg:w-auto">
          <SearchIcon className="size-5" />
          Search
        </Button>
      </div>
    </form>
  );
}
