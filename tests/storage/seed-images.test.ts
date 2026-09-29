import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/*
 * The seeded property_images rows (supabase/seed.sql) after the move to Supabase Storage: every
 * photo must have a well-formed storage_path in its property's folder, and image_url must be the
 * public URL of exactly that object. Reads the file only; no database needed.
 */

type SeedImage = {
  id: string;
  propertyId: string;
  imageUrl: string;
  storagePath: string;
  sortOrder: number;
};

const seed = readFileSync("supabase/seed.sql", "utf8");
const insert = seed.slice(seed.indexOf("insert into public.property_images"));
const ROW = /\('([0-9a-f-]{36})', '([0-9a-f-]{36})', '([^']+)', '([^']+)', '(?:[^']|'')*', '(?:[^']|'')*', (\d+)\)/g;
const images: SeedImage[] = [...insert.matchAll(ROW)].map((m) => ({
  id: m[1],
  propertyId: m[2],
  imageUrl: m[3],
  storagePath: m[4],
  sortOrder: Number(m[5]),
}));

describe("seeded property photos", () => {
  it("has all 36 photos (6 per property) with unique ids and gallery positions", () => {
    expect(images).toHaveLength(36);
    expect(new Set(images.map((i) => i.id)).size).toBe(36);
    expect(new Set(images.map((i) => `${i.propertyId}:${i.sortOrder}`)).size).toBe(36);
    const perProperty = Object.values(
      images.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.propertyId]: (acc[i.propertyId] ?? 0) + 1 }), {}),
    );
    expect(perProperty).toEqual([6, 6, 6, 6, 6, 6]);
  });

  it("uses property-N/<name>.webp storage paths, unique across the bucket", () => {
    for (const { storagePath } of images) expect(storagePath).toMatch(/^property-[1-6]\/[a-z]+(-[a-z]+)*\.webp$/);
    expect(new Set(images.map((i) => i.storagePath)).size).toBe(36);
  });

  it("keeps each property's photos in its own single folder", () => {
    const folders = new Map<string, Set<string>>();
    for (const i of images) {
      const set = folders.get(i.propertyId) ?? new Set();
      set.add(i.storagePath.split("/")[0]);
      folders.set(i.propertyId, set);
    }
    expect([...folders.values()].every((set) => set.size === 1)).toBe(true);
    expect(new Set([...folders.values()].map((set) => [...set][0])).size).toBe(6);
  });

  it("starts every gallery with main.webp at position 0", () => {
    const covers = images.filter((i) => i.sortOrder === 0);
    expect(covers).toHaveLength(6);
    expect(covers.every((i) => i.storagePath.endsWith("/main.webp"))).toBe(true);
  });

  it("sets image_url to the public Storage URL of the same object", () => {
    for (const { imageUrl, storagePath } of images) {
      expect(imageUrl).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/property-images\//);
      expect(imageUrl.endsWith(`/property-images/${storagePath}`)).toBe(true);
    }
  });

  it("no longer references the local /images/properties files", () => {
    expect(insert).not.toContain("/images/properties/");
  });
});

describe("seeded agent portraits", () => {
  const agentsInsert = seed.slice(
    seed.indexOf("insert into public.agents"),
    seed.indexOf("insert into public.properties"),
  );
  // (id, full_name, ..., profile_image, created_at)
  const portraits = new Map(
    [...agentsInsert.matchAll(/\('([0-9a-f-]{36})', '([^']+)',.*, '([^']+)', '[^']+'\)/g)].map((m) => [
      m[2],
      { id: m[1], url: m[3] },
    ]),
  );

  it("gives each agent their own portrait in the property-images bucket's agents/ folder", () => {
    expect(portraits).toEqual(
      new Map(
        [
          ["Sara Malik", "6ceb4716-6d87-591e-9ead-212a4e979b44", "sara-malik"],
          ["Hamza Qureshi", "a95715d6-6aea-5d6c-a00e-d167473cf091", "hamza-qureshi"],
          ["Ayesha Rehman", "08b56262-64ee-5f94-ad69-a602daed5be9", "ayesha-rehman"],
        ].map(([name, id, file]) => [name, { id, url: expect.stringMatching(new RegExp(`^https://[a-z0-9]+\\.supabase\\.co/storage/v1/object/public/property-images/agents/${file}\\.webp$`)) }]),
      ),
    );
  });

  it("no longer references the local /images/agents files", () => {
    expect(agentsInsert).not.toContain("/images/agents/");
  });
});
