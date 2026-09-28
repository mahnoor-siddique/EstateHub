import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

/*
 * Live checks of contact_requests permissions (migration 20260930000000_contact_requests.sql) as
 * an anonymous guest and as the signed-in test user. Runs only when AUTH_TEST_EMAIL /
 * AUTH_TEST_PASSWORD are set (see .env.example).
 *
 * Unlike the booking checks, this suite must write: each run saves exactly two clearly labelled
 * enquiries (one guest, one signed-in). Every other insert here must be rejected.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const email = process.env.AUTH_TEST_EMAIL ?? "";
const password = process.env.AUTH_TEST_PASSWORD ?? "";
const enabled = Boolean(url && publishableKey && email && password);

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const SOMEONE_ELSE = "00000000-0000-0000-0000-000000000000";
const LABEL = `[automated test ${new Date().toISOString()}]`;

describe.skipIf(!enabled)("contact requests (live)", () => {
  const guest: SupabaseClient<Database> = createClient<Database>(url, publishableKey, options);
  const user: SupabaseClient<Database> = createClient<Database>(url, publishableKey, options);
  let userId = "";
  let propertyId = "";
  let listingAgentId = "";
  let otherAgentId = "";

  /** A valid enquiry; tests change one thing to make it invalid. */
  const enquiry = (overrides: Record<string, unknown> = {}) => ({
    name: "Integration Test",
    email: "integration-test@example.com",
    phone: "0300 1234567",
    message: `${LABEL} Contact-request permission check.`,
    ...overrides,
  });

  beforeAll(async () => {
    const { data, error } = await user.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Test-account sign-in failed: ${error.code ?? error.status}`);
    userId = data.user.id;

    const property = await guest.from("properties").select("id, agent_id").limit(1).single();
    if (property.error) throw new Error("No property to test with");
    propertyId = property.data.id;
    listingAgentId = property.data.agent_id;

    const other = await guest.from("agents").select("id").neq("id", listingAgentId).limit(1).single();
    if (other.error) throw new Error("Need a second agent to test with");
    otherAgentId = other.data.id;
  });

  afterAll(async () => {
    await user.auth.signOut({ scope: "local" });
  });

  describe("guests", () => {
    it("can send a valid enquiry", async () => {
      const { error } = await guest.from("contact_requests").insert(enquiry({ agent_id: listingAgentId }));
      expect(error).toBeNull();
    });

    it("cannot claim to be a user", async () => {
      const { error } = await guest
        .from("contact_requests")
        .insert({ ...enquiry(), user_id: SOMEONE_ELSE } as never);
      expect(error?.code).toBe("42501"); // user_id is not an insertable column
    });

    it("cannot read any contact requests", async () => {
      const { data, error } = await guest.from("contact_requests").select("id");
      expect(data ?? []).toHaveLength(0);
      expect(error?.code).toBe("42501");
    });
  });

  describe("signed-in users", () => {
    it("are recorded as the sender automatically, with the listing's agent filled in", async () => {
      const message = `${LABEL} Signed-in enquiry about a property.`;
      const { error } = await user
        .from("contact_requests")
        .insert(enquiry({ property_id: propertyId, message }));
      expect(error).toBeNull();

      const { data } = await user
        .from("contact_requests")
        .select("user_id, property_id, agent_id, message")
        .eq("message", message)
        .single();
      expect(data).toEqual({ user_id: userId, property_id: propertyId, agent_id: listingAgentId, message });
    });

    it("cannot send an enquiry as another user", async () => {
      const { error } = await user
        .from("contact_requests")
        .insert({ ...enquiry(), user_id: SOMEONE_ELSE } as never);
      expect(error?.code).toBe("42501");
    });

    it("only ever read their own contact requests", async () => {
      const { data, error } = await user.from("contact_requests").select("user_id");
      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.every((row) => row.user_id === userId)).toBe(true);
    });
  });

  describe("invalid enquiries are rejected", () => {
    it("rejects an agent that does not handle the property", async () => {
      const { error } = await guest
        .from("contact_requests")
        .insert(enquiry({ property_id: propertyId, agent_id: otherAgentId }));
      expect(error?.code).toBe("P0001");
    });

    it("rejects unknown properties and agents", async () => {
      const property = await guest.from("contact_requests").insert(enquiry({ property_id: SOMEONE_ELSE }));
      expect(property.error?.code).toBe("23503");
      const agent = await guest.from("contact_requests").insert(enquiry({ agent_id: SOMEONE_ELSE }));
      expect(agent.error?.code).toBe("23503");
    });

    it.each([
      ["an invalid email", { email: "not-an-email" }],
      ["an empty message", { message: "" }],
      ["an empty name", { name: "" }],
      ["an overlong phone", { phone: "1".repeat(31) }],
    ])("rejects %s via the table constraints", async (_label, overrides) => {
      const { error } = await guest.from("contact_requests").insert(enquiry(overrides));
      expect(error?.code).toBe("23514");
    });

    it("does not let clients set the creation time", async () => {
      const { error } = await guest
        .from("contact_requests")
        .insert({ ...enquiry(), created_at: "2000-01-01T00:00:00Z" });
      expect(error?.code).toBe("42501");
    });
  });
});
