import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The Contact Agent login round trip, end to end on the server side, with Supabase and the data
 * queries mocked: a guest opening /contact is sent to login with the enquiry in `next`, logging in
 * or signing up returns them to that exact URL, and a signed-in user gets the form with the
 * listing and agent filled in. Book a Viewing is checked alongside so it stays unchanged.
 */

const PROPERTY_ID = "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264";
const AGENT_ID = "6ceb4716-6d87-591e-9ead-212a4e979b44";
const CONTACT_URL = `/contact?propertyId=${PROPERTY_ID}&agentId=${AGENT_ID}`;

let claims: Record<string, unknown> | null = null;
let signUpSession: object | null = null;
const signUpCalls: Array<{ options: { emailRedirectTo?: string } }> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({ data: claims && { claims }, error: null }),
      signInWithPassword: async () => ({ data: {}, error: null }),
      signUp: async (args: { options: { emailRedirectTo?: string } }) => {
        signUpCalls.push(args);
        return { data: { session: signUpSession }, error: null };
      },
    },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "http://localhost:3000" }),
}));

const property = { id: PROPERTY_ID, agentId: AGENT_ID, title: "Garden house" };
const agent = { id: AGENT_ID, fullName: "Sara Malik", agencyName: "Malik Estates", title: "Senior agent" };
const getPropertyById = vi.fn(async (id: string) => (id === PROPERTY_ID ? property : null));
const getAgentById = vi.fn(async (id: string) => (id === AGENT_ID ? agent : null));
const getAgents = vi.fn(async () => [agent]);
const getBookableProperty = vi.fn<(id: string) => Promise<null>>(async () => null);

vi.mock("@/lib/queries/supabase/properties", () => ({ getPropertyById }));
vi.mock("@/lib/queries/supabase/agents", () => ({ getAgentById, getAgents }));
vi.mock("@/lib/queries/supabase/bookings", () => ({ getBookableProperty }));

const { default: ContactPage } = await import("@/app/contact/page");
const { default: BookingPage } = await import("@/app/booking/page");
const { default: LoginPage } = await import("@/app/login/page");
const { ContactForm } = await import("@/components/contact/ContactForm");
const { LoginForm } = await import("@/components/auth/LoginForm");
const { logIn, signUp } = await import("@/lib/auth/actions");

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

/** First element of the given component type in a rendered (not mounted) element tree. */
function findElement(node: ReactNode, type: unknown): ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement<Record<string, unknown>>(node)) return null;
  if (node.type === type) return node;
  for (const value of Object.values(node.props)) {
    const found = findElement(value as ReactNode, type);
    if (found) return found;
  }
  return null;
}

const page = (params: Record<string, string>) => ({ searchParams: Promise.resolve(params) }) as never;

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  claims = null;
  signUpSession = null;
  signUpCalls.length = 0;
  vi.clearAllMocks();
});

describe("guest clicks Contact Agent", () => {
  it("is sent to login with the property and agent kept in the return path", async () => {
    const target = await redirectTarget(() => ContactPage(page({ propertyId: PROPERTY_ID, agentId: AGENT_ID })));
    expect(target).toBe(`/login?next=${encodeURIComponent(CONTACT_URL)}`);
    expect(getPropertyById).not.toHaveBeenCalled(); // nothing is loaded for a guest
  });

  it("from an agent profile keeps just the agent", async () => {
    const target = await redirectTarget(() => ContactPage(page({ agentId: AGENT_ID })));
    expect(target).toBe(`/login?next=${encodeURIComponent(`/contact?agentId=${AGENT_ID}`)}`);
  });

  it("sees a 'log in to continue' notice on the login page", async () => {
    const element = await LoginPage(page({ next: CONTACT_URL }));
    const loginForm = findElement(element, LoginForm);
    expect(loginForm?.props).toMatchObject({
      next: CONTACT_URL,
      notice: { tone: "info", message: expect.stringMatching(/log in to continue/i) },
    });
  });
});

describe("after authenticating", () => {
  it("login returns the user to the intended contact URL", async () => {
    const target = await redirectTarget(() =>
      logIn({ status: "idle" }, form({ email: "ayesha@example.com", password: "correct-horse-9", next: CONTACT_URL })),
    );
    expect(target).toBe(CONTACT_URL);
  });

  it("signup (no email confirmation) returns the user to the intended contact URL", async () => {
    signUpSession = { access_token: "t" };
    const target = await redirectTarget(() => signUp({ status: "idle" }, signupForm()));
    expect(target).toBe(CONTACT_URL);
  });

  it("signup with email confirmation carries the contact URL through the confirmation link", async () => {
    const state = await signUp({ status: "idle" }, signupForm());
    expect(state.status).toBe("success");
    expect(signUpCalls[0].options.emailRedirectTo).toBe(
      `http://localhost:3000/auth/confirm?next=${encodeURIComponent(CONTACT_URL)}`,
    );
  });

  function signupForm() {
    return form({
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-9",
      next: CONTACT_URL,
    });
  }
});

describe("signed-in user on /contact", () => {
  beforeEach(() => {
    claims = { sub: "user-1", email: "ayesha@example.com", user_metadata: { full_name: "Ayesha Khan" } };
  });

  it("gets the form for the same listing and agent, prefilled from their account", async () => {
    const element = await ContactPage(page({ propertyId: PROPERTY_ID, agentId: AGENT_ID }));
    const contactForm = findElement(element, ContactForm);
    expect(contactForm?.props).toMatchObject({
      propertyId: PROPERTY_ID,
      agent: { id: AGENT_ID, fullName: "Sara Malik", agencyName: "Malik Estates" },
      defaults: { name: "Ayesha Khan", email: "ayesha@example.com" },
    });
    expect(getPropertyById).toHaveBeenCalledWith(PROPERTY_ID);
    expect(getAgentById).toHaveBeenCalledWith(AGENT_ID);
  });

  it("gets the agent-only form from an agent profile link", async () => {
    const element = await ContactPage(page({ agentId: AGENT_ID }));
    expect(findElement(element, ContactForm)?.props).toMatchObject({
      propertyId: null,
      agent: { id: AGENT_ID },
    });
  });
});

describe("Book a Viewing (unchanged)", () => {
  it("still sends a guest to login with the property in the return path", async () => {
    const target = await redirectTarget(() => BookingPage(page({ propertyId: PROPERTY_ID })));
    expect(target).toBe(`/login?next=${encodeURIComponent(`/booking?propertyId=${PROPERTY_ID}`)}`);
  });

  it("still lets a signed-in user through", async () => {
    claims = { sub: "user-1", email: "ayesha@example.com" };
    expect(await redirectTarget(() => BookingPage(page({ propertyId: PROPERTY_ID })))).toBeNull();
    expect(getBookableProperty).toHaveBeenCalledWith(PROPERTY_ID);
  });
});
