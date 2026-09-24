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
 * Round agent portrait. Until real photos exist it shows a navy monogram with gold serif initials.
 * When `profileImage` is set the photo fills the same circle, so cards need no layout changes.
 * Decorative for screen readers: the agent's name is always printed next to it.
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
        <Image src={agent.profileImage} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <>
          <span className="absolute inset-1.5 rounded-full border border-gold/40" />
          {initials(agent.fullName)}
        </>
      )}
    </span>
  );
}
