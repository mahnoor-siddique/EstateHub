import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  getAccessFallbackHTTPStatus,
  isHTTPAccessFallbackError,
} from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The admin Server Actions (properties, property photos, agents) with the Supabase server client
 * replaced by a fake that records every query, Storage call and RPC. Each test controls who is
 * signed in (getClaims) and their profile role, and what the database answers. This checks the
 * actions' own authorization and validation, and exactly what they would send; the database's
 * RLS/Storage policies are checked separately against Postgres.
 */

// ---------------------------------------------------------------------------
// Fake Supabase server client
// ---------------------------------------------------------------------------

type Op = "select" | "insert" | "update" | "delete";
type Query = {
  table: string;
  op: Op;
  columns?: string;
  payload?: unknown;
  filters: [string, string, unknown][];
};
type Result = { data: unknown; error: { code: string; message: string } | null };
type Handler = (query: Query) => Result;

let claims: Record<string, unknown> | null;
let profileRole: string | null;
let handlers: Record<string, Handler>;
let rpcResults: Record<string, Result>;
let uploadError: { name: string; message: string } | null;

const queries: Query[] = [];
const uploads: { bucket: string; path: string; file: File; options: Record<string, unknown> }[] = [];
const removals: { bucket: string; paths: string[] }[] = [];
const rpcs: { name: string; args: Record<string, unknown> }[] = [];

const ok = (data: unknown): Result => ({ data, error: null });
const fail = (code: string): Result => ({ data: null, error: { code, message: `error ${code}` } });

function respond(query: Query): Result {
  if (query.table === "profiles") {
    return ok(profileRole ? { role: profileRole, full_name: "Sana Malik" } : null);
  }
  const handler = handlers[`${query.table}.${query.op}`];
  if (handler) return handler(query);
  return query.op === "select" ? ok([]) : ok([]);
}

function builder(table: string) {
  const query: Query = { table, op: "select", filters: [] };
  const b: Record<string, unknown> = {
    select(columns: string) {
      if (query.op === "select") query.columns = columns;
      return b;
    },
    insert(payload: unknown) {
      Object.assign(query, { op: "insert", payload });
      return b;
    },
    update(payload: unknown) {
      Object.assign(query, { op: "update", payload });
      return b;
    },
    delete() {
      query.op = "delete";
      return b;
    },
    eq(column: string, value: unknown) {
      query.filters.push(["eq", column, value]);
      return b;
    },
    in(column: string, value: unknown) {
      query.filters.push(["in", column, value]);
      return b;
    },
    order: () => b,
    limit: () => b,
    maybeSingle: () => b,
    single: () => b,
    then(resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) {
      queries.push(query);
      return Promise.resolve(respond(query)).then(resolve, reject);
    },
  };
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: claims && { claims }, error: null }) },
    from: builder,
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcs.push({ name, args });
      return rpcResults[name] ?? ok(null);
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File, options: Record<string, unknown>) => {
          uploads.push({ bucket, path, file, options });
          return { data: uploadError ? null : { path }, error: uploadError };
        },
        remove: async (paths: string[]) => {
          removals.push({ bucket, paths });
          return { data: [], error: null };
        },
      }),
    },
  }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const { createProperty, deleteProperty, updateProperty, updatePropertyStatus } = await import(
  "@/lib/admin/properties/actions"
);
const { deletePropertyImage, movePropertyImage, updatePropertyImage, uploadPropertyImage } = await import(
  "@/lib/admin/images/actions"
);
const { createAgent, deleteAgent, updateAgent } = await import("@/lib/admin/agents/actions");

// ---------------------------------------------------------------------------
// Fixtures and helpers
// ---------------------------------------------------------------------------

const PROJECT = "https://example-ref.supabase.co";
const PUBLIC = `${PROJECT}/storage/v1/object/public/property-images`;
const USER_ID = "7d1c2f0e-0000-4000-8000-000000000001";
const PROPERTY_ID = "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264";
const NEW_PROPERTY_ID = "11111111-2222-4333-8444-555555555555";
const AGENT_ID = "6ceb4716-6d87-591e-9ead-212a4e979b44";
const OTHER_AGENT_ID = "a95715d6-6aea-5d6c-a00e-d167473cf091";
const IMAGE_ID = "d849e223-cf59-5453-bc1d-8efc38b32ade";
const IMAGE_ID_2 = "a65cd623-58f1-5165-ac3c-33095318820e";
const IMAGE_ID_3 = "7d9a7a8f-6205-58ea-9fbc-0cebcbab615a";
const UPLOADED = /^[0-9a-f-]{36}\.png$/;

