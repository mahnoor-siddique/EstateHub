import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * getCurrentUser / requireUser / redirectIfSignedIn with the Supabase server client mocked, so
 * each test controls what getClaims returns. (Real tokens are exercised in the integration tests.)
 */

type ClaimsResult = { data: { claims: Record<string, unknown> } | null; error: unknown };
let claimsResult: ClaimsResult;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: async () => claimsResult } }),
}));

const { getCurrentUser, redirectIfSignedIn, requireUser } = await import("@/lib/auth/session");

const signedIn = (claims: Record<string, unknown>): ClaimsResult => ({
  data: { claims: { sub: "user-1", email: "ayesha@example.com", ...claims } },
  error: null,
});
const signedOut: ClaimsResult = { data: null, error: null };

/** Runs fn and returns the URL it redirected to (Next's redirect() works by throwing). */
async function redirectTarget(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    if (isRedirectError(error)) return getURLFromRedirectError(error);
    throw error;
  }
  return null;
}

beforeEach(() => {
  claimsResult = signedOut;
});

describe("getCurrentUser", () => {
  it("returns null when signed out", async () => {
    expect(await getCurrentUser()).toBeNull();
  });

  it("builds the user from verified claims", async () => {
    claimsResult = signedIn({ user_metadata: { full_name: "  Ayesha Khan " } });
    expect(await getCurrentUser()).toEqual({
      id: "user-1",
      email: "ayesha@example.com",
      fullName: "Ayesha Khan",
    });
  });

  it("copes with missing or non-string metadata", async () => {
    claimsResult = signedIn({ user_metadata: { full_name: 42 } });
    expect((await getCurrentUser())?.fullName).toBeNull();
  });

  it("treats a failed session check as signed out without logging details", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    claimsResult = { data: null, error: { code: "network", status: 0, message: "token=abc" } };
    expect(await getCurrentUser()).toBeNull();
    expect(JSON.stringify(spy.mock.calls)).not.toContain("token=abc");
    spy.mockRestore();
  });
});

describe("requireUser", () => {
  it("redirects a signed-out visitor to login with a return path", async () => {
    expect(await redirectTarget(() => requireUser("/booking?propertyId=abc"))).toBe(
      "/login?next=%2Fbooking%3FpropertyId%3Dabc",
    );
  });

  it("does not echo an unsafe return path", async () => {
    expect(await redirectTarget(() => requireUser("https://evil.com"))).toBe("/login");
  });

  it("returns the user when signed in", async () => {
    claimsResult = signedIn({});
    expect(await requireUser("/booking")).toMatchObject({ id: "user-1" });
  });
});

describe("redirectIfSignedIn", () => {
  it("does nothing for a signed-out visitor", async () => {
    expect(await redirectTarget(() => redirectIfSignedIn("/properties"))).toBeNull();
  });

  it("sends a signed-in user to a safe next path", async () => {
    claimsResult = signedIn({});
    expect(await redirectTarget(() => redirectIfSignedIn("/properties?city=Lahore"))).toBe(
      "/properties?city=Lahore",
    );
    expect(await redirectTarget(() => redirectIfSignedIn("//evil.com"))).toBe("/");
    expect(await redirectTarget(() => redirectIfSignedIn("/login"))).toBe("/");
  });
});
