import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  getAccessFallbackHTTPStatus,
  isHTTPAccessFallbackError,
} from "next/dist/client/components/http-access-fallback/http-access-fallback";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toPropertyDetail } from "@/lib/queries/supabase/shared";

/*
 * Admin → Properties → Create, end to end with a fake Supabase client: the /admin/properties/new
 * page (who can open it, which fields and agents it offers), the exact row createProperty
 * inserts, how that row appears in the admin list, and how the same row maps onto the public
 * property page. Live RLS for the insert is checked separately against the real project.
 */

type Query = { table: string; op: string; columns?: string; payload?: unknown; filters: [string, unknown][] };
type Result = { data: unknown; error: { code: string; message: string } | null };

let claims: Record<string, unknown> | null;
let role: string | null;
let tables: Record<string, (q: Query) => Result>;
const queries: Query[] = [];

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
    eq(column: string, value: unknown) {
      query.filters.push([column, value]);
      return b;
    },
    order: () => b,
    maybeSingle: () => b,
    single: () => b,
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
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/admin/properties/new",
}));

const { createProperty } = await import("@/lib/admin/properties/actions");
const { default: NewPropertyPage } = await import("@/app/admin/properties/new/page");
const { getAdminProperties } = await import("@/lib/admin/queries");

const USER_ID = "7d1c2f0e-0000-4000-8000-000000000001";
const NEW_ID = "11111111-2222-4333-8444-555555555555";
const SARA = { id: "6ceb4716-6d87-591e-9ead-212a4e979b44", full_name: "Sara Malik" };
const HAMZA = { id: "a95715d6-6aea-5d6c-a00e-d167473cf091", full_name: "Hamza Qureshi" };
const AMENITY_COLUMNS = [
  "has_parking",
  "has_garden",
  "has_swimming_pool",
  "has_security",
  "has_gym",
  "is_furnished",
  "has_air_conditioning",
  "has_backup_power",
];

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

const render = async () => renderToStaticMarkup((await NewPropertyPage()) as ReactElement);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example-ref.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
  claims = null;
  role = null;
  queries.length = 0;
  tables = { "agents.select": () => ({ data: [SARA, HAMZA], error: null }) };
  return () => vi.unstubAllEnvs();
});

describe("/admin/properties/new page", () => {
  it("sends guests to login and gives users, agents and forged admins a 404", async () => {
    expect(await outcome(render)).toEqual({ redirect: "/login?next=%2Fadmin%2Fproperties%2Fnew" });
    for (const [as, extra] of [["user", {}], ["agent", {}], ["user", { user_metadata: { role: "admin" } }]] as const) {
      signIn(as, extra);
      expect(await outcome(render)).toEqual({ status: 404 });
    }
    // No agent data was loaded for anyone who is not an admin.
    expect(queries.filter((q) => q.table !== "profiles")).toEqual([]);
  });

  it("shows the admin every property field, and only real agents to choose from", async () => {
    signIn("admin");
    const html = await render();

    for (const name of [
      "title", "description", "property_type", "listing_type", "price", "status", "agent_id", "city",
      "area_location", "address", "area", "area_unit", "year_built", "bedrooms", "bathrooms", "parking_spaces",
      ...AMENITY_COLUMNS,
    ]) {
      expect(html, name).toContain(`name="${name}"`);
    }
    // The agent dropdown lists exactly the agents from the agents table.
    const agentSelect = html.slice(html.indexOf('name="agent_id"'), html.indexOf("</select>", html.indexOf('name="agent_id"')));
    const options = [...agentSelect.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]);
    expect(options).toEqual(["", SARA.id, HAMZA.id]);
    // Photos are not part of creation (they are managed on the property's page afterwards).
    expect(html).not.toContain('type="file"');
    // Sensible defaults for a new listing.
    expect(html).toMatch(/<option value="available" selected="">/);
  });

  it("asks for an agent first when there are none", async () => {
    signIn("admin");
    tables["agents.select"] = () => ({ data: [], error: null });
    const html = await render();
    expect(html).toContain("Add an agent first");
    expect(html).not.toContain('name="title"');
  });
});

