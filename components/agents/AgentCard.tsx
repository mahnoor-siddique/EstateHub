import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, HomeIcon } from "@/components/ui/icons";
import type { AgentSummary } from "@/types/agent";
import { AgentAvatar } from "./AgentAvatar";

/**
 * Agent directory card: monogram (or photo), name, role, agency, short bio, listing count and a
 * link to the agent's profile. One tab stop per card: the "View Profile" link, whose accessible
 * name includes the agent's name.
 */
export function AgentCard({ agent }: { agent: AgentSummary }) {
  const { id, fullName, title, agencyName, bio, listingCount } = agent;

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-shadow duration-300 hover:shadow-lift">
      {/* Decorative navy band the avatar sits on. */}
      <div aria-hidden="true" className="h-24 bg-navy bg-gradient-to-br from-navy-soft via-navy to-navy">
        <div className="h-full bg-[radial-gradient(circle_at_85%_20%,rgb(197_160_106/0.28),transparent_55%)]" />
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6">
        <AgentAvatar agent={agent} className="-mt-12 size-24 text-3xl" />

        <h3 className="mt-4 text-2xl font-semibold">{fullName}</h3>
        <p className="mt-1 text-sm text-stone">{title}</p>
        <p className="mt-3 text-xs font-semibold tracking-[0.16em] text-gold-strong uppercase">
          {agencyName}
        </p>

        {/* flex-1 pushes the footer to the bottom so footers line up across a grid row. */}
        <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-charcoal">{bio}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="flex items-center gap-2 text-sm text-charcoal">
            <HomeIcon className="size-[1.125rem] text-gold-strong" />
            <span>
              <span className="font-semibold">{listingCount}</span>{" "}
              {listingCount === 1 ? "listing" : "listings"}
            </span>
          </p>
          <ButtonLink href={`/agents/${id}`} variant="secondary">
            View Profile
            <span className="sr-only">: {fullName}</span>
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
