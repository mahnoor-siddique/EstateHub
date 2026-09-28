import { beforeEach, describe, expect, it, vi } from "vitest";
import { toPropertyPhoto } from "@/lib/queries/supabase/shared";
import { PROPERTY_IMAGES_BUCKET, propertyImageUrl, publicStorageUrl } from "@/lib/supabase/storage";

// Storage-backed listing photos: URL building, the photo mapper and the next/image allow-list.

const PROJECT = "https://example-ref.supabase.co";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", PROJECT);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
  return () => vi.unstubAllEnvs();
});

describe("publicStorageUrl", () => {
  it("builds the public object URL that supabase-js getPublicUrl returns", () => {
    expect(publicStorageUrl("property-images", "property-1/main.webp")).toBe(
      `${PROJECT}/storage/v1/object/public/property-images/property-1/main.webp`,
    );
  });

  it("copes with a trailing slash on the project URL and stray slashes in the path", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `${PROJECT}/`);
    expect(publicStorageUrl("property-images", "/property-1//main.webp")).toBe(
      `${PROJECT}/storage/v1/object/public/property-images/property-1/main.webp`,
    );
  });

  it("URL-encodes each path segment but keeps the folder separators", () => {
    expect(publicStorageUrl("property-images", "property 7/sea view #1.webp")).toBe(
      `${PROJECT}/storage/v1/object/public/property-images/property%207/sea%20view%20%231.webp`,
    );
  });

  it("uses the property-images bucket for listing photos", () => {
    expect(PROPERTY_IMAGES_BUCKET).toBe("property-images");
    expect(propertyImageUrl("property-3/kitchen.webp")).toBe(
      `${PROJECT}/storage/v1/object/public/property-images/property-3/kitchen.webp`,
    );
  });
});

describe("toPropertyPhoto", () => {
  const row = {
    image_url: "/images/properties/property-1/main.png",
    storage_path: "property-1/main.webp",
    alt_text: "Front of the villa at dusk",
    label: "Exterior",
    sort_order: 0,
  };

  it("prefers storage_path and builds the URL for the current project", () => {
    expect(toPropertyPhoto(row)).toEqual({
      src: `${PROJECT}/storage/v1/object/public/property-images/property-1/main.webp`,
      alt: "Front of the villa at dusk",
      label: "Exterior",
    });
  });

  it("ignores a stale image_url when storage_path is set (e.g. another project's URL)", () => {
    const photo = toPropertyPhoto({
      ...row,
      image_url: "https://old-ref.supabase.co/storage/v1/object/public/property-images/property-1/main.webp",
    });
    expect(photo.src.startsWith(PROJECT)).toBe(true);
  });

  it("falls back to image_url when there is no storage_path", () => {
    expect(toPropertyPhoto({ ...row, storage_path: null }).src).toBe("/images/properties/property-1/main.png");
    expect(toPropertyPhoto({ ...row, storage_path: "" }).src).toBe("/images/properties/property-1/main.png");
  });

  it("keeps alt text and defaults a missing label to an empty string", () => {
    expect(toPropertyPhoto({ ...row, label: null })).toMatchObject({ alt: row.alt_text, label: "" });
  });
});

describe("next.config images.remotePatterns", () => {
  it("allows only this project's public property-images bucket", async () => {
    vi.resetModules();
    const { default: config } = await import("@/next.config");
    const patterns = config.images?.remotePatterns ?? [];
    expect(patterns).toHaveLength(1);
    const pattern = patterns[0] as URL;
    expect(pattern).toBeInstanceOf(URL);
    expect(pattern.protocol).toBe("https:");
    expect(pattern.hostname).toBe("example-ref.supabase.co");
    expect(pattern.pathname).toBe("/storage/v1/object/public/property-images/**");
  });

  it("allows no remote images when the Supabase URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.resetModules();
    const { default: config } = await import("@/next.config");
    expect(config.images?.remotePatterns).toEqual([]);
  });
});
