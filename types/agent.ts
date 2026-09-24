/** Agent shown on listings. Mirrors the planned Supabase `agents` table (Phase 4 adds full profiles). */
export type Agent = {
  id: string;
  fullName: string;
  agencyName: string;
  title: string; // role shown under the name, e.g. "Senior Property Consultant"
  bio: string; // one or two sentences for the agent directory
  profileImage?: string; // initials are shown until real photos exist
};

/** Agent plus how many listings they handle, for the /agents directory. */
export type AgentSummary = Agent & { listingCount: number };
