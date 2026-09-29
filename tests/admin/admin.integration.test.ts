import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

/*
 * Live checks of the admin database foundation (migrations 20261003000000/…100) against the real
 * Supabase project, as the normal (non-admin) test user from .env.test.local. Uses only the public
 * URL + publishable key — the same access any browser has. Nothing is written: every write
 * attempted here must be rejected.
 *
 * Skipped without test credentials. If the admin migrations have not been applied yet, the tests
 * skip themselves with a note instead of failing.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const email = process.env.AUTH_TEST_EMAIL ?? "";
const password = process.env.AUTH_TEST_PASSWORD ?? "";
const enabled = Boolean(url && publishableKey && email && password);

const client = () =>
  createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

describe.skipIf(!enabled)("admin authorization in the database (live)", () => {
  let supabase: SupabaseClient<Database>;
  let userId = "";
  let migrated = false;

  beforeAll(async () => {
    supabase = client();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Test-account sign-in failed: ${error.code ?? error.status}`);
    userId = data.user.id;

    // PGRST202: PostgREST does not know is_admin() — the migration has not been applied.
    const probe = await supabase.rpc("is_admin");
    migrated = probe.error?.code !== "PGRST202";
    if (!migrated) console.warn("[admin tests] is_admin() not found: apply the admin migrations.");
  });

  afterAll(async () => {
    await supabase?.auth.signOut({ scope: "local" });
  });

  it("reports a normal user as not an admin", async ({ skip }) => {
    if (!migrated) skip();
    const { data, error } = await supabase.rpc("is_admin");
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("does not let guests call is_admin()", async ({ skip }) => {
    if (!migrated) skip();
    const { data, error } = await client().rpc("is_admin");
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("does not let a user promote themselves to admin", async ({ skip }) => {
    if (!migrated) skip();
    await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);

    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    expect(data?.role).toBe("user");
    expect((await supabase.rpc("is_admin")).data).toBe(false);
  });
});
