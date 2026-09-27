import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/*
 * Cookie-free Supabase client for public catalog reads (agents, properties, property_images) on the
 * server. Unlike lib/supabase/server.ts it does not call cookies(), so it also works where there is
 * no request — generateStaticParams and statically rendered pages. It always acts as the anonymous
 * role, so RLS limits it to publicly readable rows. Never use it for user-specific data; use
 * lib/supabase/server.ts for that.
 */

let publicClient: ReturnType<typeof createClient<Database>> | undefined;

export function createPublicClient() {
  if (!publicClient) {
    const { url, publishableKey } = getSupabaseEnv();
    publicClient = createClient<Database>(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return publicClient;
}
