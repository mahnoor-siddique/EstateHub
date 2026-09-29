import { safeRedirectPath } from "@/lib/utils/safe-redirect";

/*
 * Which routes need a signed-in user, and which are only for signed-out users. Shared by proxy.ts
 * (fast, optimistic redirects) and by the pages/actions themselves (the real check — see
 * requireUser in lib/auth/session.ts). Everything else, including all property and agent
 * browsing, stays public.
 */

/**
 * Signed-in only. A booking always belongs to a user (bookings.user_id is required), so the
 * booking flow (/booking) and the user's booking history (/bookings) sit behind login, and so does
 * contacting an agent (/contact). Agent profiles (/agents) stay public; only the contact flow is
 * gated. /admin also needs a signed-in user here; its admin-role check is in requireAdmin
 * (lib/auth/session.ts), since the role is read from the database, not the cookie.
 */
export const PROTECTED_ROUTES = ["/booking", "/bookings", "/contact", "/admin"] as const;

/** Signed-out only: a signed-in user is sent on instead of seeing these again. */
export const AUTH_ROUTES = ["/login", "/signup"] as const;

function matches(pathname: string, routes: readonly string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isProtectedPath(pathname: string): boolean {
  return matches(pathname, PROTECTED_ROUTES);
}

export function isAuthPath(pathname: string): boolean {
  return matches(pathname, AUTH_ROUTES);
}

/** "/login?next=<path>" — the login page returns the user to `path` afterwards. */
export function loginPath(next: string): string {
  const target = safeRedirectPath(next);
  return target === "/" ? "/login" : `/login?next=${encodeURIComponent(target)}`;
}

/**
 * Where to send a user once they are signed in: the requested `next` path, unless it is missing,
 * unsafe or points back at /login or /signup (which would loop).
 */
export function postLoginPath(next: unknown): string {
  const target = safeRedirectPath(next);
  const pathname = new URL(target, "http://localhost").pathname;
  return isAuthPath(pathname) ? "/" : target;
}
