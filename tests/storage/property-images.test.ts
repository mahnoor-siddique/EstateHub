import { beforeEach, describe, expect, it, vi } from "vitest";
import { toPropertyPhoto } from "@/lib/queries/supabase/shared";

// S3-backed listing photos: the photo mapper and the next/image allow-list.

const S3 = "https://estatehub-test-images.s3.eu-north-1.amazonaws.com";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example-ref.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
  vi.stubEnv("AWS_S3_BUCKET", "estatehub-test-images");
  return () => vi.unstubAllEnvs();
});

describe("toPropertyPhoto", () => {
  const row = {
    image_url: `${S3}/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/main.webp`,
    alt_text: "Front of the villa at dusk",
    label: "Exterior",
    sort_order: 0,
  };

  it("uses the row's image_url as the photo's source", () => {
    expect(toPropertyPhoto(row)).toEqual({
      src: `${S3}/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/main.webp`,
      alt: "Front of the villa at dusk",
      label: "Exterior",
    });
  });

  it("keeps alt text and defaults a missing label to an empty string", () => {
    expect(toPropertyPhoto({ ...row, label: null })).toMatchObject({ alt: row.alt_text, label: "" });
  });
});

describe("next.config images.remotePatterns", () => {
  it("allows only the S3 image bucket", async () => {
    vi.resetModules();
    const { default: config } = await import("@/next.config");
    const patterns = config.images?.remotePatterns ?? [];
    expect(patterns).toHaveLength(1);
    const pattern = patterns[0] as URL;
    expect(pattern).toBeInstanceOf(URL);
    expect(pattern.protocol).toBe("https:");
    expect(pattern.hostname).toBe("estatehub-test-images.s3.eu-north-1.amazonaws.com");
    expect(pattern.pathname).toBe("/**");
  });

  it("allows no remote images when the bucket is not configured", async () => {
    vi.stubEnv("AWS_S3_BUCKET", "");
    vi.resetModules();
    const { default: config } = await import("@/next.config");
    expect(config.images?.remotePatterns).toEqual([]);
  });
});