const idle = { status: "idle" } as const;

function form(fields: Record<string, string | File>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d];
function png(size = PNG_BYTES.length, name = "photo.png") {
  const body = new Uint8Array(size);
  body.set(PNG_BYTES);
  return new File([body], name, { type: "image/png" });
}

const propertyFields = {
  title: "Corner House near Park",
  description: "Bright family home.",
  property_type: "House",
  listing_type: "For Sale",
  price: "45000000",
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
};

const agentFields = {
  full_name: "Bilal Ahmed",
  title: "Sales Consultant",
  email: "bilal@example.com",
  phone: "+92 300 1234567",
  bio: "Helps families find homes.",
  agency_name: "Northgate Realty",
};

function signInAs(role: "user" | "agent" | "admin", extra: Record<string, unknown> = {}) {
  claims = { sub: USER_ID, email: "someone@example.com", user_metadata: { full_name: "Sana" }, ...extra };
  profileRole = role;
}

type Outcome = { redirect: string } | { status: number } | { returned: unknown };

async function outcome(fn: () => Promise<unknown>): Promise<Outcome> {
  try {
    return { returned: await fn() };
  } catch (error) {
    if (isRedirectError(error)) return { redirect: getURLFromRedirectError(error) };
    if (isHTTPAccessFallbackError(error)) return { status: getAccessFallbackHTTPStatus(error) };
    throw error;
  }
}

/** Every database write attempted (profile role lookups excluded). */
const writes = () => queries.filter((q) => q.op !== "select");
/** Every query other than requireAdmin's own profile lookup. */
const dataQueries = () => queries.filter((q) => q.table !== "profiles");

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", PROJECT);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
  claims = null;
  profileRole = null;
  handlers = {};
  rpcResults = {};
  uploadError = null;
  queries.length = 0;
  uploads.length = 0;
  removals.length = 0;
  rpcs.length = 0;
  revalidatePath.mockClear();
  return () => vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Authorization: every action, every non-admin
// ---------------------------------------------------------------------------

const ACTIONS: [string, () => Promise<unknown>][] = [
  ["createProperty", () => createProperty(idle, form(propertyFields))],
  ["updateProperty", () => updateProperty(PROPERTY_ID, idle, form(propertyFields))],
  ["updatePropertyStatus", () => updatePropertyStatus(idle, form({ propertyId: PROPERTY_ID, status: "sold" }))],
  ["deleteProperty", () => deleteProperty(idle, form({ propertyId: PROPERTY_ID, confirmedBookings: "0" }))],
  [
    "uploadPropertyImage",
    () => uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: "Front", label: "" })),
  ],
  ["updatePropertyImage", () => updatePropertyImage(idle, form({ imageId: IMAGE_ID, alt_text: "Front" }))],
  ["movePropertyImage", () => movePropertyImage(idle, form({ imageId: IMAGE_ID, direction: "down" }))],
  ["deletePropertyImage", () => deletePropertyImage(idle, form({ imageId: IMAGE_ID }))],
  ["createAgent", () => createAgent(idle, form({ ...agentFields, photo: png() }))],
  ["updateAgent", () => updateAgent(AGENT_ID, idle, form(agentFields))],
  ["deleteAgent", () => deleteAgent(idle, form({ agentId: AGENT_ID }))],
];

function expectNothingTouched() {
  expect(dataQueries()).toEqual([]);
  expect(uploads).toEqual([]);
  expect(removals).toEqual([]);
  expect(rpcs).toEqual([]);
  expect(revalidatePath).not.toHaveBeenCalled();
}

