import { DEMO_AGENTS, DEMO_PROPERTIES } from "@/lib/data/demo";
import type { Agent, AgentSummary } from "@/types/agent";
import type { PropertySummary } from "@/types/property";

/*
 * Agent data access. It reads the local demo data for now. Phase 6 replaces the bodies with
 * Supabase queries (agents joined with their properties), so pages stay unchanged.
 */

function listingsFor(agentId: string): PropertySummary[] {
  return DEMO_PROPERTIES.filter((p) => p.agentId === agentId);
}

function withListingCount(agent: Agent): AgentSummary {
  return { ...agent, listingCount: listingsFor(agent.id).length };
}

/** Every agent with the number of listings assigned to them, in directory order. */
export async function getAgents(): Promise<AgentSummary[]> {
  return DEMO_AGENTS.map(withListingCount);
}

/** One agent with their listing count, or null when the id does not exist. */
export async function getAgentSummaryById(id: string): Promise<AgentSummary | null> {
  const agent = DEMO_AGENTS.find((a) => a.id === id);
  return agent ? withListingCount(agent) : null;
}

/** Ids of every agent, used to pre-render the profile pages at build time. */
export async function getAgentIds(): Promise<string[]> {
  return DEMO_AGENTS.map((a) => a.id);
}

/** An agent's listings, newest first (the same default order as /properties). */
export async function getPropertiesByAgent(agentId: string): Promise<PropertySummary[]> {
  return listingsFor(agentId).sort(
    (a, b) => b.listedAt.localeCompare(a.listedAt) || a.id.localeCompare(b.id),
  );
}
