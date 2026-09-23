import { ButtonLink } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";

/** Shown when no listings match the current filters, with a way straight back to results. */
export function PropertyEmptyState({ clearHref }: { clearHref: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center sm:py-20">
      <span className="flex size-14 items-center justify-center rounded-full bg-sand text-gold-strong">
        <SearchIcon className="size-6" />
      </span>
      <h3 className="mt-5 text-2xl font-semibold">No properties match your filters</h3>
      <p className="mt-3 max-w-md text-base leading-relaxed text-stone">
        Try widening the price range, choosing another city, or removing a few amenities.
      </p>
      <ButtonLink href={clearHref} scroll={false} variant="secondary" className="mt-7">
        Clear all filters
      </ButtonLink>
    </div>
  );
}
