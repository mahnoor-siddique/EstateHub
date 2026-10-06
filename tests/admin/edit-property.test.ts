import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  getAccessFallbackHTTPStatus,
  isHTTPAccessFallbackError,
} from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Admin → Properties → Edit, end to end with a fake Supabase client: who can open
 * /admin/properties/[id], that the form is pre-filled from the stored row, that saving an unchanged
 * form writes back exactly what is stored (for rows shaped like the six real listings), that every
 * field can be changed, that photos are never touched by an edit, and that invalid input never
 * reaches the database (so nothing is partially updated).
 */

type Query = { table: string; op: string; payload?: unknown; filters: [string, unknown][] };
type Result = { data: unknown; error: { code: string; message: string } | null };

let claims: Record<string, unknown> | null;
let role: string | null;
let tables: Record<string, (q: Query) => Result>;
const queries: Query[] = [];
const rpcs: string[] = [];

function builder(table: string) {
  const query: Query = { table, op: "select", filters: [] };
  const b: Record<string, unknown> = {
    select: () => b,
    update(payload: unknown) {
      Object.assign(query, { op: "update", payload });
      return b;
    },
    eq(column: string, value: unknown) {
      query.filters.push([column, value]);
      return b;
    },
    order: () => b,
    maybeSingle: () => b,
    then(resolve: (r: Result) => unknown) {
      queries.push(query);
      const result =
        table === "profiles"
          ? { data: role ? { role, full_name: "Sana Malik" } : null, error: null }
          : (tables[`${table}.${query.op}`]?.(query) ?? { data: [], error: null });
      return Promise.resolve(result).then(resolve);
    },
  };
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: claims && { claims }, error: null }) },
    from: builder,
    rpc: async (name: string) => {
      rpcs.push(name);
      return { data: [{ images: 2, bookings: 0, active_bookings: 0, contact_requests: 0 }], error: null };
    },
    // No storage stub on purpose: an edit that touched Storage would throw here.
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement("img", { src, alt }),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/admin/properties/x",
}));

const { updateProperty } = await import("@/lib/admin/properties/actions");
const { getAdminProperty } = await import("@/lib/admin/queries");
const { default: EditPropertyPage } = await import("@/app/admin/properties/[id]/page");

const USER_ID = "7d1c2f0e-0000-4000-8000-000000000001";
const SARA = "6ceb4716-6d87-591e-9ead-212a4e979b44";
const HAMZA = "a95715d6-6aea-5d6c-a00e-d167473cf091";
const AMENITIES = [
  "has_parking",
  "has_garden",
  "has_swimming_pool",
  "has_security",
  "has_gym",
  "is_furnished",
  "has_air_conditioning",
  "has_backup_power",
] as const;

/** A stored properties row, as PostgREST returns it (numeric columns as strings). */
function storedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264",
    agent_id: SARA,
    title: "Modern Villa with Landscaped Garden",
    description: "A five-bedroom villa.",
    property_type: "Villa",
    listing_type: "For Sale",
    price: "185000000.00",
    city: "Lahore",
    area_location: "DHA Phase 6",
    address: null,
    bedrooms: 5,
    bathrooms: 6,
    area: "1.00",
    area_unit: "Kanal",
    year_built: 2021,
    parking_spaces: 3,
    status: "available",
    has_parking: true,
    has_garden: true,
    has_swimming_pool: true,
    has_security: true,
    has_gym: false,
    is_furnished: false,
    has_air_conditioning: true,
    has_backup_power: true,
    created_at: "2026-08-01T00:00:00+00:00",
    updated_at: "2026-08-01T00:00:00+00:00",
    property_images: [
      { id: "d849e223-cf59-5453-bc1d-8efc38b32ade", image_url: "u", alt_text: "Front of the villa", label: "Exterior", sort_order: 0 },
      { id: "a65cd623-58f1-5165-ac3c-33095318820e", image_url: "u", alt_text: "Living room", label: null, sort_order: 1 },
    ],
    ...overrides,
  };
}

/** The editable columns of a stored row, as the database holds them. */
function columnsOf(row: ReturnType<typeof storedRow>) {
  return {
    title: row.title,
    description: row.description,
    property_type: row.property_type,
    listing_type: row.listing_type,
    price: Number(row.price),
    city: row.city,
    area_location: row.area_location,
    address: row.address,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: Number(row.area),
    area_unit: row.area_unit,
    year_built: row.year_built,
    parking_spaces: row.parking_spaces,
    status: row.status,
    agent_id: row.agent_id,
    ...Object.fromEntries(AMENITIES.map((name) => [name, row[name]])),
  };
}

