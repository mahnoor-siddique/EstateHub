import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/lib/auth/types";

/*
 * The Admin link in the site navbar appears only when the layout says the user is an admin (it
 * derives that from the profile role on the server — see access.test.ts). Hiding the link is only
 * convenience: /admin itself re-checks the role.
 */

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/",
}));

const { Navbar } = await import("@/components/layout/Navbar");

const user: SessionUser = { id: "user-1", email: "ayesha@example.com", fullName: "Ayesha Khan" };

const render = (props: Parameters<typeof Navbar>[0]) => renderToStaticMarkup(createElement(Navbar, props));
const adminLinks = (html: string) => html.match(/href="\/admin"/g)?.length ?? 0;

describe("Navbar Admin link", () => {
  it("is not shown to guests, even if isAdmin were set", () => {
    expect(adminLinks(render({ user: null }))).toBe(0);
    expect(adminLinks(render({ user: null, isAdmin: true }))).toBe(0);
  });

  it("is not shown to signed-in users or agents", () => {
    const html = render({ user, isAdmin: false });
    expect(adminLinks(html)).toBe(0);
    expect(html).toContain('href="/bookings"'); // the normal account links are still there
    expect(adminLinks(render({ user }))).toBe(0); // defaults to hidden
  });

  it("is shown to admins in the desktop bar and the mobile menu", () => {
    const html = render({ user, isAdmin: true });
    expect(adminLinks(html)).toBe(2);
    expect(html).toContain('href="/bookings"');
  });
});
