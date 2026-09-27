import { connection } from "next/server";
import { Container } from "@/components/ui/Container";
import { getAgents } from "@/lib/queries/supabase/agents";
import { getProperties } from "@/lib/queries/supabase/properties";
import { parsePropertyFilters } from "@/lib/utils/property-filters";

type Stat = { value: number | null; label: string };

/** Live figures from Supabase. With no filters, getProperties returns every listing, so cities are
 *  counted from the same rows as the total. Client Satisfaction has no data source in the schema
 *  yet, so it stays null ("—") rather than showing an invented figure. Every value is null if
 *  Supabase fails, so one section can never take the whole homepage down. */
async function getStats(): Promise<Stat[]> {
  try {
    const [{ properties, total }, agents] = await Promise.all([
      getProperties(parsePropertyFilters({})),
      getAgents(),
    ]);
    return [
      { value: total, label: "Properties" },
      { value: agents.length, label: "Trusted Agents" },
      { value: new Set(properties.map((p) => p.city)).size, label: "Cities" },
      { value: null, label: "Client Satisfaction" },
    ];
  } catch (error) {
    console.error("Homepage stats unavailable:", error instanceof Error ? error.message : error);
    return ["Properties", "Trusted Agents", "Cities", "Client Satisfaction"].map((label) => ({ value: null, label }));
  }
}

/** Headline numbers. Static typography only, no counting animation. */
export async function Stats() {
  // Figures come from Supabase, so render on each request instead of freezing a build-time snapshot.
  await connection();
  const stats = await getStats();

  return (
    <section aria-labelledby="stats-heading" className="py-16 lg:py-20">
      <Container>
        <h2 id="stats-heading" className="sr-only">
          EstateHub at a glance
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-0">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col-reverse items-center gap-2 text-center lg:border-l lg:border-line lg:first:border-l-0"
            >
              <dt className="text-xs font-semibold tracking-[0.18em] text-stone uppercase sm:text-sm">
                {label}
              </dt>
              <dd className="font-serif text-4xl font-semibold text-navy sm:text-5xl">
                {value === null ? (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">Not available</span>
                  </>
                ) : (
                  value.toLocaleString("en-US")
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
