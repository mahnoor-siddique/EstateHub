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
 * Admin → Contact Requests with a fake Supabase client: who can open /admin/contact-requests, what
 * the list shows, and how each request's property/agent relationship is classified. The database
 * side — only admins read every request; users read only their own; nobody edits or deletes — is
 * checked separately against Postgres and the live project.
 */

type Query = { table: string; op: string; filters: [string, unknown][] };
type Result = { data: unknown; error: { code: string; message: string } | null };

let claims: Record<string, unknown> | null;
let role: string | null;
let rows: unknown[];
const queries: Query[] = [];

function builder(table: string) {
  const query: Query = { table, op: "select", filters: [] };
  const b: Record<string, unknown> = {
    select: () => b,
    eq(column: string, value: unknown) {
      query.filters.push([column, value]);
      return b;
    },
    order: () => b,
    maybeSingle: () => b,
    then(resolve: (r: Result) => unknown) {
      queries.push(query);
      const result =
        table === "profiles"
          ? { data: role ? { role, full_name: "Sana Malik" } : null, error: null }
          : { data: rows, error: null };
      return Promise.resolve(result).then(resolve);
    },
  };
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: claims && { claims }, error: null }) },
    from: builder,
  }),
}));

const { getAdminContactRequests } = await import("@/lib/admin/queries");
const { default: AdminContactRequestsPage } = await import("@/app/admin/contact-requests/page");

const USER_ID = "7d1c2f0e-0000-4000-8000-000000000001";
const PROPERTY = { id: "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264", title: "Modern Villa with Landscaped Garden", city: "Lahore" };
const SARA = { id: "6ceb4716-6d87-591e-9ead-212a4e979b44", full_name: "Sara Malik" };
const HAMZA = { id: "a95715d6-6aea-5d6c-a00e-d167473cf091", full_name: "Hamza Qureshi" };

/** Stored requests as PostgREST returns them, one of each kind plus an old guest request. */
const storedRequests = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    user_id: USER_ID,
    name: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "+92 300 1234567",
    message: "Is the villa still available?\nWe'd like to visit.",
    created_at: "2026-09-29T10:30:00+00:00",
    properties: PROPERTY,
    agents: SARA, // set from the listing by the contact_requests_set_defaults trigger
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    user_id: USER_ID,
    name: "Bilal Ahmed",
    email: "bilal@example.com",
    phone: null,
    message: "Do you handle rentals in Clifton?",
    created_at: "2026-09-28T08:00:00+00:00",
    properties: null,
    agents: HAMZA, // sent from the agent's profile
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    user_id: USER_ID,
    name: "Hina Raza",
    email: "hina@example.com",
    phone: "0300-7654321",
    message: "General question about listing my house.",
    created_at: "2026-09-27T15:45:00+00:00",
    properties: null,
    agents: null,
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    user_id: null, // sent by a guest before sign-in was required
    name: "Old Guest",
    email: "guest@example.com",
    phone: null,
    message: "Hello",
    created_at: "2026-09-20T09:00:00+00:00",
    properties: null,
    agents: null,
  },
];

const signIn = (as: string, extra: Record<string, unknown> = {}) => {
  claims = { sub: USER_ID, email: "someone@example.com", ...extra };
  role = as;
};

async function outcome(fn: () => Promise<unknown>) {
  try {
    return { returned: await fn() };
  } catch (error) {
    if (isRedirectError(error)) return { redirect: getURLFromRedirectError(error) };
    if (isHTTPAccessFallbackError(error)) return { status: getAccessFallbackHTTPStatus(error) };
    throw error;
  }
}

const requestQueries = () => queries.filter((q) => q.table === "contact_requests");
const renderPage = async () => renderToStaticMarkup((await AdminContactRequestsPage()) as ReactElement);

beforeEach(() => {
  claims = null;
  role = null;
  rows = storedRequests;
  queries.length = 0;
});

