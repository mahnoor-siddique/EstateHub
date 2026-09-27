import { ButtonLink } from "@/components/ui/Button";
import { UserCheckIcon } from "@/components/ui/icons";

/** Shown on /agents when no agents have been added yet. Same look as the property empty state. */
export function AgentEmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center sm:py-20">
      <span className="flex size-14 items-center justify-center rounded-full bg-sand text-gold-strong">
        <UserCheckIcon className="size-6" />
      </span>
      <h3 className="mt-5 text-2xl font-semibold">No agents listed yet</h3>
      <p className="mt-3 max-w-md text-base leading-relaxed text-stone">
        Our agent directory is being set up. Meanwhile, you can browse our property listings.
      </p>
      <ButtonLink href="/properties" variant="secondary" className="mt-7">
        Browse properties
      </ButtonLink>
    </div>
  );
}
