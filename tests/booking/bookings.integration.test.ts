import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays, pakistanNow } from "@/lib/validations/booking";
import type { Database } from "@/types/database";

/*
 * Live checks of the bookings permissions (migration 20260929000000_booking_requests.sql) as a real
 * signed-in test user. Every insert here is one the database MUST reject, so a passing run writes
 * nothing. Runs only when AUTH_TEST_EMAIL / AUTH_TEST_PASSWORD are set (see .env.example).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const email = process.env.AUTH_TEST_EMAIL ?? "";
const password = process.env.AUTH_TEST_PASSWORD ?? "";
const enabled = Boolean(url && publishableKey && email && password);

const options = { auth: { persistSession: false, autoRefreshToken: false } };

describe.skipIf(!enabled)("bookings permissions (live)", () => {
  const supabase: SupabaseClient<Database> = createClient<Database>(url, publishableKey, options);
  let userId = "";
  let propertyId = "";
  let agentId = "";
  const tomorrow = addDays(pakistanNow().date, 1);

  /** A well-formed request for this user; tests change one thing to make it invalid. */
  const request = (overrides: Record<string, unknown> = {}) => ({
    user_id: userId,
    property_id: propertyId,
    booking_date: tomorrow,
    booking_time: "10:00",
    name: "Integration Test",
    email,
    phone: "0300 1234567",
    message: "Automated permission check - should never be saved.",
    ...overrides,
  });

  beforeAll(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Test-account sign-in failed: ${error.code ?? error.status}`);
    userId = data.user.id;

    const property = await supabase
      .from("properties")
      .select("id, agent_id")
      .eq("status", "available")
      .limit(1)
      .single();
    if (property.error) throw new Error("No available property to test with");
    propertyId = property.data.id;
    agentId = property.data.agent_id;
  });

  afterAll(async () => {
    await supabase.auth.signOut({ scope: "local" });
  });

  it("rejects anonymous booking requests", async () => {
    const anon = createClient<Database>(url, publishableKey, options);
    const { error } = await anon.from("bookings").insert(request());
    expect(error).not.toBeNull();
  });

  it("rejects a booking on behalf of another user", async () => {
    const { error } = await supabase
      .from("bookings")
      .insert(request({ user_id: "00000000-0000-0000-0000-000000000000" }));
    expect(error?.code).toBe("42501"); // row-level security violation
  });

  it("does not let the client choose the status", async () => {
    const { error } = await supabase.from("bookings").insert({ ...request(), status: "confirmed" });
    expect(error?.code).toBe("42501"); // no insert privilege on the status column
  });

  it("does not let the client choose the agent", async () => {
    const { error } = await supabase.from("bookings").insert({ ...request(), agent_id: agentId });
    expect(error?.code).toBe("42501"); // no insert privilege on the agent_id column
  });

  it("rejects dates in the past", async () => {
    const { error } = await supabase
      .from("bookings")
      .insert(request({ booking_date: addDays(pakistanNow().date, -1) }));
    expect(error?.code).toBe("42501");
  });

  it("rejects unknown properties", async () => {
    const { error } = await supabase
      .from("bookings")
      .insert(request({ property_id: "00000000-0000-0000-0000-000000000000" }));
    expect(error?.code).toBe("23503");
  });

  it("rejects invalid contact details via the table constraints", async () => {
    const { error } = await supabase.from("bookings").insert(request({ email: "not-an-email" }));
    expect(error?.code).toBe("23514");
  });

  it("only returns the user's own bookings", async () => {
    const { data, error } = await supabase.from("bookings").select("user_id, agent_id, status");
    expect(error).toBeNull();
    expect(data?.every((row) => row.user_id === userId)).toBe(true);
  });
});