describe("/admin/contact-requests access", () => {
  it("sends guests to login without loading any request", async () => {
    expect(await outcome(renderPage)).toEqual({ redirect: "/login?next=%2Fadmin%2Fcontact-requests" });
    expect(requestQueries()).toEqual([]);
  });

  it.each([
    ["normal user", "user", {}],
    ["agent", "agent", {}],
    ["user with forged admin claims", "user", { role: "admin", user_metadata: { role: "admin" }, app_metadata: { role: "admin" } }],
  ] as const)("gives a %s a 404 without loading any request", async (_label, as, extra) => {
    signIn(as, extra);
    expect(await outcome(renderPage)).toEqual({ status: 404 });
    expect(requestQueries()).toEqual([]);
  });

  it("fails closed when the admin role cannot be read", async () => {
    signIn("admin");
    role = null;
    expect(await outcome(renderPage)).toEqual({ status: 404 });
    expect(requestQueries()).toEqual([]);
  });
});

describe("getAdminContactRequests", () => {
  it("classifies each request by what it was about and keeps its relationships", async () => {
    signIn("admin");
    const [property, agent, general, guest] = await getAdminContactRequests();

    expect(property).toEqual({
      id: "c0000000-0000-4000-8000-000000000001",
      kind: "property",
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "+92 300 1234567",
      message: "Is the villa still available?\nWe'd like to visit.",
      createdAt: "2026-09-29T10:30:00+00:00",
      fromAccount: true,
      property: PROPERTY,
      agent: { id: SARA.id, fullName: "Sara Malik" },
    });
    expect(agent).toMatchObject({ kind: "agent", property: null, agent: { id: HAMZA.id, fullName: "Hamza Qureshi" }, phone: null });
    expect(general).toMatchObject({ kind: "general", property: null, agent: null });
    expect(guest).toMatchObject({ kind: "general", fromAccount: false });
  });

  it("asks the database for all requests, leaving row access to the admin policy", async () => {
    signIn("admin");
    await getAdminContactRequests();
    expect(requestQueries()).toHaveLength(1);
    expect(requestQueries()[0].filters).toEqual([]);
  });
});

describe("/admin/contact-requests page (admin)", () => {
  beforeEach(() => signIn("admin"));

  it("lists every request with its details and links", async () => {
    const html = await renderPage();

    for (const text of [
      "Ayesha Khan",
      "ayesha@example.com",
      "+92 300 1234567",
      "Is the villa still available?",
      "Bilal Ahmed",
      "Do you handle rentals in Clifton?",
      "Hina Raza",
      "Old Guest",
      "Tue, 29 Sept 2026, 15:30", // submitted 10:30 UTC, shown in Pakistan time (UTC+5)
    ]) {
      expect(html, text).toContain(text);
    }
    expect(html.match(/<article /g)).toHaveLength(4);
    expect(html).toContain('href="mailto:ayesha@example.com"');
    expect(html).toContain('href="tel:+923001234567"');
    expect(html).toContain(`href="/admin/properties/${PROPERTY.id}"`);
    expect(html).toContain(`href="/admin/agents/${SARA.id}"`);
    expect(html).toContain(`href="/admin/agents/${HAMZA.id}"`);
  });

  it("marks property, agent and general enquiries so they can be told apart", async () => {
    const html = await renderPage();
    const articles = html.split("<article ").slice(1);

    expect(articles[0]).toContain("Property enquiry");
    expect(articles[0]).toContain(PROPERTY.title);
    expect(articles[1]).toContain("Agent enquiry");
    expect(articles[1]).not.toContain("/admin/properties/");
    expect(articles[2]).toContain("General enquiry");
    expect(articles[2]).not.toMatch(/\/admin\/(properties|agents)\//);
    expect(articles[3]).toContain("Guest (before sign-in was required)");
    expect(html).toContain("1 property enquiries · 1 agent enquiries · 2 general enquiries");
  });

  it("offers no edit or delete controls", async () => {
    const html = await renderPage();
    expect(html).not.toMatch(/<form|<button|Delete|Edit/);
  });

  it("shows an empty state when there are no requests", async () => {
    rows = [];
    expect(await renderPage()).toContain("No contact requests yet");
  });
});
