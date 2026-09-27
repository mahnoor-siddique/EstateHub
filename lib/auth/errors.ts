import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";

/*
 * Turns Supabase Auth errors into short, user-facing messages. Raw error text is never shown:
 * it can be technical, and login must not reveal whether an email is registered.
 */

const RATE_LIMITED = "Too many attempts. Please wait a few minutes and try again.";
const UNREACHABLE = "We couldn't reach the sign-in service. Check your connection and try again.";

export function loginErrorMessage(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return UNREACHABLE;
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email first — use the link we sent when you signed up.";
    case "over_request_rate_limit":
      return RATE_LIMITED;
    default:
      return "We couldn't sign you in. Please try again.";
  }
}

export function signupErrorMessage(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return UNREACHABLE;
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "weak_password":
      return "That password is too easy to guess. Please choose a stronger one.";
    case "email_address_invalid":
      return "This email address can't be used. Please try a different one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return RATE_LIMITED;
    case "signup_disabled":
    case "email_provider_disabled":
      return "New sign-ups are currently unavailable. Please try again later.";
    default:
      return "We couldn't create your account. Please try again.";
  }
}

/** Logs only non-sensitive details (never the email, password or tokens). */
export function logAuthError(context: string, error: AuthError) {
  console.error(`[auth] ${context} failed`, { code: error.code, status: error.status });
}
