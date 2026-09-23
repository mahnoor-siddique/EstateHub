import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, PriceInput, Select } from "@/components/ui/form";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/icons";
import { CITIES } from "@/lib/site";
import {
  clearFiltersHref,
  countActiveFilters,
  ROOM_COUNT_OPTIONS,
  type PropertyFilters as Filters,
} from "@/lib/utils/property-filters";
import { AMENITIES, LISTING_TYPES, PROPERTY_TYPES } from "@/types/property";
import { FilterForm } from "./FilterForm";

export const FILTER_FORM_ID = "property-filters";

function RoomSelect({ id, name, value }: { id: string; name: string; value?: number }) {
  return (
    <Select id={id} name={name} defaultValue={value ? String(value) : ""}>
      <option value="">Any</option>
      {ROOM_COUNT_OPTIONS.map((n) => (
        <option key={n} value={n}>
          {n}+
        </option>
      ))}
    </Select>
  );
}

/**
 * Filter bar at the top of /properties. Every field is pre-filled from the URL, and submitting
 * writes the choices back to the URL (see FilterForm), which the page reads to filter the results.
 * Primary filters are always visible; bedrooms, bathrooms and amenities sit under "More filters",
 * a native <details> that opens by itself when one of them is active.
 */
export function PropertyFilters({ filters }: { filters: Filters }) {
  const activeCount = countActiveFilters(filters);
  const moreCount =
    (filters.bedrooms ? 1 : 0) + (filters.bathrooms ? 1 : 0) + filters.amenities.length;

  return (
    <FilterForm
      id={FILTER_FORM_ID}
      role="search"
      aria-labelledby="filters-heading"
      className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="filters-heading" className="font-sans text-base font-semibold text-navy">
          Search &amp; filter
        </h2>
        {activeCount > 0 && (
          <Link
            href={clearFiltersHref(filters)}
            scroll={false}
            className="-my-2 inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-gold-strong underline-offset-4 hover:underline"
          >
            Clear all filters
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
        <Field label="City" htmlFor="filter-city" className="col-span-2 sm:col-span-1">
          <Select id="filter-city" name="city" defaultValue={filters.city ?? ""}>
            <option value="">All cities</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Property type" htmlFor="filter-type" className="col-span-2 sm:col-span-1">
          <Select id="filter-type" name="propertyType" defaultValue={filters.propertyType ?? ""}>
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Listing type" htmlFor="filter-listing" className="col-span-2 md:col-span-1">
          <Select id="filter-listing" name="listingType" defaultValue={filters.listingType ?? ""}>
            <option value="">Sale or rent</option>
            {LISTING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        {/* Price range: min + max side by side even on phones. */}
        <Field label="Min price (PKR)" htmlFor="filter-min">
          <PriceInput id="filter-min" name="minPrice" placeholder="No min" defaultValue={filters.minPrice} />
        </Field>

        <Field label="Max price (PKR)" htmlFor="filter-max">
          <PriceInput id="filter-max" name="maxPrice" placeholder="No max" defaultValue={filters.maxPrice} />
        </Field>

        <Button type="submit" size="lg" className="col-span-2 md:col-span-1 lg:w-auto">
          <SearchIcon className="size-5" />
          Search
        </Button>
      </div>

      <details open={moreCount > 0} className="group mt-5 border-t border-line pt-3">
        <summary className="-mx-2 inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-2 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
          More filters
          {moreCount > 0 && (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-navy px-1.5 text-xs font-semibold text-white">
              <span className="sr-only">(</span>
              {moreCount}
              <span className="sr-only"> active)</span>
            </span>
          )}
          <ChevronDownIcon className="size-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] lg:gap-8">
          <div className="grid grid-cols-2 gap-4 content-start">
            <Field label="Bedrooms" htmlFor="filter-beds">
              <RoomSelect id="filter-beds" name="bedrooms" value={filters.bedrooms} />
            </Field>
            <Field label="Bathrooms" htmlFor="filter-baths">
              <RoomSelect id="filter-baths" name="bathrooms" value={filters.bathrooms} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-xs font-semibold tracking-wide text-navy uppercase">
              Amenities
            </legend>
            <div className="grid grid-cols-1 gap-x-4 min-[360px]:grid-cols-2 md:grid-cols-4">
              {AMENITIES.map((amenity) => (
                <label
                  key={amenity}
                  className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-charcoal"
                >
                  <input
                    type="checkbox"
                    name="amenities"
                    value={amenity}
                    defaultChecked={filters.amenities.includes(amenity)}
                    className="size-[1.125rem] shrink-0 cursor-pointer rounded accent-navy"
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>
    </FilterForm>
  );
}