const toForm = (values: Record<string, string>) => {
  const data = new FormData();
  // Unticked checkboxes are simply absent from a real form submission.
  for (const [key, value] of Object.entries(values)) if (value !== "") data.set(key, value);
  for (const key of ["description", "address", "year_built"]) data.set(key, values[key] ?? "");
  return data;
};

const signIn = (as: string, extra: Record<string, unknown> = {}) => {
  claims = { sub: USER_ID, email: "someone@example.com", ...extra };
  role = as;
};

async function outcome(fn: () => Promise<unknown>) {
  try {
    return { returned: await fn() };
  } catch (error) {
    if (isRedirectError(error)) return { redirect: getURLFromRedirectError(error) };
    if (isHTTPAccessFallbackError(error)) return { status: getAccessFallbackHTTPStatus(error) };
    throw error;
  }
}

const updates = () => queries.filter((q) => q.op !== "select");
let row: ReturnType<typeof storedRow>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example-ref.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
  claims = null;
  role = null;
  queries.length = 0;
  rpcs.length = 0;
  row = storedRow();
  tables = {
    "properties.select": () => ({ data: row, error: null }),
    "properties.update": () => ({ data: [{ id: row.id }], error: null }),
    "agents.select": (q) =>
      q.filters.length
        ? { data: [SARA, HAMZA].includes(q.filters[0][1] as string) ? { id: q.filters[0][1] } : null, error: null }
        : { data: [{ id: SARA, full_name: "Sara Malik" }, { id: HAMZA, full_name: "Hamza Qureshi" }], error: null },
  };
  return () => vi.unstubAllEnvs();
});

const page = () =>
  EditPropertyPage({
    params: Promise.resolve({ id: row.id }),
    searchParams: Promise.resolve({}),
  } as Parameters<typeof EditPropertyPage>[0]);

describe("/admin/properties/[id] page", () => {
  it("sends guests to login and gives users, agents and forged admins a 404, loading nothing", async () => {
    expect(await outcome(page)).toEqual({ redirect: `/login?next=%2Fadmin%2Fproperties%2F${row.id}` });
    for (const [as, extra] of [["user", {}], ["agent", {}], ["user", { app_metadata: { role: "admin" } }]] as const) {
      signIn(as, extra);
      expect(await outcome(page)).toEqual({ status: 404 });
    }
    expect(queries.filter((q) => q.table !== "profiles")).toEqual([]);
    expect(rpcs).toEqual([]);
  });

  it("pre-fills the admin's form from the stored row and lists its photos", async () => {
    signIn("admin");
    const html = renderToStaticMarkup((await page()) as ReactElement);

    expect(html).toContain('value="Modern Villa with Landscaped Garden"');
    expect(html).toContain(">A five-bedroom villa.</textarea>");
    expect(html).toContain('value="185000000"');
    expect(html).toContain('value="DHA Phase 6"');
    expect(html).toContain('value="2021"');
    for (const [value] of [["Villa"], ["For Sale"], ["Lahore"], ["Kanal"], ["available"], [SARA]]) {
      expect(html, value).toMatch(new RegExp(`<option value="${value}" selected="">`));
    }
    expect(html).toMatch(/name="has_parking"[^>]*checked=""/);
    expect(html).not.toMatch(/name="has_gym"[^>]*checked=""/);
    // Photos section shows the existing photos, in order.
    expect(html.indexOf('alt="Front of the villa"')).toBeLessThan(html.indexOf('alt="Living room"'));
    expect(html).toContain("Delete property");
  });
});

