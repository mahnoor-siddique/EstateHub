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
  it.each([
    "/",
    "/properties",
    "/properties?city=Lahore",
    "/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264",
    "/agents",
    "/agents/6ceb4716-6d87-591e-9ead-212a4e979b44",
    "/login",
    "/signup",
  ])(
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

  it("protects the booking history page", async () => {
    const response = await proxy(request("/bookings"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fbookings");
  });

  it("sends Contact Agent to login, keeping the property and agent in the return path", async () => {
    const response = await proxy(request("/contact?propertyId=p1&agentId=a1"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fcontact%3FpropertyId%3Dp1%26agentId%3Da1",
    );
  });

  it("protects the general contact page too", async () => {
    const response = await proxy(request("/contact"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fcontact");
  });

  it.each([
    ["/admin", "/login?next=%2Fadmin"],
    ["/admin/users?page=2", "/login?next=%2Fadmin%2Fusers%3Fpage%3D2"],
  ])("sends a guest visiting %s to login", async (path, location) => {
    const response = await proxy(request(path));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`http://localhost:3000${location}`);
  });

  it("does not treat look-alike paths such as /administrator as admin routes", async () => {
    expect(passesThrough(await proxy(request("/administrator")))).toBe(true);
  });

  it.each(["/booking", "/contact"])("leaves Server Action POSTs to %s to the action's own auth check", async (path) => {
    const response = await proxy(request(path, "POST"));
    expect(passesThrough(response)).toBe(true);
  });
});
