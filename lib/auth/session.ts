import { cache } from "react";
import type { SessionUser } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

/*
 * The signed-in user for the current request, or null. getClaims verifies the session JWT from the
 * auth cookies (proxy.ts has already refreshed it), so the result can be trusted on the server —
 * unlike getSession, which only decodes the cookie. cache() dedupes calls within one render.
 *
 * Name and email come from the token itself (user_metadata is set at signup), so the navbar needs
 * no extra database query.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    // A network/auth-server failure renders the page as signed out rather than crashing it.
    console.error("[auth] session check failed", { code: error.code, status: error.status });
    return null;
  }
  if (!data?.claims) return null;

  const { sub, email, user_metadata } = data.claims;
  const fullName =
    typeof user_metadata?.full_name === "string" ? user_metadata.full_name.trim() : "";

  return { id: sub, email: email ?? "", fullName: fullName || null };
});
