import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowLeftIcon, CheckIcon, HomeIcon, PinIcon } from "@/components/ui/icons";
import { getAgentIds, getAgentSummaryById, getPropertiesByAgent } from "@/lib/queries/agents";

// Pre-render every known agent at build time. Unknown ids are still rendered on request (which
// is what Supabase-backed ids will need) and fall through to notFound() below.
export async function generateStaticParams() {
  return (await getAgentIds()).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/agents/[id]">): Promise<Metadata> {
  const agent = await getAgentSummaryById((await params).id);
  if (!agent) return { title: "Agent not found" };

  const title = `${agent.fullName}, ${agent.title}`;
  return {
    title,
    description: agent.bio,
    openGraph: { title, description: agent.bio, type: "profile" },
  };
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-ivory p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-gold-strong">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-wide text-stone uppercase">{label}</dt>
        <dd className="text-lg font-semibold text-navy">{value}</dd>
      </div>
    </div>
  );
}

export default async function AgentProfilePage({ params }: PageProps<"/agents/[id]">) {
  const agent = await getAgentSummaryById((await params).id);
  if (!agent) notFound();

  const properties = await getPropertiesByAgent(agent.id);
  const { fullName, title, agencyName, bio, listingCount } = agent;
  const firstName = fullName.split(/\s+/)[0];

  // Every figure below is derived from the agent's own listings; nothing is made up.
  const cities = [...new Set(properties.map((p) => p.city))];
  const forSale = properties.filter((p) => p.listingType === "For Sale").length;
  const forRent = properties.length - forSale;
  const listingMix = [forSale && `${forSale} for sale`, forRent && `${forRent} for rent`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <Link
        href="/agents"
        className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-navy transition-colors hover:text-gold-strong"
      >
        <ArrowLeftIcon className="size-4" />
        Back to agents
      </Link>

      {/* Profile header: the agent card's navy band and overlapping monogram, at page scale. */}
      <header className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div aria-hidden="true" className="h-28 bg-navy bg-gradient-to-br from-navy-soft via-navy to-navy sm:h-36">
          <div className="h-full bg-[radial-gradient(circle_at_85%_20%,rgb(197_160_106/0.28),transparent_55%)]" />
        </div>

        <div className="px-6 pb-8 sm:px-10 sm:pb-10">
          <AgentAvatar agent={agent} className="-mt-14 size-28 text-4xl sm:-mt-16 sm:size-32 sm:text-5xl" />

          <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-gold-strong uppercase">
            {agencyName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl lg:text-5xl">{fullName}</h1>
          <p className="mt-2 text-base text-stone sm:text-lg">{title}</p>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-charcoal sm:text-lg">{bio}</p>

          <h2 className="sr-only">At a glance</h2>
          <dl className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
            <Stat
              icon={<HomeIcon className="size-5" />}
              label="Listings"
              value={listingCount}
            />
            {cities.length > 0 && (
              <Stat
                icon={<PinIcon className="size-5" />}
                label={cities.length === 1 ? "City" : "Cities"}
                value={cities.join(", ")}
              />
            )}
            {listingMix && <Stat icon={<CheckIcon className="size-5" />} label="Listing type" value={listingMix} />}
          </dl>
        </div>
      </header>

      <section aria-labelledby="agent-listings-heading" className="mt-12 lg:mt-16">
        <div className="mb-6">
          <h2 id="agent-listings-heading" className="text-2xl font-semibold sm:text-3xl">
            {firstName}&apos;s listings
          </h2>
          <p className="mt-1 text-sm text-stone">
            {listingCount} {listingCount === 1 ? "property" : "properties"} handled by {fullName}
          </p>
        </div>

        {properties.length > 0 ? (
          <PropertyGrid properties={properties} />
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center sm:py-20">
            <span className="flex size-14 items-center justify-center rounded-full bg-sand text-gold-strong">
              <HomeIcon className="size-6" />
            </span>
            <h3 className="mt-5 text-2xl font-semibold">No listings right now</h3>
            <p className="mt-3 max-w-md text-base leading-relaxed text-stone">
              {firstName} doesn&apos;t have any properties listed at the moment. Browse all listings to
              see what&apos;s available.
            </p>
            <ButtonLink href="/properties" variant="secondary" className="mt-7">
              Browse properties
            </ButtonLink>
          </div>
        )}
      </section>
    </Container>
  );
}
