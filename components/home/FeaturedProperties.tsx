import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { DEMO_PROPERTIES } from "@/lib/data/demo";

export function FeaturedProperties() {
  return (
    <section aria-labelledby="featured-heading" className="pb-20 lg:pb-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Featured properties"
            title={<span id="featured-heading">Homes worth a closer look</span>}
            description="A preview of the kind of properties you'll find on EstateHub."
          />
          <ButtonLink href="/properties" variant="secondary" className="self-start sm:self-auto">
            View all properties
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {DEMO_PROPERTIES.map((property, index) => (
            <li key={property.id} className="flex">
              <PropertyCard property={property} tone={index % 2 === 0 ? "dusk" : "slate"} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
