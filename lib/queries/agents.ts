import { DEMO_AGENTS, DEMO_PROPERTIES } from "@/lib/data/demo";
import type { AgentSummary } from "@/types/agent";

/*
 * Agent data access. It reads the local demo data for now. Phase 6 replaces the body with a
 * Supabase query (agents joined with a count of their properties), so the page stays unchanged.
 */

/** Every agent with the number of listings assigned to them, in directory order. */
export async function getAgents(): Promise<AgentSummary[]> {
  return DEMO_AGENTS.map((agent) => ({
    ...agent,
    listingCount: DEMO_PROPERTIES.filter((p) => p.agentId === agent.id).length,
  }));
}
