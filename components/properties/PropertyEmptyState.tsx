import { ButtonLink } from "@/components/ui/Button";
import { HomeIcon, SearchIcon } from "@/components/ui/icons";

type EmptyReason = "no-matches" | "no-listings";

/**
 * Shown when the results list is empty. "no-matches": listings exist but none fit the filters, so
 * offer a way straight back to all results. "no-listings": there are no listings at all yet, so
 * clearing filters would not help.
 */
export function PropertyEmptyState({
  clearHref,
  reason = "no-matches",
}: {
  clearHref: string;
  reason?: EmptyReason;
}) {
  const noListings = reason === "no-listings";
  const Icon = noListings ? HomeIcon : SearchIcon;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center sm:py-20">
      <span className="flex size-14 items-center justify-center rounded-full bg-sand text-gold-strong">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-5 text-2xl font-semibold">
        {noListings ? "No properties listed yet" : "No properties match your filters"}
      </h3>
      <p className="mt-3 max-w-md text-base leading-relaxed text-stone">
        {noListings
          ? "New listings are on their way. Please check back soon."
          : "Try widening the price range, choosing another city, or removing a few amenities."}
      </p>
      {noListings ? (
        <ButtonLink href="/" variant="secondary" className="mt-7">
          Back to home
        </ButtonLink>
      ) : (
        <ButtonLink href={clearHref} scroll={false} variant="secondary" className="mt-7">
          Clear all filters
        </ButtonLink>
      )}
    </div>
  );
}
