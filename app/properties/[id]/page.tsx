import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { ArrowLeftIcon, PinIcon } from "@/components/ui/icons";
import { AgentCard } from "@/components/properties/detail/AgentCard";
import { PropertyAmenities } from "@/components/properties/detail/PropertyAmenities";
import { PropertyInfo } from "@/components/properties/detail/PropertyInfo";
import { PropertyKeyFacts } from "@/components/properties/detail/PropertyKeyFacts";
import { PropertyMainImage } from "@/components/properties/detail/PropertyMainImage";
import { getAgentById, getPropertyById, getPropertyIds } from "@/lib/queries/properties";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

// Pre-render every known listing at build time. Unknown ids are still rendered on request (which
// is what Supabase-backed ids will need) and fall through to notFound() below.
export async function generateStaticParams() {
  return (await getPropertyIds()).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/properties/[id]">): Promise<Metadata> {
  const property = await getPropertyById((await params).id);
  if (!property) return { title: "Property not found" };

  const { title, listingType, propertyType, location, city, bedrooms, bathrooms } = property;
  const description = `${propertyType} ${listingType.toLowerCase()} in ${location}, ${city}: ${formatPrice(
    property.price,
    listingType,
  )}, ${bedrooms} bedrooms, ${bathrooms} bathrooms.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-8">
      <h2 id={id} className="text-2xl font-semibold sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function PropertyDetailsPage({ params }: PageProps<"/properties/[id]">) {
  const property = await getPropertyById((await params).id);
  if (!property) notFound();

  const agent = await getAgentById(property.agentId);
  const sale = property.listingType === "For Sale";

  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <Link
        href="/properties"
        className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-navy transition-colors hover:text-gold-strong"
      >
        <ArrowLeftIcon className="size-4" />
        Back to properties
      </Link>

      {/* Title block: name + location on the left, price on the right (stacked on small screens). */}
      <header className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
                sale ? "bg-navy text-white" : "bg-gold text-navy",
              )}
            >
              {property.listingType}
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium tracking-wide text-charcoal uppercase">
              {property.propertyType}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-balance sm:text-4xl lg:text-5xl">
            {property.title}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-base text-stone">
            <PinIcon className="size-5 shrink-0 text-gold-strong" />
            {property.location}, {property.city}
          </p>
        </div>

        <div className="shrink-0 md:text-right">
          <p className="text-xs font-semibold tracking-[0.18em] text-stone uppercase">
            {sale ? "Asking price" : "Monthly rent"}
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-navy sm:text-4xl">
            {formatPrice(property.price, property.listingType)}
          </p>
        </div>
      </header>

      <div className="mt-8">
        <PropertyMainImage property={property} />
      </div>

      {/*
        One grid, three areas. Phones/tablets read top to bottom: key facts, agent card (so the
        enquiry actions come early), then the details. From lg the agent card becomes a sticky
        sidebar spanning both rows on the right.
      */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <PropertyKeyFacts property={property} />
        </div>

        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="lg:sticky lg:top-28">
            <AgentCard agent={agent} propertyId={property.id} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-10 lg:col-start-1 lg:row-start-2">
          <Section id="description-heading" title="About this property">
            <p className="max-w-3xl text-base leading-relaxed text-charcoal sm:text-lg">
              {property.description}
            </p>
          </Section>

          <Section id="amenities-heading" title="Amenities">
            <PropertyAmenities amenities={property.amenities} />
          </Section>

          <Section id="details-heading" title="Property details">
            <PropertyInfo property={property} />
          </Section>
        </div>
      </div>
    </Container>
  );
}
