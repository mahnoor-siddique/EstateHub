import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { loginPath, postLoginPath } from "@/lib/auth/routes";
import type { AdminUser, SessionUser, UserRole } from "@/lib/auth/types";
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

/**
 * For protected pages, layouts and Server Actions: returns the signed-in user, or redirects to
 * /login?next=<returnTo> so they come back after logging in. This is the authoritative check —
 * proxy.ts only redirects early for convenience. Pass the path (with query) the user asked for.
 */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(returnTo));
  return user;
}

/** For /login and /signup: a signed-in user is sent on to `next` (or home) instead. */
export async function redirectIfSignedIn(next: unknown): Promise<void> {
  if (await getCurrentUser()) redirect(postLoginPath(next));
}

/*
 * The signed-in user's role, read from their row in public.profiles — never from the token's
 * metadata, a cookie or anything else the browser can change. The query runs with the user's own
 * verified session, and Row Level Security only lets it see their own profile. Any failure (signed
 * out, missing profile, network/database error) returns null, which callers treat as "not an
 * admin": access fails closed.
 */
const getCurrentProfile = cache(
  async (): Promise<{ role: UserRole; fullName: string | null } | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[auth] profile role check failed", { code: error.code });
      return null;
    }
    if (!data) return null;

    return { role: data.role, fullName: data.full_name?.trim() || null };
  },
);

/** True only when the signed-in user's profile role is `admin`. For showing admin navigation. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await getCurrentProfile())?.role === "admin";
}

/**
 * The one authorization check for every admin page, layout and Server Action:
 *   * signed out -> redirect to /login?next=<returnTo> (made safe by loginPath);
 *   * signed in but not an admin (or the role cannot be verified) -> 404, so the admin area's
 *     existence and contents are not revealed.
 * Call it in each admin page/action as well as the layout: layouts do not gate their child
 * segments on their own.
 */
export async function requireAdmin(returnTo: string): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(returnTo));

  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") notFound();

  return { ...user, fullName: profile.fullName ?? user.fullName, role: "admin" };
}
