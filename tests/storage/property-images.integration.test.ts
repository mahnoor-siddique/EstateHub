import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { toPropertyPhoto } from "@/lib/queries/supabase/shared";
import type { Database } from "@/types/database";

/*
 * Live, read-only checks of Storage-backed listing photos: every photo the seed expects is
 * publicly served from the property-images bucket as WebP, and the live property_images rows point
 * at those objects. Uses only the public URL + publishable key. Like the other live suites it runs
 * only when AUTH_TEST_EMAIL / AUTH_TEST_PASSWORD are set (see .env.example).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const enabled = Boolean(url && publishableKey && process.env.AUTH_TEST_EMAIL && process.env.AUTH_TEST_PASSWORD);

// id -> storage_path, as seeded.
const seedPaths = new Map(
  [
    ...readFileSync("supabase/seed.sql", "utf8").matchAll(
      /\('([0-9a-f-]{36})', '[0-9a-f-]{36}', 'https:[^']+', '(property-\d\/[a-z-]+\.webp)'/g,
    ),
  ].map((m) => [m[1], m[2]]),
);

describe.skipIf(!enabled)("Storage-backed property photos (live)", () => {
  const supabase = createClient<Database>(url, publishableKey, { auth: { persistSession: false } });

  it("serves every seeded photo publicly as WebP", async () => {
    expect(seedPaths.size).toBe(36);
    const failures: string[] = [];
    await Promise.all(
      [...seedPaths.values()].map(async (path) => {
        const src = toPropertyPhoto({ image_url: "", storage_path: path, alt_text: "", label: null, sort_order: 0 }).src;
        const response = await fetch(src);
        const bytes = new Uint8Array(await response.arrayBuffer());
        const isWebp =
          String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
        if (!response.ok || response.headers.get("content-type") !== "image/webp" || !isWebp) {
          failures.push(`${path} (${response.status})`);
        }
      }),
    );
    expect(failures).toEqual([]);
  });

  it("does not let visitors list or change the bucket", async () => {
    const list = await supabase.storage.from("property-images").list("property-1");
    expect(list.data ?? []).toEqual([]);
    // A throwaway path, never a real photo, so even a misconfigured bucket would lose nothing.
    const upload = await supabase.storage
      .from("property-images")
      .upload(`zz-test/rejected-${Date.now()}.webp`, new Blob(["x"], { type: "image/webp" }));
    expect(upload.error).not.toBeNull();
  });

  it("points every live property_images row at its Storage object", async () => {
    const { data, error } = await supabase.from("property_images").select("id, image_url, storage_path");
    expect(error).toBeNull();
    expect(data).toHaveLength(36);
    for (const row of data ?? []) {
      expect(row.storage_path, row.id).toBe(seedPaths.get(row.id));
      expect(row.image_url, row.id).toBe(`${url}/storage/v1/object/public/property-images/${row.storage_path}`);
    }
  });
});
