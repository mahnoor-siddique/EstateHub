import type { Metadata } from "next";
import Link from "next/link";
import { AgentAvatar } from "@/components/agents/AgentAvatar";
import { BookingPropertyCard } from "@/components/booking/BookingPropertyCard";
import { ContactForm } from "@/components/contact/ContactForm";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/lib/auth/session";
import { getAgentById, getAgents } from "@/lib/queries/supabase/agents";
import { getPropertyById } from "@/lib/queries/supabase/properties";
import type { Agent } from "@/types/agent";
import type { PropertyDetail } from "@/types/property";

export const metadata: Metadata = {
  title: "Contact an agent",
  description:
    "Send an enquiry to an EstateHub agent about a property for sale or rent, or ask a general question.",
};

/*
 * /contact — public; guests and signed-in users can both send an enquiry.
 *   ?propertyId=<uuid>  enquiry about a listing (the agent is always the listing's agent)
 *   ?agentId=<uuid>     enquiry for a specific agent
 *   neither             general enquiry, with an optional agent picker
 * Unknown or malformed ids fall back to a general enquiry with a short note.
 */
export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const params = await searchParams;
  const propertyParam = typeof params.propertyId === "string" ? params.propertyId : "";
  const agentParam = typeof params.agentId === "string" ? params.agentId : "";

  const [user, property] = await Promise.all([
    getCurrentUser(),
    propertyParam ? getPropertyById(propertyParam) : Promise.resolve(null),
  ]);
  // A listing's enquiries always go to its own agent, whatever agentId says.
  const agentId = property?.agentId ?? agentParam;
  const agent = agentId ? await getAgentById(agentId) : null;
  const agentOptions = agent ? [] : await getAgents();
  const contextMissing = Boolean((propertyParam && !property) || (!propertyParam && agentParam && !agent));

  return (
    <Container className="py-10 sm:py-12 lg:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.22em] text-gold-strong uppercase">Contact</p>
        <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">
          {agent ? `Contact ${agent.fullName}` : "Talk to an agent"}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          {property
            ? "Ask about this listing and the agent handling it will get back to you."
            : "Send us your question and we'll put you in touch with the right person."}
        </p>
      </header>

      {contextMissing && (
        <p role="status" className="mt-6 rounded-lg border border-gold/50 bg-sand/60 px-4 py-3 text-sm text-navy">
          We couldn&apos;t find that {propertyParam ? "listing" : "agent"}. You can still send a general
          enquiry below.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        {(property || agent) && (
          <aside className="flex flex-col gap-5 lg:col-start-2 lg:row-start-1">
            <div className="flex flex-col gap-5 lg:sticky lg:top-28">
              {property && <BookingPropertyCard property={property} eyebrow="About this property" />}
              {agent && <AgentSummaryCard agent={agent} property={property} />}
            </div>
          </aside>
        )}
        <section
          aria-label="Contact form"
          className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8 lg:col-start-1 lg:row-start-1"
        >
          <ContactForm
            propertyId={property?.id ?? null}
            agent={agent && { id: agent.id, fullName: agent.fullName, agencyName: agent.agencyName }}
            agentOptions={agentOptions.map(({ id, fullName, agencyName }) => ({ id, fullName, agencyName }))}
            defaults={{ name: user?.fullName ?? "", email: user?.email ?? "" }}
          />
        </section>
      </div>
    </Container>
  );
}

function AgentSummaryCard({ agent, property }: { agent: Agent; property: PropertyDetail | null }) {
  return (
    <article className="rounded-card border border-line bg-white p-5 shadow-card">
      <p className="text-xs font-semibold tracking-[0.18em] text-gold-strong uppercase">
        {property ? "Listing agent" : "Your agent"}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <AgentAvatar agent={agent} className="size-14 text-lg" />
        <div className="min-w-0">
          <p className="font-serif text-xl font-semibold text-navy">
            <Link href={`/agents/${agent.id}`} className="transition-colors hover:text-gold-strong">
              {agent.fullName}
            </Link>
          </p>
          {agent.title && <p className="text-sm text-stone">{agent.title}</p>}
          {agent.agencyName && <p className="text-sm font-medium text-charcoal">{agent.agencyName}</p>}
        </div>
      </div>
    </article>
  );
}