describe("createProperty — full round trip", () => {
  const fields: Record<string, string> = {
    title: "Temporary Garden Villa",
    description: "Four-bedroom villa with a lawn.",
    property_type: "Villa",
    listing_type: "For Rent",
    price: "350,000",
    city: "Islamabad",
    area_location: "F-7/2",
    address: "Street 15, House 3",
    bedrooms: "4",
    bathrooms: "3",
    area: "1.5",
    area_unit: "Kanal",
    year_built: "2015",
    parking_spaces: "2",
    status: "pending",
    agent_id: HAMZA.id,
    has_garden: "on",
    has_security: "on",
    is_furnished: "on",
  };
  const form = () => {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
  };

  it("inserts exactly the listing's columns (no id, timestamps or unknown fields)", async () => {
    signIn("admin");
    tables["agents.select"] = () => ({ data: { id: HAMZA.id }, error: null });
    tables["properties.insert"] = () => ({ data: { id: NEW_ID }, error: null });

    const data = form();
    data.set("id", "forged");
    data.set("created_at", "2000-01-01");
    data.set("role", "admin");
    expect(await outcome(() => createProperty({ status: "idle" }, data))).toEqual({
      redirect: `/admin/properties/${NEW_ID}?saved=created`,
    });

    const insert = queries.find((q) => q.op === "insert");
    expect(insert?.table).toBe("properties");
    expect(insert?.payload).toEqual({
      title: "Temporary Garden Villa",
      description: "Four-bedroom villa with a lawn.",
      property_type: "Villa",
      listing_type: "For Rent",
      price: 350_000,
      city: "Islamabad",
      area_location: "F-7/2",
      address: "Street 15, House 3",
      bedrooms: 4,
      bathrooms: 3,
      area: 1.5,
      area_unit: "Kanal",
      year_built: 2015,
      parking_spaces: 2,
      status: "pending",
      agent_id: HAMZA.id,
      has_parking: false,
      has_garden: true,
      has_swimming_pool: false,
      has_security: true,
      has_gym: false,
      is_furnished: true,
      has_air_conditioning: false,
      has_backup_power: false,
    });
    // The agent was checked against the agents table before inserting.
    const agentCheck = queries.findIndex((q) => q.table === "agents");
    expect(queries[agentCheck].filters).toEqual([["id", HAMZA.id]]);
    expect(agentCheck).toBeLessThan(queries.indexOf(insert!));
  });

  it("keeps everything the admin typed when a value is rejected", async () => {
    signIn("admin");
    const data = form();
    data.set("price", "3.5 lakh");
    const result = await createProperty({ status: "idle" }, data);
    expect(result).toMatchObject({ status: "error", fieldErrors: { price: expect.any(String) } });
    expect(result.status === "error" && result.values).toMatchObject({
      title: "Temporary Garden Villa",
      price: "3.5 lakh",
      agent_id: HAMZA.id,
      has_garden: "on",
    });
    expect(queries.some((q) => q.op === "insert")).toBe(false);
  });

  it("the new row appears in the admin list with its agent", async () => {
    signIn("admin");
    tables["properties.select"] = () => ({
      data: [
        {
          id: NEW_ID,
          title: fields.title,
          city: "Islamabad",
          area_location: "F-7/2",
          property_type: "Villa",
          listing_type: "For Rent",
          price: 350000,
          status: "pending",
          created_at: "2026-09-29T17:00:00+00:00",
          agents: { id: HAMZA.id, full_name: HAMZA.full_name },
          property_images: [{ count: 0 }],
        },
      ],
      error: null,
    });
    expect(await getAdminProperties()).toEqual([
      {
        id: NEW_ID,
        title: "Temporary Garden Villa",
        city: "Islamabad",
        areaLocation: "F-7/2",
        propertyType: "Villa",
        listingType: "For Rent",
        price: 350000,
        status: "pending",
        agent: { id: HAMZA.id, fullName: "Hamza Qureshi" },
        createdAt: "2026-09-29T17:00:00+00:00",
        imageCount: 0,
      },
    ]);
  });

  it("the stored row maps onto the public property page correctly (placeholder until photos exist)", () => {
    // What Postgres returns for the inserted row (numeric columns come back as strings).
    const stored = {
      id: NEW_ID,
      title: fields.title,
      description: fields.description,
      property_type: "Villa" as const,
      listing_type: "For Rent" as const,
      price: "350000.00" as unknown as number,
      city: "Islamabad",
      area_location: "F-7/2",
      bedrooms: 4,
      bathrooms: 3,
      area: "1.50" as unknown as number,
      area_unit: "Kanal" as const,
      year_built: 2015,
      parking_spaces: 2,
      agent_id: HAMZA.id,
      created_at: "2026-09-29T17:00:00+00:00",
      has_parking: false,
      has_garden: true,
      has_swimming_pool: false,
      has_security: true,
      has_gym: false,
      is_furnished: true,
      has_air_conditioning: false,
      has_backup_power: false,
      property_images: [],
    };
    expect(toPropertyDetail(stored)).toEqual({
      id: NEW_ID,
      title: "Temporary Garden Villa",
      propertyType: "Villa",
      listingType: "For Rent",
      price: 350000,
      city: "Islamabad",
      location: "F-7/2",
      bedrooms: 4,
      bathrooms: 3,
      area: 1.5,
      areaUnit: "Kanal",
      amenities: ["Garden", "Security", "Furnished"],
      listedAt: "2026-09-29",
      images: [],
      description: "Four-bedroom villa with a lawn.",
      yearBuilt: 2015,
      parkingSpaces: 2,
      agentId: HAMZA.id,
    });
  });
});
