import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/*
 * Keeps the Supabase session fresh. Server Components cannot write cookies, so an expired access
 * token is refreshed here, before rendering, and the new cookies are written both to the request
 * (so this render sees them) and to the response (so the browser keeps them).
 *
 * This only refreshes the session; it is not an authorization check. Protected pages and actions
 * must still verify the user themselves.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Cache-control headers from Supabase stop CDNs caching a response that sets auth cookies.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not put code between createServerClient and getClaims: getClaims validates the token and
  // triggers the refresh (and setAll above) when it has expired.
  await supabase.auth.getClaims();

  return response;
}
