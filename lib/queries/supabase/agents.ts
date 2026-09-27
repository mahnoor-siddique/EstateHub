import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import {
  AGENT_COLUMNS,
  DataAccessError,
  IMAGE_COLUMNS,
  PROPERTY_SUMMARY_COLUMNS,
  isUuid,
  toAgent,
  toPropertySummary,
  type AgentRow,
} from "@/lib/queries/supabase/shared";
import type { Agent, AgentSummary } from "@/types/agent";
import type { PropertySummary } from "@/types/property";

/*
 * Supabase versions of the agent queries in lib/queries/agents.ts, with the same names and
 * signatures. Listing counts come from Postgres (an embedded count of each agent's properties)
 * rather than loading the listings themselves.
 */

const AGENT_WITH_COUNT_COLUMNS = `${AGENT_COLUMNS}, properties(count)`;

function toAgentSummary(row: AgentRow & { properties: { count: number }[] }): AgentSummary {
  return { ...toAgent(row), listingCount: row.properties[0]?.count ?? 0 };
}

/** Every agent with the number of listings assigned to them, in directory order (oldest first). */
export async function getAgents(): Promise<AgentSummary[]> {
  const { data, error } = await createPublicClient()
    .from("agents")
    .select(AGENT_WITH_COUNT_COLUMNS)
    .order("created_at")
    .order("id");

  if (error) throw new DataAccessError("load agents", error);
  return data.map(toAgentSummary);
}

/** One agent, or null when the id does not exist. */
export async function getAgentById(id: string): Promise<Agent | null> {
  if (!isUuid(id)) return null;

  const { data, error } = await createPublicClient()
    .from("agents")
    .select(AGENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DataAccessError("load agent", error);
  return data ? toAgent(data) : null;
}

/** One agent with their listing count, or null when the id does not exist. */
export async function getAgentSummaryById(id: string): Promise<AgentSummary | null> {
  if (!isUuid(id)) return null;

  const { data, error } = await createPublicClient()
    .from("agents")
    .select(AGENT_WITH_COUNT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DataAccessError("load agent", error);
  return data ? toAgentSummary(data) : null;
}

/** Ids of every agent, used to pre-render the profile pages at build time. */
export async function getAgentIds(): Promise<string[]> {
  const { data, error } = await createPublicClient().from("agents").select("id");

  if (error) throw new DataAccessError("load agent ids", error);
  return data.map((row) => row.id);
}

/** An agent's listings with their cover photo, newest first (the same default order as /properties). */
export async function getPropertiesByAgent(agentId: string): Promise<PropertySummary[]> {
  if (!isUuid(agentId)) return [];

  const { data, error } = await createPublicClient()
    .from("properties")
    .select(`${PROPERTY_SUMMARY_COLUMNS}, property_images(${IMAGE_COLUMNS})`)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .order("id")
    .order("sort_order", { referencedTable: "property_images" })
    .limit(1, { referencedTable: "property_images" });

  if (error) throw new DataAccessError("load agent listings", error);
  return data.map(toPropertySummary);
}
