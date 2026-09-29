import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getProperties } from "@/lib/queries/supabase/properties";
import { cn } from "@/lib/utils/cn";
import { parsePropertyFilters } from "@/lib/utils/property-filters";
import faisalabad from "@/public/images/cities/faisalabad.png";
import islamabad from "@/public/images/cities/islamabad.jpg";
import karachi from "@/public/images/cities/karachi.jpg";
import lahore from "@/public/images/cities/lahore.jpg";
import rawalpindi from "@/public/images/cities/rawalpindi.jpg";

/*
 * The cities shown on the homepage, each with a landmark photo (static assets in
 * public/images/cities). Multan is left out here until it has listings; it is still a search
 * option everywhere else (lib/site.ts CITIES).
 *
 * Desktop uses a 6-column grid: Lahore and Islamabad share the first row, Karachi, Rawalpindi and
 * Faisalabad the second. On tablets (2 columns) Faisalabad spans both columns so no gap is left.
 * `position` keeps each landmark in frame; `sizes` matches the card's width at each breakpoint.
 */
type City = { name: string; image: StaticImageData; position: string; span: string; sizes: string };

const WIDE_SIZES = "(min-width: 1280px) 600px, (min-width: 640px) 50vw, 100vw";
const NARROW_SIZES = "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

const CITY_CARDS: City[] = [
  { name: "Lahore", image: lahore, position: "object-[50%_55%]", span: "lg:col-span-3", sizes: WIDE_SIZES },
  { name: "Islamabad", image: islamabad, position: "object-[70%_75%]", span: "lg:col-span-3", sizes: WIDE_SIZES },
  { name: "Karachi", image: karachi, position: "object-[50%_62%]", span: "lg:col-span-2", sizes: NARROW_SIZES },
  { name: "Rawalpindi", image: rawalpindi, position: "object-[55%_55%]", span: "lg:col-span-2", sizes: NARROW_SIZES },
  {
    name: "Faisalabad",
    image: faisalabad,
    position: "object-[50%_45%]",
    span: "sm:col-span-2 lg:col-span-2",
    sizes: "(min-width: 1280px) 400px, (min-width: 1024px) 33vw, 100vw",
  },
];

/** Listings per city from Supabase (with no filters, getProperties returns every listing). Null if
 *  Supabase fails: the cards still link to their filtered results, just without a count, so one
 *  section can never take the whole homepage down. */
async function getCityCounts(): Promise<Map<string, number> | null> {
  try {
    const { properties } = await getProperties(parsePropertyFilters({}));
    const counts = new Map<string, number>();
    for (const { city } of properties) counts.set(city, (counts.get(city) ?? 0) + 1);
    return counts;
  } catch (error) {
    console.error("City counts unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

function countLabel(count: number) {
  if (count === 0) return "No listings yet";
  return `${count.toLocaleString("en-US")} ${count === 1 ? "property" : "properties"}`;
}

export async function PopularCities() {
  // Counts come from Supabase, so render on each request instead of freezing a build-time snapshot.
  await connection();
  const counts = await getCityCounts();

  return (
    <section aria-labelledby="cities-heading" className="bg-sand py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Popular cities"
          title={<span id="cities-heading">Find your place in the city you love</span>}
          description="Browse homes across five of Pakistan's leading cities."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
          {CITY_CARDS.map(({ name, image, position, span, sizes }) => (
            <li key={name} className={span}>
              <Link
                href={`/properties?city=${encodeURIComponent(name)}`}
                className="group relative flex h-60 items-end overflow-hidden rounded-card bg-navy shadow-card transition-shadow duration-300 hover:shadow-lift focus-visible:outline-gold-strong sm:h-64 lg:h-72"
              >
                {/* Decorative: the link is named by the city heading below. */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <Image
                    src={image}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes={sizes}
                    className={cn("object-cover", position)}
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent"
                />
                <div className="relative flex w-full items-end justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{name}</h3>
                    {counts && (
                      <p className="mt-1 text-sm text-white/85">{countLabel(counts.get(name) ?? 0)}</p>
                    )}
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-navy transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none">
                    <ArrowRightIcon className="size-5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