describe("admin authorization", () => {
  it.each(ACTIONS)("%s: a guest is sent to login and nothing is touched", async (_name, run) => {
    const result = await outcome(run);
    expect(result).toHaveProperty("redirect");
    expect((result as { redirect: string }).redirect).toMatch(/^\/login\?next=%2Fadmin/);
    expectNothingTouched();
  });

  it.each(ACTIONS)("%s: a normal user gets a 404 and nothing is touched", async (_name, run) => {
    signInAs("user");
    expect(await outcome(run)).toEqual({ status: 404 });
    expectNothingTouched();
  });

  it.each(ACTIONS)("%s: an agent gets a 404 and nothing is touched", async (_name, run) => {
    signInAs("agent");
    expect(await outcome(run)).toEqual({ status: 404 });
    expectNothingTouched();
  });

  it.each(ACTIONS)("%s: forged admin claims in the token/form do not help", async (_name, run) => {
    signInAs("user", {
      role: "admin",
      user_metadata: { role: "admin", is_admin: true },
      app_metadata: { role: "admin" },
    });
    expect(await outcome(run)).toEqual({ status: 404 });
    expectNothingTouched();
  });

  it("fails closed when the role cannot be read", async () => {
    signInAs("admin");
    profileRole = null; // profile missing / unreadable
    expect(await outcome(ACTIONS[0][1])).toEqual({ status: 404 });
    expectNothingTouched();
  });

  it("an admin is allowed through (and the role came from the profile row)", async () => {
    signInAs("admin");
    handlers["agents.select"] = () => ok({ id: AGENT_ID });
    handlers["properties.insert"] = () => ok({ id: NEW_PROPERTY_ID });
    expect(await outcome(() => createProperty(idle, form(propertyFields)))).toEqual({
      redirect: `/admin/properties/${NEW_PROPERTY_ID}?saved=created`,
    });
    expect(queries[0]).toMatchObject({ table: "profiles", filters: [["eq", "id", USER_ID]] });
  });
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe("property actions (admin)", () => {
  beforeEach(() => {
    signInAs("admin");
    handlers["agents.select"] = () => ok({ id: AGENT_ID });
  });

  it("creates a property with validated values and opens it for photos", async () => {
    handlers["properties.insert"] = () => ok({ id: NEW_PROPERTY_ID });
    const result = await outcome(() => createProperty(idle, form({ ...propertyFields, id: "forged", created_at: "2000-01-01" })));

    expect(result).toEqual({ redirect: `/admin/properties/${NEW_PROPERTY_ID}?saved=created` });
    const [insert] = writes();
    expect(insert).toMatchObject({ table: "properties", op: "insert" });
    expect(insert.payload).toMatchObject({
      title: "Corner House near Park",
      price: 45_000_000,
      agent_id: AGENT_ID,
      address: null,
      has_parking: true,
      has_gym: false,
    });
    expect(insert.payload).not.toHaveProperty("id");
    expect(insert.payload).not.toHaveProperty("created_at");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects invalid property data without writing", async () => {
    const result = await createProperty(idle, form({ ...propertyFields, title: "", price: "cheap", city: "Atlantis" }));
    expect(result).toMatchObject({ status: "error", values: { price: "cheap" } });
    expect(result.status === "error" && Object.keys(result.fieldErrors ?? {})).toEqual(
      expect.arrayContaining(["title", "price", "city"]),
    );
    expect(writes()).toEqual([]);
  });

  it("rejects an agent id that does not exist, on create and edit", async () => {
    handlers["agents.select"] = () => ok(null);
    for (const run of [
      () => createProperty(idle, form({ ...propertyFields, agent_id: OTHER_AGENT_ID })),
      () => updateProperty(PROPERTY_ID, idle, form({ ...propertyFields, agent_id: OTHER_AGENT_ID })),
    ]) {
      const result = await run();
      expect(result).toMatchObject({ status: "error", fieldErrors: { agent_id: expect.any(String) } });
    }
    expect(queries.filter((q) => q.table === "agents")[0].filters).toEqual([["eq", "id", OTHER_AGENT_ID]]);
    expect(writes()).toEqual([]);
  });

  it("rejects a malformed agent id before querying", async () => {
    const result = await createProperty(idle, form({ ...propertyFields, agent_id: "demo-agent-sara" }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { agent_id: expect.any(String) } });
    expect(dataQueries()).toEqual([]);
  });

  it("reports a database rejection without leaking details", async () => {
    handlers["properties.insert"] = () => fail("42501");
    const result = await createProperty(idle, form(propertyFields));
    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/permission/i) });
    expect(JSON.stringify(result)).not.toContain("error 42501");
  });

  it("edits a property (only that row; updated_at left to the trigger)", async () => {
    handlers["properties.update"] = () => ok([{ id: PROPERTY_ID }]);
    const result = await updateProperty(PROPERTY_ID, idle, form({ ...propertyFields, price: "50000000", agent_id: OTHER_AGENT_ID }));

    expect(result).toEqual({ status: "success", message: "Changes saved." });
    const [update] = writes();
    expect(update).toMatchObject({ table: "properties", op: "update", filters: [["eq", "id", PROPERTY_ID]] });
    expect(update.payload).toMatchObject({ price: 50_000_000, agent_id: OTHER_AGENT_ID });
    expect(update.payload).not.toHaveProperty("updated_at");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("reports an edit that matched no row (deleted meanwhile, or blocked by RLS)", async () => {
    handlers["properties.update"] = () => ok([]);
    expect(await updateProperty(PROPERTY_ID, idle, form(propertyFields))).toMatchObject({ status: "error" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a malformed property id on edit", async () => {
    expect(await updateProperty("not-a-uuid", idle, form(propertyFields))).toMatchObject({ status: "error" });
    expect(dataQueries()).toEqual([]);
  });

  it.each(["available", "pending", "sold", "rented"])("changes the status to %s", async (status) => {
    handlers["properties.update"] = () => ok([{ id: PROPERTY_ID }]);
    const result = await updatePropertyStatus(idle, form({ propertyId: PROPERTY_ID, status }));
    expect(result).toEqual({ status: "success", message: "Status updated." });
    expect(writes()).toEqual([
      expect.objectContaining({ table: "properties", op: "update", payload: { status }, filters: [["eq", "id", PROPERTY_ID]] }),
    ]);
  });

  it("rejects an unknown status or property id", async () => {
    expect(await updatePropertyStatus(idle, form({ propertyId: PROPERTY_ID, status: "archived" }))).toMatchObject({ status: "error" });
    expect(await updatePropertyStatus(idle, form({ propertyId: "x", status: "sold" }))).toMatchObject({ status: "error" });
    expect(writes()).toEqual([]);
  });

  describe("delete", () => {
    const dependents = (bookings: number) =>
      ok([{ images: 2, bookings, active_bookings: bookings, contact_requests: 1 }]);

    beforeEach(() => {
      handlers["property_images.select"] = (q) =>
        q.filters.some(([op]) => op === "in")
          ? ok([]) // after the delete, no other row still uses these files
          : ok([{ storage_path: "properties/p/a.webp" }, { storage_path: "properties/p/b.webp" }, { storage_path: null }]);
      handlers["properties.delete"] = () => ok([{ id: PROPERTY_ID }]);
    });

    it("deletes a property with no bookings, then its photo files", async () => {
      rpcResults.admin_property_dependents = dependents(0);
      const result = await outcome(() => deleteProperty(idle, form({ propertyId: PROPERTY_ID, confirmedBookings: "0" })));

      expect(result).toEqual({ redirect: "/admin/properties?saved=deleted" });
      expect(rpcs).toEqual([{ name: "admin_property_dependents", args: { p_property_id: PROPERTY_ID } }]);
      expect(writes()).toEqual([expect.objectContaining({ table: "properties", op: "delete", filters: [["eq", "id", PROPERTY_ID]] })]);
      expect(removals).toEqual([{ bucket: "property-images", paths: ["properties/p/a.webp", "properties/p/b.webp"] }]);
    });

    it("never deletes a file another photo row still uses", async () => {
      rpcResults.admin_property_dependents = dependents(0);
      handlers["property_images.select"] = (q) =>
        q.filters.some(([op]) => op === "in")
          ? ok([{ storage_path: "properties/p/a.webp" }])
          : ok([{ storage_path: "properties/p/a.webp" }, { storage_path: "properties/p/b.webp" }]);
      await outcome(() => deleteProperty(idle, form({ propertyId: PROPERTY_ID, confirmedBookings: "0" })));
      expect(removals).toEqual([{ bucket: "property-images", paths: ["properties/p/b.webp"] }]);
    });

    it("requires the admin to acknowledge the exact number of viewing requests", async () => {
      rpcResults.admin_property_dependents = dependents(2);

      // Dialog was opened when there was only 1 booking: refuse, a new one arrived since.
      expect(await deleteProperty(idle, form({ propertyId: PROPERTY_ID, confirmedBookings: "1", acknowledge: "on" }))).toMatchObject({
        status: "error",
        message: expect.stringContaining("2 viewing request"),
      });
      // Right count but the checkbox was not ticked (e.g. a hand-made request).
      expect(await deleteProperty(idle, form({ propertyId: PROPERTY_ID, confirmedBookings: "2" }))).toMatchObject({ status: "error" });
      expect(writes()).toEqual([]);
      expect(removals).toEqual([]);

      expect(
        await outcome(() => deleteProperty(idle, form({ propertyId: PROPERTY_ID, confirmedBookings: "2", acknowledge: "on" }))),
      ).toEqual({ redirect: "/admin/properties?saved=deleted" });
      expect(writes()).toHaveLength(1);
    });

    it("keeps the files when the delete matched no row", async () => {
      rpcResults.admin_property_dependents = dependents(0);
      handlers["properties.delete"] = () => ok([]);
      expect(await deleteProperty(idle, form({ propertyId: PROPERTY_ID, confirmedBookings: "0" }))).toMatchObject({ status: "error" });
      expect(removals).toEqual([]);
    });

    it("rejects a malformed property id without touching anything", async () => {
      expect(await deleteProperty(idle, form({ propertyId: "../etc" }))).toMatchObject({ status: "error" });
      expect(rpcs).toEqual([]);
      expect(dataQueries()).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// Property photos
// ---------------------------------------------------------------------------

describe("property photo actions (admin)", () => {
  beforeEach(() => {
    signInAs("admin");
    handlers["properties.select"] = () => ok({ id: PROPERTY_ID });
    handlers["property_images.select"] = () => ok([{ sort_order: 2 }]); // current last position
    handlers["property_images.insert"] = () => ok(null);
  });

  it("uploads a valid photo to the property's folder and appends it to the gallery", async () => {
    const result = await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: " Front  of house ", label: "Exterior" }));

    expect(result).toEqual({ status: "success", message: "Photo uploaded." });
    expect(uploads).toHaveLength(1);
    const [upload] = uploads;
    expect(upload.bucket).toBe("property-images");
    const [folder, id, file] = upload.path.split("/");
    expect([folder, id]).toEqual(["properties", PROPERTY_ID]);
    expect(file).toMatch(UPLOADED);
    expect(upload.options).toMatchObject({ contentType: "image/png", upsert: false });

    expect(writes()).toEqual([
      expect.objectContaining({
        table: "property_images",
        op: "insert",
        payload: {
          property_id: PROPERTY_ID,
          storage_path: upload.path,
          image_url: `${PUBLIC}/${upload.path}`,
          alt_text: "Front of house",
          label: "Exterior",
          sort_order: 3,
        },
      }),
    ]);
  });

  it("starts at position 0 for a property's first photo", async () => {
    handlers["property_images.select"] = () => ok([]);
    await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: "Front" }));
    expect((writes()[0].payload as { sort_order: number }).sort_order).toBe(0);
  });

  it.each([
    ["a text file posing as a PNG", new File([new TextEncoder().encode("<?php echo 1; ?>")], "x.png", { type: "image/png" })],
    ["a GIF", new File([new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0, 0])], "x.gif", { type: "image/gif" })],
    ["a PDF", new File([new TextEncoder().encode("%PDF-1.7 ......")], "x.pdf", { type: "application/pdf" })],
    ["no file", new File([], "", { type: "application/octet-stream" })],
  ])("rejects %s before uploading anything", async (_label, file) => {
    const result = await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: file, alt_text: "Front" }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { photo: expect.any(String) } });
    expect(uploads).toEqual([]);
    expect(writes()).toEqual([]);
  });

  it("rejects a photo over 5 MB before uploading anything", async () => {
    const result = await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(5 * 1024 * 1024 + 1), alt_text: "Front" }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { photo: expect.stringContaining("5 MB") } });
    expect(uploads).toEqual([]);
  });

  it("requires alt text", async () => {
    const result = await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: "" }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { alt_text: expect.any(String) } });
    expect(uploads).toEqual([]);
  });

  it("refuses to upload for a property that does not exist", async () => {
    handlers["properties.select"] = () => ok(null);
    expect(await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: "Front" }))).toMatchObject({ status: "error" });
    expect(uploads).toEqual([]);
  });

  it("reports a Storage rejection and saves no row", async () => {
    uploadError = { name: "StorageApiError", message: "new row violates row-level security policy" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: "Front" }))).toMatchObject({ status: "error" });
    spy.mockRestore();
    expect(writes()).toEqual([]);
  });

  it("removes the uploaded file again if its row cannot be saved", async () => {
    handlers["property_images.insert"] = () => fail("42501");
    const result = await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: "Front" }));
    expect(result).toMatchObject({ status: "error" });
    expect(removals).toEqual([{ bucket: "property-images", paths: [uploads[0].path] }]);
  });

  it("retries once with a fresh position when two uploads collide", async () => {
    let attempt = 0;
    handlers["property_images.insert"] = () => (attempt++ === 0 ? fail("23505") : ok(null));
    expect(await uploadPropertyImage(PROPERTY_ID, idle, form({ photo: png(), alt_text: "Front" }))).toMatchObject({ status: "success" });
    expect(writes()).toHaveLength(2);
    expect(removals).toEqual([]);
  });

  it("updates a photo's alt text and caption", async () => {
    handlers["property_images.update"] = () => ok([{ property_id: PROPERTY_ID }]);
    const result = await updatePropertyImage(idle, form({ imageId: IMAGE_ID, alt_text: "Kitchen island", label: "" }));
    expect(result).toEqual({ status: "success", message: "Photo details saved." });
    expect(writes()).toEqual([
      expect.objectContaining({ op: "update", payload: { alt_text: "Kitchen island", label: null }, filters: [["eq", "id", IMAGE_ID]] }),
    ]);
  });

  it("moves a photo by renumbering the whole gallery in one database call", async () => {
    handlers["property_images.select"] = (q) =>
      q.columns === "property_id" ? ok({ property_id: PROPERTY_ID }) : ok([{ id: IMAGE_ID }, { id: IMAGE_ID_2 }, { id: IMAGE_ID_3 }]);
    const result = await movePropertyImage(idle, form({ imageId: IMAGE_ID, direction: "down" }));
    expect(result).toMatchObject({ status: "success" });
    expect(rpcs).toEqual([
      { name: "reorder_property_images", args: { p_property_id: PROPERTY_ID, p_image_ids: [IMAGE_ID_2, IMAGE_ID, IMAGE_ID_3] } },
    ]);
  });

  it("does nothing when moving the first photo earlier", async () => {
    handlers["property_images.select"] = (q) =>
      q.columns === "property_id" ? ok({ property_id: PROPERTY_ID }) : ok([{ id: IMAGE_ID }, { id: IMAGE_ID_2 }]);
    expect(await movePropertyImage(idle, form({ imageId: IMAGE_ID, direction: "up" }))).toEqual({ status: "idle" });
    expect(rpcs).toEqual([]);
  });

  it("deletes a photo row, then its file", async () => {
    handlers["property_images.delete"] = () => ok([{ property_id: PROPERTY_ID, storage_path: "properties/p/a.webp" }]);
    handlers["property_images.select"] = () => ok([]); // no other row uses the file
    const result = await deletePropertyImage(idle, form({ imageId: IMAGE_ID }));

    expect(result).toEqual({ status: "success", message: "Photo deleted." });
    expect(writes()).toEqual([expect.objectContaining({ table: "property_images", op: "delete", filters: [["eq", "id", IMAGE_ID]] })]);
    expect(removals).toEqual([{ bucket: "property-images", paths: ["properties/p/a.webp"] }]);
  });

  it("keeps a photo's file if another row still uses it", async () => {
    handlers["property_images.delete"] = () => ok([{ property_id: PROPERTY_ID, storage_path: "property-1/main.webp" }]);
    handlers["property_images.select"] = () => ok([{ id: IMAGE_ID_2 }]);
    await deletePropertyImage(idle, form({ imageId: IMAGE_ID }));
    expect(removals).toEqual([]);
  });

  it("removes no file when the delete matched no row (e.g. blocked by RLS)", async () => {
    handlers["property_images.delete"] = () => ok([]);
    expect(await deletePropertyImage(idle, form({ imageId: IMAGE_ID }))).toMatchObject({ status: "error" });
    expect(removals).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

describe("agent actions (admin)", () => {
  const NEW_AGENT_ID = "22222222-3333-4444-8555-666666666666";
  const managedPhoto = `${PUBLIC}/agents/${AGENT_ID}/0b9a1c52-1a2b-4c3d-8e9f-0a1b2c3d4e5f.webp`;
  const seededPhoto = `${PUBLIC}/agents/sara-malik.webp`;

  beforeEach(() => signInAs("admin"));

  it("creates an agent without a photo", async () => {
    handlers["agents.insert"] = () => ok({ id: NEW_AGENT_ID });
    const result = await outcome(() => createAgent(idle, form({ ...agentFields, photo: new File([], "") })));

    expect(result).toEqual({ redirect: `/admin/agents/${NEW_AGENT_ID}?saved=created` });
    expect(writes()).toEqual([expect.objectContaining({ table: "agents", op: "insert", payload: agentFields })]);
    expect(uploads).toEqual([]);
  });

  it("creates an agent with a photo stored under their own folder", async () => {
    handlers["agents.insert"] = () => ok({ id: NEW_AGENT_ID });
    handlers["agents.update"] = () => ok(null);
    const result = await outcome(() => createAgent(idle, form({ ...agentFields, photo: png() })));

    expect(result).toEqual({ redirect: `/admin/agents/${NEW_AGENT_ID}?saved=created` });
    expect(uploads[0].path).toMatch(new RegExp(`^agents/${NEW_AGENT_ID}/[0-9a-f-]{36}\\.png$`));
    expect(writes()[1]).toMatchObject({
      table: "agents",
      op: "update",
      payload: { profile_image: `${PUBLIC}/${uploads[0].path}` },
      filters: [["eq", "id", NEW_AGENT_ID]],
    });
  });

  it("still creates the agent, and says so, if the photo upload fails", async () => {
    handlers["agents.insert"] = () => ok({ id: NEW_AGENT_ID });
    uploadError = { name: "StorageApiError", message: "denied" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await outcome(() => createAgent(idle, form({ ...agentFields, photo: png() })));
    spy.mockRestore();
    expect(result).toEqual({ redirect: `/admin/agents/${NEW_AGENT_ID}?saved=created-photo-failed` });
  });

  it.each([
    ["full_name", ""],
    ["email", "not-an-email"],
    ["phone", "call me"],
    ["bio", "x".repeat(2001)],
  ])("rejects invalid %s without writing", async (field, value) => {
    const result = await createAgent(idle, form({ ...agentFields, [field]: value }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { [field]: expect.any(String) } });
    expect(writes()).toEqual([]);
  });

  it("rejects an invalid photo without creating the agent", async () => {
    const fake = new File([new TextEncoder().encode("not an image")], "x.png", { type: "image/png" });
    const result = await createAgent(idle, form({ ...agentFields, photo: fake }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { photo: expect.any(String) } });
    expect(writes()).toEqual([]);
    expect(uploads).toEqual([]);
  });

  it.each([5 * 1024 * 1024 + 1, 6 * 1024 * 1024, 9 * 1024 * 1024])(
    "rejects a %i-byte photo on create with the size error, creating nothing",
    async (size) => {
      const result = await createAgent(idle, form({ ...agentFields, photo: png(size, "big.png") }));
      expect(result).toMatchObject({
        status: "error",
        fieldErrors: { photo: "That photo is larger than 5 MB. Please upload a smaller one." },
        values: { full_name: agentFields.full_name }, // the rest of the form is kept
      });
      expect(writes()).toEqual([]);
      expect(uploads).toEqual([]);
    },
  );

  it("rejects an oversized photo on edit without changing the agent or their photo", async () => {
    handlers["agents.select"] = () => ok({ profile_image: managedPhoto });
    const result = await updateAgent(AGENT_ID, idle, form({ ...agentFields, photo: png(6 * 1024 * 1024, "big.png") }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { photo: expect.stringContaining("5 MB") } });
    expect(writes()).toEqual([]);
    expect(uploads).toEqual([]);
    expect(removals).toEqual([]);
  });

  it("accepts a photo of exactly 5 MB", async () => {
    handlers["agents.insert"] = () => ok({ id: NEW_AGENT_ID });
    handlers["agents.update"] = () => ok(null);
    const result = await outcome(() => createAgent(idle, form({ ...agentFields, photo: png(5 * 1024 * 1024) })));
    expect(result).toEqual({ redirect: `/admin/agents/${NEW_AGENT_ID}?saved=created` });
    expect(uploads).toHaveLength(1);
  });

  it("edits an agent's details, keeping the current photo", async () => {
    handlers["agents.select"] = () => ok({ profile_image: seededPhoto });
    handlers["agents.update"] = () => ok([{ id: AGENT_ID }]);
    const result = await updateAgent(AGENT_ID, idle, form({ ...agentFields, title: "Senior Consultant" }));

    expect(result).toEqual({ status: "success", message: "Changes saved." });
    expect(writes()).toEqual([
      expect.objectContaining({
        op: "update",
        payload: { ...agentFields, title: "Senior Consultant", profile_image: seededPhoto },
        filters: [["eq", "id", AGENT_ID]],
      }),
    ]);
    expect(removals).toEqual([]);
  });

  it("replaces a photo and deletes the old file only if /admin uploaded it", async () => {
    handlers["agents.select"] = () => ok({ profile_image: managedPhoto });
    handlers["agents.update"] = () => ok([{ id: AGENT_ID }]);
    await updateAgent(AGENT_ID, idle, form({ ...agentFields, photo: png() }));

    expect((writes()[0].payload as { profile_image: string }).profile_image).toBe(`${PUBLIC}/${uploads[0].path}`);
    expect(removals).toEqual([{ bucket: "property-images", paths: [managedPhoto.slice(PUBLIC.length + 1)] }]);
  });

  it("never deletes a seeded portrait file when replacing or removing it", async () => {
    handlers["agents.select"] = () => ok({ profile_image: seededPhoto });
    handlers["agents.update"] = () => ok([{ id: AGENT_ID }]);
    await updateAgent(AGENT_ID, idle, form({ ...agentFields, removePhoto: "on" }));

    expect((writes()[0].payload as { profile_image: null }).profile_image).toBeNull();
    expect(removals).toEqual([]);
  });

  it("removes the new file again if the edit cannot be saved", async () => {
    handlers["agents.select"] = () => ok({ profile_image: null });
    handlers["agents.update"] = () => fail("42501");
    const result = await updateAgent(AGENT_ID, idle, form({ ...agentFields, photo: png() }));
    expect(result).toMatchObject({ status: "error" });
    expect(removals).toEqual([{ bucket: "property-images", paths: [uploads[0].path] }]);
  });

  it("rejects invalid agent data on edit without writing", async () => {
    const result = await updateAgent(AGENT_ID, idle, form({ ...agentFields, email: "nope" }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { email: expect.any(String) } });
    expect(writes()).toEqual([]);
  });

  it("deletes an agent with no properties or bookings, and their uploaded photo", async () => {
    rpcResults.admin_agent_dependents = ok([{ properties: 0, bookings: 0, contact_requests: 3 }]);
    handlers["agents.delete"] = () => ok([{ id: AGENT_ID, profile_image: managedPhoto }]);
    const result = await outcome(() => deleteAgent(idle, form({ agentId: AGENT_ID })));

    expect(result).toEqual({ redirect: "/admin/agents?saved=deleted" });
    expect(writes()).toEqual([expect.objectContaining({ table: "agents", op: "delete", filters: [["eq", "id", AGENT_ID]] })]);
    expect(removals).toEqual([{ bucket: "property-images", paths: [managedPhoto.slice(PUBLIC.length + 1)] }]);
  });

  it("refuses to delete an agent who still has properties", async () => {
    rpcResults.admin_agent_dependents = ok([{ properties: 2, bookings: 0, contact_requests: 0 }]);
    const result = await deleteAgent(idle, form({ agentId: AGENT_ID }));
    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/2 properties.*Reassign/) });
    expect(writes()).toEqual([]);
  });

  it("refuses to delete an agent named on viewing requests", async () => {
    rpcResults.admin_agent_dependents = ok([{ properties: 0, bookings: 1, contact_requests: 0 }]);
    expect(await deleteAgent(idle, form({ agentId: AGENT_ID }))).toMatchObject({ status: "error" });
    expect(writes()).toEqual([]);
  });

  it("explains a foreign-key conflict that appears between the check and the delete", async () => {
    rpcResults.admin_agent_dependents = ok([{ properties: 0, bookings: 0, contact_requests: 0 }]);
    handlers["agents.delete"] = () => fail("23503");
    expect(await deleteAgent(idle, form({ agentId: AGENT_ID }))).toMatchObject({
      status: "error",
      message: expect.stringContaining("just linked"),
    });
    expect(removals).toEqual([]);
  });
});
