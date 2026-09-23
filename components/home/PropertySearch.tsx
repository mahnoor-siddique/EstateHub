import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Field, PriceInput, Select } from "@/components/ui/form";
import { SearchIcon } from "@/components/ui/icons";
import { CITIES } from "@/lib/site";
import { PROPERTY_TYPES } from "@/types/property";

const LISTING_OPTIONS = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
] as const;

/**
 * Homepage search panel, overlapping the bottom of the hero.
 * UI only for now: it is a plain GET form, so no client JavaScript is needed. Its field names
 * (city, type, listing, minPrice, maxPrice, bedrooms) are the URL params the Phase 3 listings
 * page will read. Nothing is filtered or fetched yet.
 */
export function PropertySearch() {
  return (
    <section aria-labelledby="search-heading" className="relative z-10 -mt-14 sm:-mt-16">
      <Container>
        <form
          role="search"
          action="/properties"
          method="get"
          aria-labelledby="search-heading"
          className="rounded-2xl border border-line bg-white p-5 shadow-lift sm:p-7"
        >
          <h2 id="search-heading" className="sr-only">
            Search properties
          </h2>

          <fieldset className="mb-5">
            <legend className="sr-only">Listing type</legend>
            <div className="inline-flex rounded-full bg-sand p-1">
              {LISTING_OPTIONS.map(({ value, label }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="listing"
                    value={value}
                    defaultChecked={value === "sale"}
                    className="peer sr-only"
                  />
                  <span className="inline-flex min-h-11 items-center rounded-full px-6 text-sm font-medium text-charcoal transition-colors peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-strong">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
            <Field label="City" htmlFor="search-city">
              <Select id="search-city" name="city">
                <option value="">All cities</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Property type" htmlFor="search-type">
              <Select id="search-type" name="type">
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Min price (PKR)" htmlFor="search-min">
              <PriceInput id="search-min" name="minPrice" placeholder="No minimum" />
            </Field>

            <Field label="Max price (PKR)" htmlFor="search-max">
              <PriceInput id="search-max" name="maxPrice" placeholder="No maximum" />
            </Field>

            <Field label="Bedrooms" htmlFor="search-beds">
              <Select id="search-beds" name="bedrooms">
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}+
                  </option>
                ))}
              </Select>
            </Field>

            <Button type="submit" size="lg" className="w-full sm:col-span-2 md:col-span-1 lg:w-auto">
              <SearchIcon className="size-5" />
              Search Properties
            </Button>
          </div>
        </form>
      </Container>
    </section>
  );
}