describe("updateProperty", () => {
  // Shapes of the six real listings (from the live data): sale and rent, Kanal/Marla/sq ft sizes.
  const listings = [
    { price: "185000000.00", city: "Lahore", area: "1.00", area_unit: "Kanal", listing_type: "For Sale", year_built: 2021 },
    { price: "280000.00", city: "Karachi", area: "2100.00", area_unit: "sq ft", listing_type: "For Rent", year_built: 2019 },
    { price: "95000000.00", city: "Rawalpindi", area: "10.00", area_unit: "Marla", listing_type: "For Sale", year_built: 2022 },
    { price: "210000000.00", city: "Islamabad", area: "1.00", area_unit: "Kanal", listing_type: "For Sale", year_built: 2020 },
    { price: "68000000.00", city: "Lahore", area: "2800.00", area_unit: "sq ft", listing_type: "For Sale", year_built: 2018 },
    { price: "150000.00", city: "Faisalabad", area: "10.00", area_unit: "Marla", listing_type: "For Rent", year_built: 2017 },
  ];

  it.each(listings)("saving an unchanged form writes back exactly what is stored ($city, $area $area_unit)", async (shape) => {
    signIn("admin");
    row = storedRow(shape);
    const detail = await getAdminProperty(row.id);
    const result = await updateProperty(row.id, { status: "idle" }, toForm(detail!.values));

    expect(result).toEqual({ status: "success", message: "Changes saved." });
    expect(updates()).toEqual([
      { table: "properties", op: "update", payload: columnsOf(row), filters: [["id", row.id]] },
    ]);
  });

  it("changes every editable field, including the agent, in one update of that row only", async () => {
    signIn("admin");
    const values = {
      title: "Renamed Villa",
      description: "",
      property_type: "House",
      listing_type: "For Rent",
      price: "450000",
      city: "Islamabad",
      area_location: "F-7/2",
      address: "Street 15",
      bedrooms: "3",
      bathrooms: "2",
      area: "12.5",
      area_unit: "Marla",
      year_built: "",
      parking_spaces: "1",
      status: "rented",
      agent_id: HAMZA,
      has_gym: "on",
      is_furnished: "on",
    };
    expect(await updateProperty(row.id, { status: "idle" }, toForm(values))).toMatchObject({ status: "success" });

    expect(updates()).toHaveLength(1);
    expect(updates()[0]).toMatchObject({ table: "properties", filters: [["id", row.id]] });
    expect(updates()[0].payload).toEqual({
      title: "Renamed Villa",
      description: null,
      property_type: "House",
      listing_type: "For Rent",
      price: 450000,
      city: "Islamabad",
      area_location: "F-7/2",
      address: "Street 15",
      bedrooms: 3,
      bathrooms: 2,
      area: 12.5,
      area_unit: "Marla",
      year_built: null,
      parking_spaces: 1,
      status: "rented",
      agent_id: HAMZA,
      has_parking: false,
      has_garden: false,
      has_swimming_pool: false,
      has_security: false,
      has_gym: true,
      is_furnished: true,
      has_air_conditioning: false,
      has_backup_power: false,
    });
  });

  it("never touches the property's photos (no image rows, no Storage, no RPC)", async () => {
    signIn("admin");
    const detail = await getAdminProperty(row.id);
    queries.length = 0;
    await updateProperty(row.id, { status: "idle" }, toForm({ ...detail!.values, title: "New title" }));

    expect(queries.some((q) => q.table === "property_images")).toBe(false);
    expect(rpcs).toEqual([]);
    expect(Object.keys(updates()[0].payload as object).some((key) => key.includes("image"))).toBe(false);
  });

  it.each([
    ["title", ""],
    ["price", "1.5 crore"],
    ["city", "Atlantis"],
    ["area", "0"],
    ["area_unit", "Acre"],
    ["bedrooms", "-1"],
    ["year_built", "1700"],
    ["property_type", "Castle"],
    ["status", "archived"],
    ["agent_id", "not-an-id"],
  ])("rejects %s = %j before any database write (no partial update)", async (field, value) => {
    signIn("admin");
    const detail = await getAdminProperty(row.id);
    queries.length = 0;
    const result = await updateProperty(row.id, { status: "idle" }, toForm({ ...detail!.values, title: "Changed", [field]: value }));

    expect(result).toMatchObject({ status: "error", fieldErrors: { [field]: expect.any(String) } });
    // The other edits in the same submit ("Changed" title) were not saved either.
    expect(updates()).toEqual([]);
    // The form comes back as submitted (toForm leaves an empty title out, like a missing field).
    expect(result.status === "error" && (result.values?.title ?? "")).toBe(field === "title" ? "" : "Changed");
  });

  it("rejects reassigning to an agent that does not exist, saving nothing", async () => {
    signIn("admin");
    const detail = await getAdminProperty(row.id);
    const result = await updateProperty(row.id, { status: "idle" }, toForm({ ...detail!.values, agent_id: "08b56262-64ee-5f94-ad69-a602daed5be0" }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { agent_id: expect.any(String) } });
    expect(updates()).toEqual([]);
  });

  it("reports a database rejection as a failed save (one statement, so nothing is half-applied)", async () => {
    signIn("admin");
    tables["properties.update"] = () => ({ data: null, error: { code: "23514", message: "check violation" } });
    const detail = await getAdminProperty(row.id);
    const result = await updateProperty(row.id, { status: "idle" }, toForm(detail!.values));
    expect(result).toMatchObject({ status: "error", message: expect.stringContaining("not accepted") });
    expect(updates()).toHaveLength(1);
  });
});
