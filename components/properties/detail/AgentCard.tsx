import { ButtonLink } from "@/components/ui/Button";
import { CalendarCheckIcon, MessageIcon } from "@/components/ui/icons";
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
 * Listing agent plus the two enquiry actions. The actions link to the planned /booking and /contact
 * routes, passing the property (and agent) id so those forms can be pre-filled when they are built.
 */
export function AgentCard({ agent, propertyId }: { agent: Agent | null; propertyId: string }) {
  const bookingHref = `/booking?${new URLSearchParams({ propertyId })}`;
  const contactHref = `/contact?${new URLSearchParams(
    agent ? { propertyId, agentId: agent.id } : { propertyId },
  )}`;

  return (
    <section
      aria-labelledby="agent-heading"
      className="rounded-2xl border border-line bg-white p-6 shadow-card"
    >
      <h2 id="agent-heading" className="font-sans text-xs font-semibold tracking-[0.18em] text-gold-strong uppercase">
        Listing agent
      </h2>

      {agent ? (
        <div className="mt-4 flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-navy font-serif text-lg font-semibold text-gold"
          >
            {initials(agent.fullName)}
          </span>
          <div className="min-w-0">
            <p className="font-serif text-xl font-semibold text-navy">{agent.fullName}</p>
            <p className="text-sm text-stone">{agent.title}</p>
            <p className="mt-0.5 text-sm font-medium text-charcoal">{agent.agencyName}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone">Agent details are not available for this listing.</p>
      )}

      <div className="mt-6 grid gap-3">
        <ButtonLink href={bookingHref} size="lg" className="w-full">
          <CalendarCheckIcon className="size-5" />
          Book a Viewing
        </ButtonLink>
        <ButtonLink href={contactHref} variant="secondary" size="lg" className="w-full">
          <MessageIcon className="size-5" />
          Contact Agent
        </ButtonLink>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-stone">
        Sample listing and agent for demonstration only.
      </p>
    </section>
  );
}
