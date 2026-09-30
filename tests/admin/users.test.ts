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
 * Admin → Users with a fake Supabase client: who can open /admin/users, what the list shows, and
 * the updateUserRole Server Action (authorization, role validation, admin-promotion confirmation,
 * self-demotion protection, and that only profiles.role is ever sent). The database side — admins
 * read every profile and update only role; the self-demotion trigger; no escalation for users — is
 * checked separately against Postgres.
 */

type Query = { table: string; op: string; columns?: string; payload?: unknown; filters: [string, unknown][] };
type Result = { data: unknown; error: { code: string; message: string } | null };

const ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const OTHER_ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const USER_ID = "11111111-1111-4111-8111-111111111111";
const AGENT_ID = "22222222-2222-4222-8222-222222222222";

let claims: Record<string, unknown> | null;
let callerRole: string | null;
/** Stored roles, updated by the fake so sequences can be followed. */
let roles: Record<string, string>;
let updateError: Result["error"];
const queries: Query[] = [];
const revalidatePath = vi.fn();

const profileRows = () => [
  { id: USER_ID, full_name: "Ayesha Khan", email: "ayesha@example.com", role: roles[USER_ID], created_at: "2026-09-29T10:00:00+00:00" },
  { id: AGENT_ID, full_name: null, email: "agent@example.com", role: roles[AGENT_ID], created_at: "2026-09-20T10:00:00+00:00" },
  { id: OTHER_ADMIN_ID, full_name: "Bilal Ahmed", email: "bilal@example.com", role: roles[OTHER_ADMIN_ID], created_at: "2026-09-10T10:00:00+00:00" },
  { id: ADMIN_ID, full_name: "Sana Malik", email: "sana@example.com", role: roles[ADMIN_ID], created_at: "2026-09-01T10:00:00+00:00" },
];

function respond(query: Query): Result {
  const id = query.filters.find(([column]) => column === "id")?.[1] as string | undefined;
  if (query.op === "update") {
    if (updateError) return { data: null, error: updateError };
    if (!id || !(id in roles)) return { data: [], error: null };
    roles[id] = (query.payload as { role: string }).role;
    return { data: [{ id }], error: null };
  }
  // requireAdmin's own lookup of the caller (select "role, full_name" by the caller's id).
  if (query.columns === "role, full_name") {
    return { data: callerRole ? { role: callerRole, full_name: "Sana Malik" } : null, error: null };
  }
  // The action's lookup of the target's current role.
  if (query.columns === "role") return { data: id && id in roles ? { role: roles[id] } : null, error: null };
  return { data: profileRows(), error: null };
}

