import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, HomeIcon } from "@/components/ui/icons";
import { AGENT_BANNER_PHOTOS } from "@/lib/data/agent-photos";
import type { AgentSummary } from "@/types/agent";
import { AgentAvatar } from "./AgentAvatar";

/**
 * Agent directory card: banner portrait (or navy band + monogram when there is none), name, role, agency, short bio, listing count and a
 * link to the agent's profile. One tab stop per card: the "View Profile" link, whose accessible
 * name includes the agent's name.
 */
export function AgentCard({ agent }: { agent: AgentSummary }) {
  const { id, fullName, title, agencyName, bio, listingCount } = agent;
  const photo = AGENT_BANNER_PHOTOS[id];

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-shadow duration-300 hover:shadow-lift">
      {photo ? (
        // The portrait replaces both the navy band and the monogram. The band is taller by the 3rem
        // the overlapping monogram used to take, so the card keeps the same overall height.
        // object-position keeps the face (left of centre, upper half) in frame at every width.
        <div className="relative h-36 bg-navy">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-[38%_20%]"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-navy/25 to-transparent to-50%" />
        </div>
      ) : (
        /* Decorative navy band the avatar sits on. */
        <div aria-hidden="true" className="h-24 bg-navy bg-gradient-to-br from-navy-soft via-navy to-navy">
          <div className="h-full bg-[radial-gradient(circle_at_85%_20%,rgb(197_160_106/0.28),transparent_55%)]" />
        </div>
      )}

      <div className="flex flex-1 flex-col px-6 pb-6">
        {!photo && <AgentAvatar agent={agent} className="-mt-12 size-24 text-3xl" />}

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
