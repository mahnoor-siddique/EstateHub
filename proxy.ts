import { NextResponse, type NextRequest } from "next/server";
import { isAuthPath, isProtectedPath, loginPath, postLoginPath } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/proxy";

/*
 * Next.js 16 Proxy (formerly Middleware). On every page request it:
 *   1. refreshes the Supabase session cookies;
 *   2. sends signed-out visitors of protected routes to /login?next=<where they were going>;
 *   3. sends signed-in visitors of /login and /signup on to their destination.
 * These redirects are optimistic (cookie-based) UX and apply to page loads only (GET/HEAD).
 * Server Action POSTs pass through untouched: each action checks the user itself and returns a
 * proper result, which a redirect here would break. Nothing relies on the proxy alone.
 */
export async function proxy(request: NextRequest) {
  const { response, signedIn } = await updateSession(request);
  const { pathname, search, searchParams } = request.nextUrl;
  if (request.method !== "GET" && request.method !== "HEAD") return response;

  if (!signedIn && isProtectedPath(pathname)) {
    return redirectKeepingCookies(request, response, loginPath(pathname + search));
  }
  if (signedIn && isAuthPath(pathname)) {
    return redirectKeepingCookies(request, response, postLoginPath(searchParams.get("next")));
  }
  return response;
}

// A redirect must carry any session cookies the refresh just wrote, or they would be lost.
function redirectKeepingCookies(request: NextRequest, sessionResponse: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  sessionResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "cache-control") redirect.headers.set(key, value);
  });
  return redirect;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files (images, video, fonts, icons) — they never need auth.
    "/((?!_next/static|_next/image|favicon.ico|images/|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|woff2?)$).*)",
  ],
};
