import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import nextConfig from "@/next.config";
import { managedAgentImagePath, managedPropertyImagePath } from "@/lib/admin/storage";
import { validateAgent } from "@/lib/validations/admin-agent";
import { validateProperty } from "@/lib/validations/admin-property";
import {
  IMAGE_MAX_BYTES,
  IMAGE_TOO_LARGE,
  imageTooLargeError,
  isEmptyFile,
  validateImageFile,
  validatePhotoText,
} from "@/lib/validations/image-upload";

/*
 * Input validation for the admin property/agent forms and photo uploads. The Server Actions run
 * these on every submit; limits mirror the database constraints.
 */

const AGENT_ID = "6ceb4716-6d87-591e-9ead-212a4e979b44";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const validProperty = {
  title: "  Corner   House near Park ",
  description: "Bright family home.",
  property_type: "House",
  listing_type: "For Sale",
  price: "45,000,000",
  city: "Lahore",
  area_location: "DHA Phase 6",
  address: "",
  bedrooms: "4",
  bathrooms: "5",
  area: "10",
  area_unit: "Marla",
  year_built: "2019",
  parking_spaces: "2",
  status: "available",
  agent_id: AGENT_ID,
  has_parking: "on",
  has_gym: "on",
};

describe("validateProperty", () => {
  it("accepts a complete listing and returns database-ready values", () => {
    const result = validateProperty(form(validProperty));
    expect(result).toEqual({
      ok: true,
      data: {
        title: "Corner House near Park",
        description: "Bright family home.",
        property_type: "House",
        listing_type: "For Sale",
        price: 45_000_000,
        city: "Lahore",
        area_location: "DHA Phase 6",
        address: null,
        bedrooms: 4,
        bathrooms: 5,
        area: 10,
        area_unit: "Marla",
        year_built: 2019,
        parking_spaces: 2,
        status: "available",
        agent_id: AGENT_ID,
        has_parking: true,
        has_garden: false,
        has_swimming_pool: false,
        has_security: false,
        has_gym: true,
        is_furnished: false,
        has_air_conditioning: false,
        has_backup_power: false,
      },
    });
  });

  it("allows an empty year and decimal sizes", () => {
    const result = validateProperty(form({ ...validProperty, year_built: "", area: "1.25", area_unit: "Kanal" }));
    expect(result.ok && result.data).toMatchObject({ year_built: null, area: 1.25, area_unit: "Kanal" });
  });

  it.each([
    ["title", "", "title"],
    ["title", "x".repeat(161), "title"],
    ["description", "x".repeat(5001), "description"],
    ["property_type", "Castle", "property_type"],
    ["listing_type", "For Lease", "listing_type"],
    ["price", "", "price"],
    ["price", "-5", "price"],
    ["price", "12.50", "price"],
    ["price", "1e9", "price"],
    ["price", "99999999999999", "price"],
    ["city", "Atlantis", "city"],
    ["area_location", "", "area_location"],
    ["address", "x".repeat(256), "address"],
    ["bedrooms", "-1", "bedrooms"],
    ["bathrooms", "2.5", "bathrooms"],
    ["area", "0", "area"],
    ["area", "10.123", "area"],
    ["area", "abc", "area"],
    ["area_unit", "Acre", "area_unit"],
    ["year_built", "1700", "year_built"],
    ["year_built", "3000", "year_built"],
    ["parking_spaces", "51", "parking_spaces"],
    ["status", "archived", "status"],
    ["agent_id", "", "agent_id"],
    ["agent_id", "demo-agent-sara", "agent_id"],
    ["agent_id", "1; drop table agents", "agent_id"],
  ])("rejects %s = %j", (field, value, errorField) => {
    const result = validateProperty(form({ ...validProperty, [field]: value }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors).toHaveProperty(errorField);
  });

  it("ignores unknown fields (e.g. a forged id or created_at)", () => {
    const result = validateProperty(form({ ...validProperty, id: "x", created_at: "2000-01-01", updated_at: "x" }));
    expect(result.ok && Object.keys(result.data)).not.toEqual(expect.arrayContaining(["id", "created_at", "updated_at"]));
  });
});

describe("validateAgent", () => {
  const valid = {
    full_name: " Sana   Malik ",
    title: "Consultant",
    email: "sana@example.com",
    phone: "+92 300 1234567",
    bio: "Helps families.",
    agency_name: "Northgate",
  };

  it("accepts a complete agent", () => {
    expect(validateAgent(form(valid))).toEqual({
      ok: true,
      data: {
        full_name: "Sana Malik",
        title: "Consultant",
        email: "sana@example.com",
        phone: "+92 300 1234567",
        bio: "Helps families.",
        agency_name: "Northgate",
      },
    });
  });

  it("stores empty optional fields as null", () => {
    const result = validateAgent(form({ full_name: "Sana Malik" }));
    expect(result.ok && result.data).toEqual({
      full_name: "Sana Malik",
      title: null,
      email: null,
      phone: null,
      bio: null,
      agency_name: null,
    });
  });

  it.each([
    ["full_name", ""],
    ["full_name", "S"],
    ["full_name", "x".repeat(121)],
    ["title", "x".repeat(121)],
    ["email", "not-an-email"],
    ["phone", "call me"],
    ["phone", "123"],
    ["bio", "x".repeat(2001)],
    ["agency_name", "x".repeat(121)],
  ])("rejects %s = %j", (field, value) => {
    const result = validateAgent(form({ ...valid, [field]: value }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors).toHaveProperty(field);
  });
});

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d];
const WEBP = [...Buffer.from("RIFF"), 0x24, 0, 0, 0, ...Buffer.from("WEBP")];
const GIF = [...Buffer.from("GIF89a"), 1, 0, 1, 0, 0, 0];

const file = (bytes: number[], type: string, name = "photo", size?: number) => {
  const body = new Uint8Array(size ?? bytes.length);
  body.set(bytes);
  return new File([body], name, { type });
};

describe("validateImageFile", () => {
  it.each([
    [JPEG, "image/jpeg", "jpg"],
    [PNG, "image/png", "png"],
    [WEBP, "image/webp", "webp"],
  ])("accepts a real %s image", async (bytes, type, ext) => {
    const result = await validateImageFile(file(bytes as number[], type as string));
    expect(result.ok && { type: result.image.contentType, ext: result.image.ext }).toEqual({ type, ext });
  });

  it("uses the file's bytes, not the name or declared type", async () => {
    // A script renamed to .jpg and labelled image/jpeg.
    expect((await validateImageFile(file([...Buffer.from("<script>alert(1)")], "image/jpeg", "x.jpg"))).ok).toBe(false);
    // A real PNG that claims to be a JPEG.
    expect((await validateImageFile(file(PNG, "image/jpeg"))).ok).toBe(false);
  });

  it("rejects other image types, empty uploads and non-files", async () => {
    expect((await validateImageFile(file(GIF, "image/gif"))).ok).toBe(false);
    expect((await validateImageFile(file([], "image/png"))).ok).toBe(false);
    expect((await validateImageFile("not a file")).ok).toBe(false);
    expect((await validateImageFile(null)).ok).toBe(false);
  });

  it("rejects files over 5 MB and accepts exactly 5 MB", async () => {
    expect((await validateImageFile(file(PNG, "image/png", "big.png", IMAGE_MAX_BYTES + 1))).ok).toBe(false);
    expect((await validateImageFile(file(PNG, "image/png", "ok.png", IMAGE_MAX_BYTES))).ok).toBe(true);
  });

  it("tells an untouched file input apart from a chosen file", () => {
    expect(isEmptyFile(new File([], "", { type: "application/octet-stream" }))).toBe(true);
    expect(isEmptyFile(null)).toBe(true);
    expect(isEmptyFile(file(PNG, "image/png", "a.png"))).toBe(false);
  });
});

describe("photo size limit", () => {
  const MB = 1024 * 1024;

  it("is 5 MB, the same as the property-images bucket's own limit", () => {
    expect(IMAGE_MAX_BYTES).toBe(5 * MB);
    const bucket = readFileSync("supabase/migrations/20261001000000_property_images_bucket.sql", "utf8");
    expect(bucket).toContain(`${IMAGE_MAX_BYTES}, -- 5 MB in bytes`); // file_size_limit
  });

  it.each([5 * MB + 1, 6 * MB, 9.9 * MB])("rejects a %i-byte photo with a clear size error", async (size) => {
    expect(await validateImageFile(file(PNG, "image/png", "big.png", Math.floor(size)))).toEqual({
      ok: false,
      error: IMAGE_TOO_LARGE,
    });
  });

  it("the browser pre-check flags exactly what the server rejects for size", () => {
    expect(imageTooLargeError(file(PNG, "image/png", "big.png", 5 * MB + 1))).toBe(IMAGE_TOO_LARGE);
    expect(imageTooLargeError(file(PNG, "image/png", "big.png", 12 * MB))).toBe(IMAGE_TOO_LARGE);
    expect(imageTooLargeError(file(PNG, "image/png", "ok.png", 5 * MB))).toBeNull();
    expect(imageTooLargeError(new File([], ""))).toBeNull(); // nothing chosen
    expect(imageTooLargeError(null)).toBeNull();
  });

  it("lets an oversized photo reach the Server Action instead of failing the request", () => {
    // Server Action requests may be 10 MB, leaving room for a photo well over 5 MB (plus the rest
    // of the form) to arrive and get the size error above rather than Next.js's body-limit error.
    const limit = nextConfig.experimental?.serverActions?.bodySizeLimit;
    expect(limit).toBe("10mb");
    expect(10 * MB).toBeGreaterThanOrEqual(2 * IMAGE_MAX_BYTES);
  });
});

describe("validatePhotoText", () => {
  it("requires alt text and limits both fields", () => {
    expect(validatePhotoText(form({ alt_text: "  Kitchen  island ", label: "" }))).toEqual({
      ok: true,
      data: { alt_text: "Kitchen island", label: null },
    });
    expect(validatePhotoText(form({ alt_text: "" })).ok).toBe(false);
    expect(validatePhotoText(form({ alt_text: "x".repeat(301) })).ok).toBe(false);
    expect(validatePhotoText(form({ alt_text: "ok", label: "x".repeat(61) })).ok).toBe(false);
  });
});

describe("managed S3 image paths", () => {
  const PROJECT = "https://example-ref.supabase.co";
  const BUCKET = "estatehub-test-images";
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", PROJECT);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    vi.stubEnv("AWS_S3_BUCKET", BUCKET);
    return () => vi.unstubAllEnvs();
  });
  const base = `https://${BUCKET}.s3.eu-north-1.amazonaws.com`;
  const supabase = `${PROJECT}/storage/v1/object/public/property-images`;
  const uploaded = "0b9a1c52-1a2b-4c3d-8e9f-0a1b2c3d4e5f.webp";
  const PROPERTY_ID = "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264";

  it("recognises only portraits /admin uploaded to S3 for this agent", () => {
    expect(managedAgentImagePath(AGENT_ID, `${base}/agents/${AGENT_ID}/${uploaded}`)).toBe(`agents/${AGENT_ID}/${uploaded}`);
    // Other S3 file, another agent's folder, another site or bucket, path tricks, nothing:
    expect(managedAgentImagePath(AGENT_ID, `${base}/agents/sara-malik.webp`)).toBeNull();
    expect(managedAgentImagePath(AGENT_ID, `${base}/agents/08b56262-64ee-5f94-ad69-a602daed5be9/${uploaded}`)).toBeNull();
    expect(managedAgentImagePath(AGENT_ID, `https://evil.example/agents/${AGENT_ID}/${uploaded}`)).toBeNull();
    expect(managedAgentImagePath(AGENT_ID, `https://other-bucket.s3.eu-north-1.amazonaws.com/agents/${AGENT_ID}/${uploaded}`)).toBeNull();
    expect(managedAgentImagePath(AGENT_ID, `${base}/agents/${AGENT_ID}/../property-1/main.webp`)).toBeNull();
    expect(managedAgentImagePath(AGENT_ID, `${base}/agents/${AGENT_ID}/%2E%2E/${uploaded}`)).toBeNull();
    expect(managedAgentImagePath(AGENT_ID, null)).toBeNull();
  });

  it("never treats a Supabase Storage portrait as deletable, seeded or uploaded", () => {
    expect(managedAgentImagePath(AGENT_ID, `${supabase}/agents/sara-malik.webp`)).toBeNull();
    expect(managedAgentImagePath(AGENT_ID, `${supabase}/agents/${AGENT_ID}/${uploaded}`)).toBeNull();
  });

  it("recognises only listing photos /admin uploaded to S3 for this property", () => {
    expect(managedPropertyImagePath(PROPERTY_ID, `${base}/properties/${PROPERTY_ID}/${uploaded}`)).toBe(
      `properties/${PROPERTY_ID}/${uploaded}`,
    );
    expect(managedPropertyImagePath(PROPERTY_ID, `${base}/properties/11111111-2222-4333-8444-555555555555/${uploaded}`)).toBeNull();
    expect(managedPropertyImagePath(PROPERTY_ID, `${base}/properties/${PROPERTY_ID}/main.webp`)).toBeNull();
    expect(managedPropertyImagePath(PROPERTY_ID, `${base}/agents/${PROPERTY_ID}/${uploaded}`)).toBeNull();
    expect(managedPropertyImagePath(PROPERTY_ID, `${supabase}/property-1/main.webp`)).toBeNull();
    expect(managedPropertyImagePath(PROPERTY_ID, `${supabase}/properties/${PROPERTY_ID}/${uploaded}`)).toBeNull();
    expect(managedPropertyImagePath(PROPERTY_ID, "/images/properties/property-1/main.png")).toBeNull();
  });

  it("recognises nothing when the bucket is not configured", () => {
    vi.stubEnv("AWS_S3_BUCKET", "");
    expect(managedAgentImagePath(AGENT_ID, `${base}/agents/${AGENT_ID}/${uploaded}`)).toBeNull();
  });
});
