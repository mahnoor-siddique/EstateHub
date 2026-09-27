import { describe, expect, it } from "vitest";
import {
  isAuthPath,
  isProtectedPath,
  loginPath,
  postLoginPath,
} from "@/lib/auth/routes";
import { safeRedirectPath } from "@/lib/utils/safe-redirect";

// Return-URL handling: login must never become an open redirect or a redirect loop.

describe("safeRedirectPath", () => {
  it.each(["/", "/properties", "/properties?city=Lahore&type=Villa", "/booking?propertyId=abc"])(
    "keeps the same-site path %j",
    (path) => expect(safeRedirectPath(path)).toBe(path),
  );

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "properties",
    "",
    null,
    undefined,
    ["/properties"],
  ])("falls back for the unsafe value %j", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
    expect(safeRedirectPath(value, "/agents")).toBe("/agents");
  });
});

describe("route rules", () => {
  it.each(["/booking", "/booking/", "/booking/confirm"])("%j is protected", (path) =>
    expect(isProtectedPath(path)).toBe(true),
  );

  it.each(["/", "/properties", "/properties/123", "/agents", "/contact", "/bookings", "/login"])(
    "%j is public",
    (path) => expect(isProtectedPath(path)).toBe(false),
  );

  it.each(["/login", "/signup", "/signup/"])("%j is signed-out only", (path) =>
    expect(isAuthPath(path)).toBe(true),
  );

  it.each(["/", "/loginx", "/booking"])("%j is not an auth page", (path) =>
    expect(isAuthPath(path)).toBe(false),
  );
});

describe("loginPath", () => {
  it("encodes the return path, including its query", () => {
    expect(loginPath("/booking?propertyId=abc")).toBe("/login?next=%2Fbooking%3FpropertyId%3Dabc");
  });

  it("omits next for the home page and unsafe values", () => {
    expect(loginPath("/")).toBe("/login");
    expect(loginPath("//evil.com")).toBe("/login");
  });
});

describe("postLoginPath", () => {
  it("returns a safe destination unchanged", () => {
    expect(postLoginPath("/properties?city=Lahore")).toBe("/properties?city=Lahore");
    expect(postLoginPath("/booking?propertyId=abc")).toBe("/booking?propertyId=abc");
  });

  it.each(["/login", "/signup?next=%2Fbooking", "/login/", "//evil.com", "https://evil.com", null])(
    "sends %j home to avoid loops and open redirects",
    (next) => expect(postLoginPath(next)).toBe("/"),
  );
});
