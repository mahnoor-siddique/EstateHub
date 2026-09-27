import { isAuthPKCECodeVerifierMissingError, type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

// Link types this route accepts. Password recovery and email changes are not implemented yet.
const ALLOWED_TYPES: EmailOtpType[] = ["signup", "email"];

/*
 * Target of the signup confirmation email. Supports both Supabase link styles:
 *   - ?code=...                   (default template, PKCE flow started by the signUp action)
 *   - ?token_hash=...&type=signup (custom template; also works in a different browser)
 * On success the user is signed in (session cookies are set) and sent on to `next`.
 *
 * Supabase only redirects here with ?code= after the email has been verified (failures arrive as
 * ?error=... instead), so the email is already confirmed at this point; the code only
 * turns that into a session, and doing so needs the PKCE verifier cookie saved by the browser that
 * signed up. If the link is opened in another browser or device that cookie is missing, so the
 * account is confirmed but cannot be signed in here — send the user to log in instead of showing
 * an "invalid link" error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let confirmed = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (isAuthPKCECodeVerifierMissingError(error)) {
      const loginNext = next === "/" ? "" : `&next=${encodeURIComponent(next)}`;
      redirect(`/login?notice=email-confirmed${loginNext}`);
    }
    confirmed = !error;
  } else if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    confirmed = !error;
  }

  redirect(confirmed ? next : "/login?error=confirmation");
}
