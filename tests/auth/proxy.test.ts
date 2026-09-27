import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";

/*
 * proxy.ts for a visitor with no session cookies. Without cookies Supabase has nothing to verify,
 * so these tests make no network calls (a dummy project URL makes any accidental call fail).
 * Signed-in behaviour, which needs a real session, is covered in supabase.integration.test.ts.
 */

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:9");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
  return () => vi.unstubAllEnvs();
});

function request(path: string, method = "GET") {
  return new NextRequest(new URL(path, "http://localhost:3000"), { method });
}

// NextResponse.next() marks "continue to the page" with this header.
const passesThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

describe("proxy (signed out)", () => {
  it.each(["/", "/properties", "/properties?city=Lahore", "/agents", "/contact", "/login", "/signup"])(
    "lets %j through",
    async (path) => {
      const response = await proxy(request(path));
      expect(passesThrough(response)).toBe(true);
    },
  );

  it("sends protected pages to login with the full return path", async () => {
    const response = await proxy(request("/booking?propertyId=abc"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fbooking%3FpropertyId%3Dabc",
    );
  });

  it("protects nested booking routes too", async () => {
    const response = await proxy(request("/booking/confirm"));
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fbooking%2Fconfirm",
    );
  });

  it("leaves Server Action POSTs to the action's own auth check", async () => {
    const response = await proxy(request("/booking", "POST"));
    expect(passesThrough(response)).toBe(true);
  });
});
