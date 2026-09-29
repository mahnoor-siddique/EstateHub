import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { Agent } from "@/types/agent";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Round agent portrait: the agent's profile_image when set, otherwise a navy monogram with gold
 * serif initials in the same circle, so cards need no layout changes.
 * The portraits are wide banners with the face left of centre, so the circle is cropped around
 * 32% across rather than the middle. Decorative for screen readers: the agent's name is always
 * printed next to it.
 */
export function AgentAvatar({ agent, className }: { agent: Agent; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-navy bg-gradient-to-br from-navy-soft to-navy font-serif font-semibold tracking-wide text-gold ring-4 ring-white shadow-card",
        className,
      )}
    >
      {agent.profileImage ? (
        <Image src={agent.profileImage} alt="" fill sizes="128px" className="object-cover object-[32%_50%]" />
      ) : (
        <>
          <span className="absolute inset-1.5 rounded-full border border-gold/40" />
          {initials(agent.fullName)}
        </>
      )}
    </span>
  );
}
