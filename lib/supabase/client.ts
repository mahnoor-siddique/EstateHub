import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

/*
 * Supabase client for Client Components ("use client"). createBrowserClient reuses a single
 * instance in the browser, so calling this from several components is cheap.
 */
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
