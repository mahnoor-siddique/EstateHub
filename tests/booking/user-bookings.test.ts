import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataAccessError } from "@/lib/queries/supabase/shared";

/*
 * getUserBookings with the Supabase server client mocked: checks the query is scoped to the given
 * user and that rows map to the UI shape. The live test (bookings.integration.test.ts) checks the
 * same query against real Row Level Security.
 */

const calls: { method: string; args: unknown[] }[] = [];
let result: { data: unknown; error: unknown };

function queryBuilder() {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  // Awaiting the builder resolves to the configured result, like supabase-js.
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

// The client itself must not be thenable (it is awaited from createClient); only queries are.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return queryBuilder();
    },
  }),
}));

const { getUserBookings } = await import("@/lib/queries/supabase/bookings");

const USER_ID = "11111111-1111-4111-8111-111111111111";

const row = {
  id: "be942da7-0000-4000-8000-000000000000",
  booking_date: "2026-09-30",
  booking_time: "11:00:00",
  status: "pending",
  message: "See the garden",
  created_at: "2026-09-28T05:00:00Z",
  properties: {
    id: "ba3d940c-b0d1-50dd-9fb1-44f62f2d2264",
    title: "Modern Villa with Landscaped Garden",
    property_type: "Villa",
    listing_type: "For Sale",
    price: "185000000",
    city: "Lahore",
    area_location: "DHA Phase 6",
    bedrooms: 5,
    bathrooms: 6,
    area: "1",
    area_unit: "Kanal",
    created_at: "2026-09-02T00:00:00Z",
    has_parking: true,
    has_garden: true,
    has_swimming_pool: false,
    has_security: false,
    has_gym: false,
    is_furnished: false,
    has_air_conditioning: false,
    has_backup_power: false,
    property_images: [],
  },
  agents: { id: "6ceb4716-6d87-591e-9ead-212a4e979b44", full_name: "Sana Malik", agency_name: null },
};

beforeEach(() => {
  calls.length = 0;
  result = { data: [], error: null };
});

describe("getUserBookings", () => {
  it("scopes the query to the given user's bookings", async () => {
    await getUserBookings(USER_ID);
    expect(calls[0]).toEqual({ method: "from", args: ["bookings"] });
    expect(calls).toContainEqual({ method: "eq", args: ["user_id", USER_ID] });
  });

  it("maps rows to the booking history shape", async () => {
    result = { data: [row], error: null };
    const [booking] = await getUserBookings(USER_ID);
    expect(booking).toMatchObject({
      id: row.id,
      reference: "BE942DA7",
      date: "2026-09-30",
      time: "11:00",
      status: "pending",
      message: "See the garden",
      agent: { id: row.agents.id, fullName: "Sana Malik", agencyName: "" },
    });
    expect(booking.property).toMatchObject({
      id: row.properties.id,
      title: "Modern Villa with Landscaped Garden",
      price: 185000000,
      amenities: ["Parking", "Garden"],
    });
  });

  it("copes with a missing listing or agent", async () => {
    result = { data: [{ ...row, properties: null, agents: null }], error: null };
    const [booking] = await getUserBookings(USER_ID);
    expect(booking.property).toBeNull();
    expect(booking.agent).toBeNull();
  });

  it("throws a DataAccessError when Supabase fails, so error.tsx is shown", async () => {
    result = { data: null, error: { code: "PGRST000", message: "connection refused", details: "", hint: "" } };
    await expect(getUserBookings(USER_ID)).rejects.toBeInstanceOf(DataAccessError);
  });
});
