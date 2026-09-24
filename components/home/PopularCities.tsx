import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PlaceholderImage, type Tone } from "@/components/ui/PlaceholderImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DEMO_CITY_COUNTS } from "@/lib/data/demo";
import { CITIES } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

/** Editorial 4-column layout on desktop: Lahore and Multan get double-width cards. */
const WIDE = new Set<string>(["Lahore", "Multan"]);
const TONES: Tone[] = ["dusk", "slate", "dusk", "slate", "dusk", "slate"];

export function PopularCities() {
  return (
    <section aria-labelledby="cities-heading" className="bg-sand py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Popular cities"
          title={<span id="cities-heading">Find your place in the city you love</span>}
          description="Browse homes across six of Pakistan's leading cities."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {CITIES.map((city, index) => (
            <li key={city} className={cn(WIDE.has(city) && "lg:col-span-2")}>
              <Link
                href={`/properties?city=${encodeURIComponent(city)}`}
                className="group relative flex h-60 items-end overflow-hidden rounded-card bg-navy shadow-card transition-shadow duration-300 hover:shadow-lift focus-visible:outline-gold-strong sm:h-64 lg:h-72"
              >
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <div className={cn("absolute inset-0", index % 2 === 1 && "-scale-x-100")}>
                    <PlaceholderImage scene="skyline" tone={TONES[index]} />
                  </div>
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent"
                />
                <div className="relative flex w-full items-end justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{city}</h3>
                    <p className="mt-1 text-sm text-white/85">
                      {DEMO_CITY_COUNTS[city]} properties
                    </p>
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
