import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database";

/*
 * The real getUserBookings query against the live project, with the server client swapped for a
 * plain supabase-js client (signed in as the test user, or anonymous). Read-only. Runs only when
 * AUTH_TEST_EMAIL / AUTH_TEST_PASSWORD are set (see .env.example).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const email = process.env.AUTH_TEST_EMAIL ?? "";
const password = process.env.AUTH_TEST_PASSWORD ?? "";
const enabled = Boolean(url && publishableKey && email && password);

const options = { auth: { persistSession: false, autoRefreshToken: false } };
let activeClient: SupabaseClient<Database>;

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => activeClient }));

const { getUserBookings } = await import("@/lib/queries/supabase/bookings");

describe.skipIf(!enabled)("getUserBookings (live)", () => {
  const signedIn = createClient<Database>(url, publishableKey, options);
  const anonymous = createClient<Database>(url, publishableKey, options);
  let userId = "";

  beforeAll(async () => {
    const { data, error } = await signedIn.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Test-account sign-in failed: ${error.code ?? error.status}`);
    userId = data.user.id;
  });

  afterAll(async () => {
    await signedIn.auth.signOut({ scope: "local" });
  });

  it("returns the user's bookings with the listing and its agent", async () => {
    activeClient = signedIn;
    const bookings = await getUserBookings(userId);
    expect(bookings.length).toBeGreaterThan(0); // the Phase 8 test booking

    // Every row really is this user's (checked straight against the table).
    const { data: raw } = await signedIn.from("bookings").select("id, user_id, agent_id, property_id");
    const owners = new Map(raw?.map((r) => [r.id, r]));
    for (const booking of bookings) {
      const source = owners.get(booking.id);
      expect(source?.user_id).toBe(userId);
      expect(booking.property?.id).toBe(source?.property_id);
      expect(booking.agent?.id).toBe(source?.agent_id);
      expect(booking.reference).toBe(booking.id.slice(0, 8).toUpperCase());
      expect(booking.time).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it("returns nothing when asked for another user's bookings", async () => {
    activeClient = signedIn;
    expect(await getUserBookings("00000000-0000-0000-0000-000000000000")).toEqual([]);
  });

  it("refuses an anonymous visitor outright, even with a real user id", async () => {
    // Anonymous visitors have no read access to bookings at all (not just zero matching rows).
    activeClient = anonymous;
    await expect(getUserBookings(userId)).rejects.toMatchObject({
      name: "DataAccessError",
      code: "42501",
    });
  });

  it("does not leak other users' bookings through the public listings", async () => {
    // Embedding bookings under properties still applies RLS: a signed-in user only ever sees their
    // own rows, and an anonymous visitor gets none (or an error).
    type WithBookings = { id: string; bookings: { user_id: string }[] };

    const mine = await signedIn.from("properties").select("id, bookings(user_id)");
    expect(mine.error).toBeNull();
    const embedded = (mine.data as unknown as WithBookings[]).flatMap((p) => p.bookings);
    expect(embedded.length).toBeGreaterThan(0);
    expect(embedded.every((b) => b.user_id === userId)).toBe(true);

    const anon = await anonymous.from("properties").select("id, bookings(user_id)");
    const anonEmbedded = ((anon.data ?? []) as unknown as WithBookings[]).flatMap((p) => p.bookings ?? []);
    expect(anonEmbedded).toEqual([]);
  });
});
