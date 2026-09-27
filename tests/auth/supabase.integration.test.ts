import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import type { Database } from "@/types/database";

/*
 * Live checks against the real Supabase project, as a real (confirmed) test user:
 * session cookies, Row Level Security on the Phase 7 tables, the proxy with a genuine and a forged
 * session, and sign-out revoking the session.
 *
 * Runs only when AUTH_TEST_EMAIL and AUTH_TEST_PASSWORD are set (e.g. in .env.test.local, which is
 * gitignored). Uses only the public URL + publishable key — the same access any browser has.
 * Nothing is written: every write attempted here is one that RLS/privileges must reject.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const email = process.env.AUTH_TEST_EMAIL ?? "";
const password = process.env.AUTH_TEST_PASSWORD ?? "";
const enabled = Boolean(url && publishableKey && email && password);

/** A server client whose cookies live in a Map, standing in for a browser's cookie jar. */
function cookieJarClient() {
  const jar = new Map<string, string>();
  const client = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) =>
        cookies.forEach(({ name, value, options }) =>
          options?.maxAge === 0 || value === "" ? jar.delete(name) : jar.set(name, value),
        ),
    },
  });
  return { client, jar };
}

function pageRequest(path: string, cookies: Map<string, string>) {
  const cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers: { cookie } });
}

const passesThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

/**
 * Rebuilds the session cookie as a single cookie. With `tamper`, the access token's payload is
 * changed (claiming another user) while the original signature is kept, as a forger would have to.
 */
function rebuildSessionCookie(jar: Map<string, string>, tamper: boolean): Map<string, string> {
  const names = [...jar.keys()].filter((name) => /-auth-token(\.\d+)?$/.test(name)).sort();
  const baseName = names[0].replace(/\.\d+$/, "");
  const encoded = names.map((name) => jar.get(name)).join("");
  const session = JSON.parse(Buffer.from(encoded.replace(/^base64-/, ""), "base64url").toString());

  if (tamper) {
    const [header, payload, signature] = session.access_token.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    claims.sub = "00000000-0000-0000-0000-000000000000"; // pretend to be someone else
    const forgedPayload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    session.access_token = [header, forgedPayload, signature].join(".");
  }

  const value = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  return new Map([[baseName, value]]);
}

describe.skipIf(!enabled)("Supabase auth + RLS (live)", () => {
  const { client: supabase, jar } = cookieJarClient();
  let userId = "";
  let refreshToken = "";

  beforeAll(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Test-account sign-in failed: ${error.code ?? error.status}`);
    userId = data.user.id;
    refreshToken = data.session.refresh_token;
  });

  afterAll(async () => {
    await supabase.auth.signOut({ scope: "local" }); // no-op if the sign-out test already ran
  });

  it("stores the session in cookies", () => {
    expect([...jar.keys()].some((name) => name.includes("-auth-token"))).toBe(true);
  });

  describe("Row Level Security", () => {
    it("hides private tables from anonymous visitors", async () => {
      const anon = createClient<Database>(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      for (const table of ["profiles", "bookings", "contact_requests"] as const) {
        const { data } = await anon.from(table).select("id");
        expect(data ?? [], table).toHaveLength(0);
      }
    });

    it("gives the user exactly their own profile, created at signup as a normal user", async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, role, full_name");
      expect(error).toBeNull();
      expect(data).toHaveLength(1); // other users' profiles are invisible
      expect(data?.[0]).toMatchObject({ id: userId, email, role: "user" });
      expect(data?.[0].full_name).toBeTruthy(); // copied from signup metadata by the trigger
    });

    it("does not let a user make themselves an agent", async () => {
      await supabase.from("profiles").update({ role: "agent" }).eq("id", userId);
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
      expect(data?.role).toBe("user");
    });

    it("rejects creating or deleting profiles from the browser", async () => {
      const insert = await supabase
        .from("profiles")
        .insert({ id: crypto.randomUUID(), email: "intruder@example.com" });
      expect(insert.error).not.toBeNull();

      await supabase.from("profiles").delete().eq("id", userId);
      const { data } = await supabase.from("profiles").select("id").eq("id", userId);
      expect(data).toHaveLength(1);
    });

    it("only ever returns the user's own bookings and contact requests", async () => {
      for (const table of ["bookings", "contact_requests"] as const) {
        const { data, error } = await supabase.from(table).select("user_id");
        expect(error, table).toBeNull();
        expect(data?.every((row) => row.user_id === userId), table).toBe(true);
      }
    });
  });

  describe("proxy with a real session", () => {
    it("sends a signed-in user away from /login and /signup", async () => {
      for (const path of ["/login", "/signup"]) {
        const response = await proxy(pageRequest(path, jar));
        expect(response.headers.get("location"), path).toBe("http://localhost:3000/");
      }
      const withNext = await proxy(pageRequest("/login?next=%2Fproperties%3Fcity%3DLahore", jar));
      expect(withNext.headers.get("location")).toBe("http://localhost:3000/properties?city=Lahore");
    });

    it("lets a signed-in user into protected and public pages", async () => {
      for (const path of ["/booking?propertyId=abc", "/properties", "/"]) {
        expect(passesThrough(await proxy(pageRequest(path, jar))), path).toBe(true);
      }
    });

    it("accepts the untampered session rebuilt the same way (control for the forgery test)", async () => {
      const response = await proxy(pageRequest("/booking", rebuildSessionCookie(jar, false)));
      expect(passesThrough(response)).toBe(true);
    });

    it("treats a forged session cookie as signed out", async () => {
      const response = await proxy(pageRequest("/booking", rebuildSessionCookie(jar, true)));
      expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fbooking");
    });
  });

  describe("sign out", () => {
    it("clears the cookies and revokes the refresh token", async () => {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      expect(error).toBeNull();
      expect([...jar.keys()].some((name) => /-auth-token(\.\d+)?$/.test(name))).toBe(false);

      const fresh = createClient(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error: refreshError } = await fresh.auth.refreshSession({
        refresh_token: refreshToken,
      });
      expect(data.session).toBeNull();
      expect(refreshError).not.toBeNull();
    });

    it("sends the signed-out browser back to login for protected pages", async () => {
      const response = await proxy(pageRequest("/booking", jar));
      expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fbooking");
    });
  });
});
