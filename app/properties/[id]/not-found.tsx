import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowLeftIcon, HomeIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Property not found",
};

/** Shown when /properties/[id] is visited with an id that doesn't match any listing. */
export default function PropertyNotFound() {
  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-sand text-gold-strong">
          <HomeIcon className="size-7" />
        </span>
        <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">
          Listing not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">
          This property isn&apos;t available
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone sm:text-lg">
          The link may be mistyped, or the listing may have been removed. Browse our current properties
          to find something similar.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/properties">
            <ArrowLeftIcon className="size-4" />
            Browse properties
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
