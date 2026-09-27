import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/*
 * Supabase client for Server Components, Server Functions and Route Handlers. Create a new client
 * per request — never share one across requests, since it carries the caller's cookies.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. Safe to ignore: proxy.ts refreshes the
          // session and writes the updated cookies before the page renders.
        }
      },
    },
  });
}