function builder(table: string) {
  const query: Query = { table, op: "select", filters: [] };
  const b: Record<string, unknown> = {
    select(columns: string) {
      if (query.op === "select") query.columns = columns;
      return b;
    },
    update(payload: unknown) {
      Object.assign(query, { op: "update", payload });
      return b;
    },
    eq(column: string, value: unknown) {
      query.filters.push([column, value]);
      return b;
    },
    order: () => b,
    maybeSingle: () => b,
    then(resolve: (r: Result) => unknown) {
      queries.push(query);
      return Promise.resolve(respond(query)).then(resolve);
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
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const { updateUserRole } = await import("@/lib/admin/users/actions");
const { getAdminUsers } = await import("@/lib/admin/queries");
const { default: AdminUsersPage } = await import("@/app/admin/users/page");

const idle = { status: "idle" } as const;

function signIn(as: string, extra: Record<string, unknown> = {}) {
  claims = { sub: ADMIN_ID, email: "sana@example.com", ...extra };
  callerRole = as;
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function outcome(fn: () => Promise<unknown>) {
  try {
    return { returned: await fn() };
  } catch (error) {
    if (isRedirectError(error)) return { redirect: getURLFromRedirectError(error) };
    if (isHTTPAccessFallbackError(error)) return { status: getAccessFallbackHTTPStatus(error) };
    throw error;
  }
}

/** Profile queries other than requireAdmin's lookup of the caller. */
const dataQueries = () => queries.filter((q) => q.columns !== "role, full_name");
const updates = () => queries.filter((q) => q.op === "update");
const renderPage = async () => renderToStaticMarkup((await AdminUsersPage()) as ReactElement);

const NON_ADMINS = [
  ["normal user", "user", {}],
  ["agent", "agent", {}],
  ["user with forged admin claims", "user", { role: "admin", user_metadata: { role: "admin" }, app_metadata: { role: "admin" } }],
] as const;

beforeEach(() => {
  claims = null;
  callerRole = null;
  roles = { [ADMIN_ID]: "admin", [OTHER_ADMIN_ID]: "admin", [USER_ID]: "user", [AGENT_ID]: "agent" };
  updateError = null;
  queries.length = 0;
  revalidatePath.mockClear();
});

describe("/admin/users page", () => {
  it("sends guests to login without loading any account", async () => {
    expect(await outcome(renderPage)).toEqual({ redirect: "/login?next=%2Fadmin%2Fusers" });
    expect(dataQueries()).toEqual([]);
  });

  it.each(NON_ADMINS)("gives a %s a 404 without loading any account", async (_label, as, extra) => {
    signIn(as, extra);
    expect(await outcome(renderPage)).toEqual({ status: 404 });
    expect(dataQueries()).toEqual([]);
  });

  it("lists every account with name, email, role and join date", async () => {
    signIn("admin");
    const html = await renderPage();

    for (const text of ["Ayesha Khan", "ayesha@example.com", "agent@example.com", "No name given", "Bilal Ahmed", "Sana Malik", "29 Sept 2026", "1 Sept 2026"]) {
      expect(html, text).toContain(text);
    }
    expect(html).toContain("1 user · 1 agent · 2 admins");
    expect(html.match(/<article /g)).toHaveLength(4);
  });

  it("offers a role control for every account except the admin's own", async () => {
    signIn("admin");
    const html = await renderPage();
    const articles = html.split("<article ").slice(1);
    const own = articles.find((a) => a.includes("Sana Malik"))!;

    expect(html.match(/name="userId"/g)).toHaveLength(3);
    expect(own).not.toContain('name="role"');
    expect(own).toContain("You can&#x27;t change your own role");
    expect(articles.find((a) => a.includes("Ayesha Khan"))).toMatch(/<option value="user" selected="">/);
  });

  it("shows no authentication data", async () => {
    signIn("admin");
    const html = await renderPage();
    expect(html).not.toMatch(/password|token|encrypted|last_sign_in|raw_user_meta/i);
    // Only profile columns are ever requested.
    expect(dataQueries()[0].columns).toBe("id, full_name, email, role, created_at");
  });
});

describe("getAdminUsers", () => {
  it("maps profiles and leaves which rows come back to the database's admin policy", async () => {
    signIn("admin");
    const users = await getAdminUsers();
    expect(users[0]).toEqual({
      id: USER_ID,
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
      role: "user",
      createdAt: "2026-09-29T10:00:00+00:00",
    });
    expect(users[1]).toMatchObject({ fullName: null, role: "agent" });
    expect(dataQueries()[0].filters).toEqual([]);
  });
});

describe("updateUserRole authorization", () => {
  it("sends a guest to login and changes nothing", async () => {
    expect(await outcome(() => updateUserRole(idle, form({ userId: USER_ID, role: "admin", confirmAdmin: "on" })))).toEqual({
      redirect: "/login?next=%2Fadmin%2Fusers",
    });
    expect(dataQueries()).toEqual([]);
    expect(roles[USER_ID]).toBe("user");
  });

  it.each(NON_ADMINS)("gives a %s a 404 and changes nothing — not even their own role", async (_label, as, extra) => {
    signIn(as, extra);
    // The caller tries to promote their own account.
    expect(await outcome(() => updateUserRole(idle, form({ userId: ADMIN_ID, role: "admin", confirmAdmin: "on" })))).toEqual({
      status: 404,
    });
    expect(dataQueries()).toEqual([]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateUserRole (admin)", () => {
  beforeEach(() => signIn("admin"));

  it.each([
    [USER_ID, "user", "agent"],
    [AGENT_ID, "agent", "user"],
    [OTHER_ADMIN_ID, "admin", "user"],
    [OTHER_ADMIN_ID, "admin", "agent"],
  ])("changes another account %s from %s to %s, sending only the role", async (id, from, to) => {
    expect(roles[id]).toBe(from);
    expect(await updateUserRole(idle, form({ userId: id, role: to }))).toEqual({
      status: "success",
      message: expect.stringMatching(/^Role set to /),
    });
    expect(roles[id]).toBe(to);
    expect(updates()).toEqual([{ table: "profiles", op: "update", payload: { role: to }, filters: [["id", id]] }]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it.each([USER_ID, AGENT_ID])("promotes %s to admin only with the confirmation ticked", async (id) => {
    const unconfirmed = await updateUserRole(idle, form({ userId: id, role: "admin" }));
    expect(unconfirmed).toMatchObject({ status: "error", message: expect.stringContaining("confirm") });
    expect(updates()).toEqual([]);

    expect(await updateUserRole(idle, form({ userId: id, role: "admin", confirmAdmin: "on" }))).toMatchObject({ status: "success" });
    expect(roles[id]).toBe("admin");
  });

  it("re-saving an existing admin as admin needs no confirmation", async () => {
    expect(await updateUserRole(idle, form({ userId: OTHER_ADMIN_ID, role: "admin" }))).toMatchObject({ status: "success" });
  });

  it.each(["user", "agent"])("refuses to let the admin demote themselves to %s, without writing", async (role) => {
    const result = await updateUserRole(idle, form({ userId: ADMIN_ID, role }));
    expect(result).toEqual({ status: "error", message: expect.stringContaining("own admin access") });
    expect(dataQueries()).toEqual([]);
    expect(roles[ADMIN_ID]).toBe("admin");
  });

  it("explains the database's own self-demotion guard if it fires", async () => {
    updateError = { code: "P0001", message: "You cannot remove your own admin access" };
    const result = await updateUserRole(idle, form({ userId: USER_ID, role: "agent" }));
    expect(result).toEqual({ status: "error", message: expect.stringContaining("own admin access") });
  });

  it("ignores every other profile field sent with the form", async () => {
    await updateUserRole(
      idle,
      form({ userId: USER_ID, role: "agent", id: ADMIN_ID, email: "evil@example.com", full_name: "Hacked", created_at: "2000-01-01" }),
    );
    expect(updates()).toHaveLength(1);
    expect(updates()[0].payload).toEqual({ role: "agent" });
    expect(updates()[0].filters).toEqual([["id", USER_ID]]);
  });

  it.each([
    ["an unknown role", { userId: USER_ID, role: "superadmin" }],
    ["a role in the wrong case", { userId: USER_ID, role: "Admin" }],
    ["an empty role", { userId: USER_ID, role: "" }],
    ["no role", { userId: USER_ID }],
    ["a malformed account id", { userId: "not-a-uuid", role: "agent" }],
    ["no account id", { role: "agent" }],
  ])("rejects %s without writing", async (_label, fields) => {
    expect(await updateUserRole(idle, form(fields as Record<string, string>))).toEqual({
      status: "error",
      message: "Choose a valid role.",
    });
    expect(dataQueries()).toEqual([]);
  });

  it("reports an account that no longer exists", async () => {
    const result = await updateUserRole(idle, form({ userId: "99999999-9999-4999-8999-999999999999", role: "agent" }));
    expect(result).toEqual({ status: "error", message: "This account no longer exists." });
    expect(updates()).toEqual([]);
  });

  it("reports a database permission refusal without details", async () => {
    updateError = { code: "42501", message: "permission denied for table profiles" };
    const result = await updateUserRole(idle, form({ userId: USER_ID, role: "agent" }));
    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/permission/i) });
    expect(JSON.stringify(result)).not.toContain("table profiles");
  });
});
