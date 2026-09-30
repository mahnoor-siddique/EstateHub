import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  getAccessFallbackHTTPStatus,
  isHTTPAccessFallbackError,
} from "next/dist/client/components/http-access-fallback/http-access-fallback";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Who can open /admin. The Supabase server client is mocked so each test controls the verified
 * session (getClaims) and the caller's profile row (the only trusted source of the role). The live
 * database side (is_admin(), no self-promotion) is covered in admin.integration.test.ts.
 */

type Claims = Record<string, unknown>;
type ProfileResult = { data: { role: string; full_name: string | null } | null; error: unknown };

let claims: Claims | null;
let profile: ProfileResult;
const profileLookups: { table: string; column: string; value: unknown }[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: claims && { claims }, error: null }) },
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: unknown) => {
          profileLookups.push({ table, column, value });
          return { maybeSingle: async () => profile };
        },
      }),
    }),
  }),
}));

const { isCurrentUserAdmin, requireAdmin } = await import("@/lib/auth/session");
const { default: AdminLayout } = await import("@/app/admin/layout");
const { default: AdminDashboardPage } = await import("@/app/admin/page");

const USER_ID = "7d1c2f0e-0000-4000-8000-000000000001";

function signInAs(role: string | null, extraClaims: Claims = {}) {
  claims = {
    sub: USER_ID,
    email: "someone@example.com",
    user_metadata: { full_name: "Token Name" },
    ...extraClaims,
  };
  profile = { data: role ? { role, full_name: "Sana Malik" } : null, error: null };
}

type Outcome = { redirect: string } | { status: number } | { rendered: unknown };

/** Runs fn and reports whether it redirected, hit notFound() (404) or returned normally. */
async function outcome(fn: () => Promise<unknown>): Promise<Outcome> {
  try {
    return { rendered: await fn() };
  } catch (error) {
    if (isRedirectError(error)) return { redirect: getURLFromRedirectError(error) };
    if (isHTTPAccessFallbackError(error)) return { status: getAccessFallbackHTTPStatus(error) };
    throw error;
  }
}

/** Renders the /admin route (layout around page) to HTML, as the router would. */
async function renderAdminRoute(): Promise<string> {
  const page = await AdminDashboardPage();
  const layout = await AdminLayout({ children: page } as Parameters<typeof AdminLayout>[0]);
  return renderToStaticMarkup(layout as ReactElement);
}

beforeEach(() => {
  claims = null;
  profile = { data: null, error: null };
  profileLookups.length = 0;
});

describe("requireAdmin", () => {
  it("sends a guest to login with /admin as the return path", async () => {
    expect(await outcome(() => requireAdmin("/admin"))).toEqual({ redirect: "/login?next=%2Fadmin" });
    expect(profileLookups).toHaveLength(0); // no database access for guests
  });

  it("never turns the return path into an open redirect", async () => {
    for (const unsafe of ["https://evil.com", "//evil.com", "/\\evil.com"]) {
      expect(await outcome(() => requireAdmin(unsafe))).toEqual({ redirect: "/login" });
    }
  });

  it.each(["user", "agent"])("gives a signed-in %s a 404", async (role) => {
    signInAs(role);
    expect(await outcome(() => requireAdmin("/admin"))).toEqual({ status: 404 });
  });

  it("returns the admin, with the name from their profile", async () => {
    signInAs("admin");
    expect(await requireAdmin("/admin")).toEqual({
      id: USER_ID,
      email: "someone@example.com",
      fullName: "Sana Malik",
      role: "admin",
    });
  });

  it("reads the role from the caller's own profile row, by their verified user id", async () => {
    signInAs("admin");
    await requireAdmin("/admin");
    expect(profileLookups).toContainEqual({ table: "profiles", column: "id", value: USER_ID });
  });

  it("ignores admin claims in the token's user/app metadata or top-level role", async () => {
    signInAs("user", {
      role: "admin",
      user_metadata: { full_name: "x", role: "admin", is_admin: true },
      app_metadata: { role: "admin" },
    });
    expect(await outcome(() => requireAdmin("/admin"))).toEqual({ status: 404 });
  });

  it("does not use the email address to decide access", async () => {
    signInAs("user", { email: "admin@estatehub.pk" });
    expect(await outcome(() => requireAdmin("/admin"))).toEqual({ status: 404 });
  });

  it("fails closed when the profile is missing or cannot be read", async () => {
    signInAs(null);
    expect(await outcome(() => requireAdmin("/admin"))).toEqual({ status: 404 });

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    signInAs("admin");
    profile = { data: null, error: { code: "PGRST000", message: "network down" } };
    expect(await outcome(() => requireAdmin("/admin"))).toEqual({ status: 404 });
    spy.mockRestore();
  });
});

describe("isCurrentUserAdmin (navbar visibility)", () => {
  it("is false for guests, users and agents, true only for admins", async () => {
    expect(await isCurrentUserAdmin()).toBe(false);
    signInAs("user");
    expect(await isCurrentUserAdmin()).toBe(false);
    signInAs("agent");
    expect(await isCurrentUserAdmin()).toBe(false);
    signInAs("user", { user_metadata: { role: "admin" } });
    expect(await isCurrentUserAdmin()).toBe(false);
    signInAs("admin");
    expect(await isCurrentUserAdmin()).toBe(true);
  });
});

describe("/admin route", () => {
  it("redirects a guest to login", async () => {
    expect(await outcome(renderAdminRoute)).toEqual({ redirect: "/login?next=%2Fadmin" });
  });

  it.each(["user", "agent"])("is a 404 for a signed-in %s, in the page and the layout alike", async (role) => {
    signInAs(role);
    expect(await outcome(() => AdminDashboardPage())).toEqual({ status: 404 });
    expect(
      await outcome(() => AdminLayout({ children: null } as Parameters<typeof AdminLayout>[0])),
    ).toEqual({ status: 404 });
  });

  it("does not name the admin area in the layout's metadata (it also titles the non-admin 404)", async () => {
    const { metadata } = await import("@/app/admin/layout");
    expect(metadata.title).toBeUndefined();
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("only resolves the page's metadata (its title) for admins", async () => {
    const { generateMetadata } = await import("@/app/admin/page");
    expect(await outcome(generateMetadata)).toEqual({ redirect: "/login?next=%2Fadmin" });
    signInAs("user");
    expect(await outcome(generateMetadata)).toEqual({ status: 404 });
    signInAs("admin");
    expect(await generateMetadata()).toEqual({ title: "Admin dashboard" });
  });

  it("renders the dashboard shell for an admin", async () => {
    signInAs("admin");
    const html = await renderAdminRoute();

    expect(html).toContain("<h1");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Sana Malik"); // admin identity
    expect(html).toContain('aria-label="Admin"'); // labelled admin navigation
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Sign out");
    for (const section of ["Properties", "Agents", "Bookings", "Contact Requests", "Users"]) {
      expect(html).toContain(section);
    }
    // Every section is built now, so each is a link and none is a "Soon" placeholder.
    for (const path of ["properties", "agents", "bookings", "contact-requests", "users"]) {
      expect(html).toContain(`href="/admin/${path}"`);
    }
    expect(html).not.toContain("Soon");
  });
});
