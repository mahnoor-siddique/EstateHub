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
 * Admin → Bookings with a fake Supabase client: who can open /admin/bookings, what the list shows,
 * and the updateBookingStatus Server Action (authorization, every status change, invalid input,
 * and that nothing but the status is ever sent). The database side — admins may read every
 * booking and update only its status — is checked separately against Postgres.
 */

type Query = { table: string; op: string; payload?: unknown; filters: [string, unknown][] };
type Result = { data: unknown; error: { code: string; message: string } | null };

let claims: Record<string, unknown> | null;
let role: string | null;
let tables: Record<string, (q: Query) => Result>;
const queries: Query[] = [];
const revalidatePath = vi.fn();

function builder(table: string) {
  const query: Query = { table, op: "select", filters: [] };
  const b: Record<string, unknown> = {
    select: () => b,
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
      const result =
        table === "profiles"
          ? { data: role ? { role, full_name: "Sana Malik" } : null, error: null }
          : (tables[`${table}.${query.op}`]?.(query) ?? { data: [], error: null });
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
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const { updateBookingStatus } = await import("@/lib/admin/bookings/actions");
const { getAdminBookings } = await import("@/lib/admin/queries");
const { default: AdminBookingsPage } = await import("@/app/admin/bookings/page");

const USER_ID = "7d1c2f0e-0000-4000-8000-000000000001";
const BOOKING_ID = "5f1e2d3c-4b5a-4968-8776-655443322110";
const OTHER_BOOKING_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
const idle = { status: "idle" } as const;

/** Two stored bookings, as PostgREST returns them with the embedded property and agent. */
const storedBookings = [
  {
    id: BOOKING_ID,
    booking_date: "2026-10-12",
    booking_time: "14:30:00",
    status: "pending",
    name: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "+92 300 1234567",
    message: "Can we view in the afternoon?\nTwo of us.",
    created_at: "2026-09-28T09:15:00+00:00",
    properties: { id: "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264", title: "Modern Villa with Landscaped Garden", city: "Lahore" },
    agents: { id: "6ceb4716-6d87-591e-9ead-212a4e979b44", full_name: "Sara Malik" },
  },
  {
    id: OTHER_BOOKING_ID,
    booking_date: "2026-10-05",
    booking_time: "10:00:00",
    status: "cancelled",
    name: "Bilal Ahmed",
    email: "bilal@example.com",
    phone: "0300-7654321",
    message: null,
    created_at: "2026-09-20T12:00:00+00:00",
    properties: null, // e.g. not readable
    agents: null,
  },
];

const signIn = (as: string, extra: Record<string, unknown> = {}) => {
  claims = { sub: USER_ID, email: "someone@example.com", ...extra };
  role = as;
};

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

const bookingQueries = () => queries.filter((q) => q.table === "bookings");
const updates = () => queries.filter((q) => q.op === "update");
const renderPage = async () => renderToStaticMarkup((await AdminBookingsPage()) as ReactElement);

const NON_ADMINS = [
  ["normal user", "user", {}],
  ["agent", "agent", {}],
  ["user with forged admin claims", "user", { role: "admin", user_metadata: { role: "admin" }, app_metadata: { role: "admin" } }],
] as const;

// In-memory status of each booking, so a sequence of changes can be followed.
let stored: Record<string, string>;

beforeEach(() => {
  claims = null;
  role = null;
  queries.length = 0;
  revalidatePath.mockClear();
  stored = { [BOOKING_ID]: "pending" };
  tables = {
    "bookings.select": () => ({ data: storedBookings, error: null }),
    "bookings.update": (q) => {
      const id = q.filters.find(([column]) => column === "id")?.[1] as string;
      if (!(id in stored)) return { data: [], error: null };
      stored[id] = (q.payload as { status: string }).status;
      return { data: [{ id }], error: null };
    },
  };
});

describe("/admin/bookings page", () => {
  it("sends guests to login without loading any booking", async () => {
    expect(await outcome(renderPage)).toEqual({ redirect: "/login?next=%2Fadmin%2Fbookings" });
    expect(bookingQueries()).toEqual([]);
  });

  it.each(NON_ADMINS)("gives a %s a 404 without loading any booking", async (_label, as, extra) => {
    signIn(as, extra);
    expect(await outcome(renderPage)).toEqual({ status: 404 });
    expect(bookingQueries()).toEqual([]);
  });

  it("lists every booking with its details and a status control for the admin", async () => {
    signIn("admin");
    const html = await renderPage();

    for (const text of [
      "5F1E2D3C", // reference
      "Modern Villa with Landscaped Garden",
      "Ayesha Khan",
      "ayesha@example.com",
      "+92 300 1234567",
      "Monday, 12 October 2026",
      "2:30 PM",
      "Sara Malik",
      "Can we view in the afternoon?",
      "28 Sept 2026", // requested (created) date, Pakistan time
      "9A8B7C6D",
      "Bilal Ahmed",
      "Property unavailable",
    ]) {
      expect(html, text).toContain(text);
    }
    expect(html).toContain('href="mailto:ayesha@example.com"');
    expect(html).toContain('href="tel:+923001234567"');
    // One status form per booking, each preselecting the booking's current status.
    expect(html.match(/name="bookingId"/g)).toHaveLength(2);
    expect(html).toMatch(new RegExp(`value="${BOOKING_ID}"[\\s\\S]*?<option value="pending" selected="">`));
    expect(html).toMatch(new RegExp(`value="${OTHER_BOOKING_ID}"[\\s\\S]*?<option value="cancelled" selected="">`));
    expect(html).toContain("1 pending · 0 confirmed · 1 cancelled · 0 completed");
  });

  it("shows an empty state when there are no bookings", async () => {
    signIn("admin");
    tables["bookings.select"] = () => ({ data: [], error: null });
    expect(await renderPage()).toContain("No viewing requests yet");
  });
});

describe("getAdminBookings", () => {
  it("maps each booking for display (reference, HH:MM time, property and agent)", async () => {
    signIn("admin");
    const [first, second] = await getAdminBookings();
    expect(first).toEqual({
      id: BOOKING_ID,
      reference: "5F1E2D3C",
      date: "2026-10-12",
      time: "14:30",
      status: "pending",
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "+92 300 1234567",
      message: "Can we view in the afternoon?\nTwo of us.",
      createdAt: "2026-09-28T09:15:00+00:00",
      property: { id: "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264", title: "Modern Villa with Landscaped Garden", city: "Lahore" },
      agent: { id: "6ceb4716-6d87-591e-9ead-212a4e979b44", fullName: "Sara Malik" },
    });
    expect(second).toMatchObject({ reference: "9A8B7C6D", property: null, agent: null, message: null });
  });

  it("does not filter by user: which rows come back is left to the database's admin policy", async () => {
    signIn("admin");
    await getAdminBookings();
    expect(bookingQueries()[0].filters).toEqual([]);
  });
});

describe("updateBookingStatus authorization", () => {
  it("sends a guest to login and changes nothing", async () => {
    expect(await outcome(() => updateBookingStatus(idle, form({ bookingId: BOOKING_ID, status: "confirmed" })))).toEqual({
      redirect: "/login?next=%2Fadmin%2Fbookings",
    });
    expect(bookingQueries()).toEqual([]);
    expect(stored[BOOKING_ID]).toBe("pending");
  });

  it.each(NON_ADMINS)("gives a %s a 404 and changes nothing", async (_label, as, extra) => {
    signIn(as, extra);
    expect(await outcome(() => updateBookingStatus(idle, form({ bookingId: BOOKING_ID, status: "confirmed" })))).toEqual({
      status: 404,
    });
    expect(bookingQueries()).toEqual([]);
    expect(stored[BOOKING_ID]).toBe("pending");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateBookingStatus (admin)", () => {
  beforeEach(() => signIn("admin"));

  const transitions = STATUSES.flatMap((from) => STATUSES.filter((to) => to !== from).map((to) => [from, to] as const));

  it.each(transitions)("changes %s → %s, sending only the new status for that booking", async (from, to) => {
    stored[BOOKING_ID] = from;
    const result = await updateBookingStatus(idle, form({ bookingId: BOOKING_ID, status: to }));

    expect(result).toEqual({ status: "success", message: expect.stringMatching(/^Marked /) });
    expect(stored[BOOKING_ID]).toBe(to);
    expect(updates()).toEqual([{ table: "bookings", op: "update", payload: { status: to }, filters: [["id", BOOKING_ID]] }]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("ignores any other booking details sent with the form", async () => {
    await updateBookingStatus(
      idle,
      form({
        bookingId: BOOKING_ID,
        status: "confirmed",
        user_id: "00000000-0000-0000-0000-000000000000",
        property_id: "00000000-0000-0000-0000-000000000001",
        agent_id: "00000000-0000-0000-0000-000000000002",
        booking_date: "2030-01-01",
        booking_time: "09:00",
        name: "Someone Else",
        email: "x@example.com",
        phone: "0000",
        message: "changed",
        created_at: "2000-01-01",
      }),
    );
    expect(updates()).toHaveLength(1);
    expect(updates()[0].payload).toEqual({ status: "confirmed" });
  });

  it.each([
    ["an unknown status", { bookingId: BOOKING_ID, status: "archived" }],
    ["an empty status", { bookingId: BOOKING_ID, status: "" }],
    ["no status", { bookingId: BOOKING_ID }],
    ["a status in the wrong case", { bookingId: BOOKING_ID, status: "Confirmed" }],
    ["a malformed booking id", { bookingId: "not-a-uuid", status: "confirmed" }],
    ["no booking id", { status: "confirmed" }],
  ])("rejects %s without writing", async (_label, fields) => {
    expect(await updateBookingStatus(idle, form(fields as Record<string, string>))).toEqual({
      status: "error",
      message: "Choose a valid status.",
    });
    expect(updates()).toEqual([]);
    expect(stored[BOOKING_ID]).toBe("pending");
  });

  it("reports a booking that no longer exists", async () => {
    const result = await updateBookingStatus(idle, form({ bookingId: OTHER_BOOKING_ID, status: "confirmed" }));
    expect(result).toEqual({ status: "error", message: "This booking no longer exists." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("explains the slot conflict when re-opening a cancelled booking whose slot is taken", async () => {
    tables["bookings.update"] = () => ({ data: null, error: { code: "23505", message: "duplicate key" } });
    const result = await updateBookingStatus(idle, form({ bookingId: BOOKING_ID, status: "pending" }));
    expect(result).toMatchObject({ status: "error", message: expect.stringContaining("another active request") });
  });

  it("reports a database permission refusal without details", async () => {
    tables["bookings.update"] = () => ({ data: null, error: { code: "42501", message: "permission denied for table bookings" } });
    const result = await updateBookingStatus(idle, form({ bookingId: BOOKING_ID, status: "confirmed" }));
    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/permission/i) });
    expect(JSON.stringify(result)).not.toContain("table bookings");
  });
});
