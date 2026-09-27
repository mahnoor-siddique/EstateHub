/**
 * Returns `value` only if it is a same-site path such as "/properties?city=Lahore"; anything else
 * (absolute URLs, protocol-relative "//evil.com", "/\evil.com", non-strings) falls back. Use it for
 * every user-supplied "next" parameter so login can never become an open redirect.
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
