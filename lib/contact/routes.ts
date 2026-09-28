import { isUuid } from "@/lib/queries/supabase/shared";

/**
 * "/contact?propertyId=…&agentId=…" — the contact form for a listing and/or agent. Used as the
 * login return path, so a guest who has to log in comes back to the same enquiry. Ids that are
 * missing or not uuids are left out.
 */
export function contactPath(propertyId: string, agentId: string): string {
  const params = new URLSearchParams();
  if (isUuid(propertyId)) params.set("propertyId", propertyId);
  if (isUuid(agentId)) params.set("agentId", agentId);
  const query = params.toString();
  return query ? `/contact?${query}` : "/contact";
}
