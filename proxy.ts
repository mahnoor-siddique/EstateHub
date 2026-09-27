import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 Proxy (formerly Middleware): refresh the Supabase session on every page request.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files (images, video, fonts, icons) — they never need auth.
    "/((?!_next/static|_next/image|favicon.ico|images/|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|woff2?)$).*)",
  ],
};
