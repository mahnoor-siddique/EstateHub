import { Container } from "@/components/ui/Container";
import { DEMO_STATS } from "@/lib/data/demo";

/** Headline numbers. Static typography only, no counting animation. */
export function Stats() {
  return (
    <section aria-labelledby="stats-heading" className="py-16 lg:py-20">
      <Container>
        <h2 id="stats-heading" className="sr-only">
          EstateHub at a glance
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-0">
          {DEMO_STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col-reverse items-center gap-2 text-center lg:border-l lg:border-line lg:first:border-l-0"
            >
              <dt className="text-xs font-semibold tracking-[0.18em] text-stone uppercase sm:text-sm">
                {label}
              </dt>
              <dd className="font-serif text-4xl font-semibold text-navy sm:text-5xl">{value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
