import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

/*
 * Live, read-only checks of S3-backed listing photos: every photo the seed expects is publicly
 * served from the S3 image bucket as WebP, the bucket cannot be listed by visitors, and the live
 * property_images rows point at those objects. Uses only public URLs + the publishable key. Like
 * the other live suites it runs only when AUTH_TEST_EMAIL / AUTH_TEST_PASSWORD are set (see
 * .env.example).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const enabled = Boolean(url && publishableKey && process.env.AUTH_TEST_EMAIL && process.env.AUTH_TEST_PASSWORD);

// id -> image_url, as seeded.
const seedUrls = new Map(
  [
    ...readFileSync("supabase/seed.sql", "utf8").matchAll(
      /\('([0-9a-f-]{36})', '[0-9a-f-]{36}', '(https:\/\/[^']+\.amazonaws\.com\/properties\/[^']+\.webp)', null,/g,
    ),
  ].map((m) => [m[1], m[2]]),
);

describe.skipIf(!enabled)("S3-backed property photos (live)", () => {
  const supabase = createClient<Database>(url, publishableKey, { auth: { persistSession: false } });

  it("serves every seeded photo publicly as WebP", { timeout: 30_000 }, async () => {
    expect(seedUrls.size).toBe(36);
    const failures: string[] = [];
    await Promise.all(
      [...seedUrls.values()].map(async (src) => {
        const response = await fetch(src);
        const bytes = new Uint8Array(await response.arrayBuffer());
        const isWebp =
          String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
        if (!response.ok || response.headers.get("content-type") !== "image/webp" || !isWebp) {
          failures.push(`${src} (${response.status})`);
        }
      }),
    );
    expect(failures).toEqual([]);
  });

  it("does not let visitors list the bucket", async () => {
    const bucketUrl = new URL([...seedUrls.values()][0]).origin;
    const response = await fetch(`${bucketUrl}/?list-type=2`);
    expect(response.status).toBe(403);
  });

  it("points every live property_images row at its S3 object", async () => {
    const { data, error } = await supabase.from("property_images").select("id, image_url, storage_path");
    expect(error).toBeNull();
    expect(data).toHaveLength(36);
    for (const row of data ?? []) {
      expect(row.image_url, row.id).toBe(seedUrls.get(row.id));
      expect(row.storage_path, row.id).toBeNull();
    }
  });
});
