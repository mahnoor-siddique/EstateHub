import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * sendContactRequest with the Supabase server client mocked, so we can see exactly what would be
 * sent to the database and control whether the caller is signed in. The live test
 * (contact.integration.test.ts) checks the database side.
 */

const inserts: unknown[] = [];
let selectCalled = false;
let insertError: { code: string; message: string } | null = null;
let claims: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: claims && { claims }, error: null }) },
    from: (table: string) => {
      expect(table).toBe("contact_requests");
      return {
        insert: (payload: unknown) => {
          inserts.push(payload);
          const response = { data: null, error: insertError };
          return {
            select: () => {
              selectCalled = true;
              return Promise.resolve(response);
            },
            then: (resolve: (value: unknown) => unknown) => resolve(response),
          };
        },
      };
    },
  }),
}));

const { sendContactRequest } = await import("@/lib/contact/actions");

const PROPERTY_ID = "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264";
const AGENT_ID = "6ceb4716-6d87-591e-9ead-212a4e979b44";

function form(fields: Record<string, string>) {
  const data = new FormData();
  const all = {
    name: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "",
    message: "Is this still available for viewing?",
    ...fields,
  };
  for (const [key, value] of Object.entries(all)) data.set(key, value);
  return data;
}

const idle = { status: "idle" } as const;

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
  inserts.length = 0;
  selectCalled = false;
  insertError = null;
  claims = { sub: "user-1", email: "ayesha@example.com" };
});

describe("sendContactRequest (signed out)", () => {
  beforeEach(() => {
    claims = null;
  });

  it("rejects a direct call and sends the guest to login, keeping the property and agent", async () => {
    const target = await redirectTarget(() =>
      sendContactRequest(idle, form({ propertyId: PROPERTY_ID, agentId: AGENT_ID })),
    );
    expect(target).toBe(
      `/login?next=${encodeURIComponent(`/contact?propertyId=${PROPERTY_ID}&agentId=${AGENT_ID}`)}`,
    );
    expect(inserts).toHaveLength(0);
  });

  it("keeps an agent-only enquiry's context", async () => {
    const target = await redirectTarget(() => sendContactRequest(idle, form({ agentId: AGENT_ID })));
    expect(target).toBe(`/login?next=${encodeURIComponent(`/contact?agentId=${AGENT_ID}`)}`);
  });

  it("drops tampered ids from the return path", async () => {
    const target = await redirectTarget(() =>
      sendContactRequest(idle, form({ propertyId: "//evil.com", agentId: "x&next=/y" })),
    );
    expect(target).toBe(`/login?next=${encodeURIComponent("/contact")}`);
  });

  it("checks the session before anything else, even for honeypot or invalid submissions", async () => {
    expect(await redirectTarget(() => sendContactRequest(idle, form({ website: "spam" })))).toMatch(/^\/login/);
    expect(await redirectTarget(() => sendContactRequest(idle, form({ email: "nope" })))).toMatch(/^\/login/);
    expect(inserts).toHaveLength(0);
  });
});

describe("sendContactRequest (signed in)", () => {
  it("saves a valid enquiry and reports success", async () => {
    const state = await sendContactRequest(idle, form({ propertyId: PROPERTY_ID, agentId: AGENT_ID }));
    expect(state).toEqual({ status: "success", email: "ayesha@example.com" });
    expect(inserts).toEqual([
      {
        property_id: PROPERTY_ID,
        agent_id: AGENT_ID,
        name: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: null,
        message: "Is this still available for viewing?",
      },
    ]);
  });

  it("never sends a user_id, even when the browser submits one", async () => {
    await sendContactRequest(
      idle,
      form({ user_id: "00000000-0000-0000-0000-000000000000", userId: "someone-else" }),
    );
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).not.toHaveProperty("user_id");
    expect(JSON.stringify(inserts[0])).not.toContain("00000000-0000-0000-0000-000000000000");
  });

  it("does not ask for the row back", async () => {
    await sendContactRequest(idle, form({}));
    expect(selectCalled).toBe(false);
  });

  it("rejects invalid input without touching the database", async () => {
    const state = await sendContactRequest(idle, form({ email: "nope", message: "short" }));
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { email: "Enter a valid email address.", message: expect.stringMatching(/at least 10/) },
      values: { email: "nope", message: "short" },
    });
    expect(inserts).toHaveLength(0);
  });

  it("quietly drops submissions that fill the honeypot field", async () => {
    const state = await sendContactRequest(idle, form({ website: "http://spam.example" }));
    expect(state.status).toBe("success");
    expect(inserts).toHaveLength(0);
  });

  it.each([
    ["23503", "We couldn't find that property or agent. It may have been removed."],
    ["P0001", "This form is out of date. Please reload the page and try again."],
  ])("maps database error %s to a friendly message", async (code, message) => {
    insertError = { code, message: "raw database text" };
    const state = await sendContactRequest(idle, form({ propertyId: PROPERTY_ID }));
    expect(state).toMatchObject({ status: "error", message });
  });

  it("logs only the error code for unexpected failures", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    insertError = { code: "XX000", message: "internal error for ayesha@example.com" };
    const state = await sendContactRequest(idle, form({}));
    expect(state).toMatchObject({ status: "error", message: "We couldn't send your message. Please try again." });
    expect(spy).toHaveBeenCalledWith("[contact] insert failed", { code: "XX000" });
    expect(JSON.stringify(spy.mock.calls)).not.toContain("ayesha@example.com");
    spy.mockRestore();
  });
});
