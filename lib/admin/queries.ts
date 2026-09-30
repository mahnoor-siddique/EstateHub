import "server-only";
import type {
  AdminAgentRow,
  AdminBookingRow,
  AdminContactRequestRow,
  AdminPropertyDetail,
  AdminPropertyRow,
  AdminUserRow,
  AgentDependents,
  AgentOption,
  PropertyDependents,
} from "@/lib/admin/types";
import { bookingReference } from "@/lib/booking/history";
import { DataAccessError, isUuid, toPropertyPhoto } from "@/lib/queries/supabase/shared";
import { createClient } from "@/lib/supabase/server";
import { AMENITY_FIELDS } from "@/lib/validations/admin-property";

/*
 * Reads for the /admin pages. They run with the admin's own session (the pages call requireAdmin
 * first). The catalog itself is public, so these return nothing a visitor could not already see,
 * except the dependents counts, which the database only gives to admins.
 */

/** Every property, newest first, with its agent's name and photo count. */
export async function getAdminProperties(): Promise<AdminPropertyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, title, city, area_location, property_type, listing_type, price, status, created_at, agents(id, full_name), property_images(count)",
    )
    .order("created_at", { ascending: false })
    .order("id");

  if (error) throw new DataAccessError("load properties", error);
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    city: row.city,
    areaLocation: row.area_location,
    propertyType: row.property_type,
    listingType: row.listing_type,
    price: Number(row.price),
    status: row.status,
    agent: row.agents ? { id: row.agents.id, fullName: row.agents.full_name } : null,
    createdAt: row.created_at,
    imageCount: row.property_images[0]?.count ?? 0,
  }));
}

/** One property with every editable value (as form strings) and its photos in order. */
export async function getAdminProperty(id: string): Promise<AdminPropertyDetail | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_images(id, image_url, storage_path, alt_text, label, sort_order)")
    .eq("id", id)
    .order("sort_order", { referencedTable: "property_images" })
    .maybeSingle();

  if (error) throw new DataAccessError("load property", error);
  if (!data) return null;

  const values: Record<string, string> = {
    title: data.title,
    description: data.description ?? "",
    property_type: data.property_type,
    listing_type: data.listing_type,
    price: String(Number(data.price)),
    city: data.city,
    area_location: data.area_location,
    address: data.address ?? "",
    bedrooms: String(data.bedrooms),
    bathrooms: String(data.bathrooms),
    area: String(Number(data.area)),
    area_unit: data.area_unit,
    year_built: data.year_built === null ? "" : String(data.year_built),
    parking_spaces: String(data.parking_spaces),
    status: data.status,
    agent_id: data.agent_id,
  };
  for (const { name } of AMENITY_FIELDS) values[name] = data[name] ? "on" : "";

  return {
    id: data.id,
    title: data.title,
    values,
    images: data.property_images.map((image) => ({
      id: image.id,
      src: toPropertyPhoto(image).src,
      storagePath: image.storage_path,
      altText: image.alt_text,
      label: image.label,
      sortOrder: image.sort_order,
    })),
  };
}

/** Agents for the assignment dropdown, alphabetical. */
export async function getAgentOptions(): Promise<AgentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("agents").select("id, full_name").order("full_name").order("id");
  if (error) throw new DataAccessError("load agents", error);
  return data.map((row) => ({ id: row.id, fullName: row.full_name }));
}

const AGENT_ADMIN_COLUMNS = "id, full_name, title, email, phone, agency_name, bio, profile_image, properties(count)";

type AgentAdminSelect = {
  id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  agency_name: string | null;
  bio: string | null;
  profile_image: string | null;
  properties: { count: number }[];
};

function toAdminAgent(row: AgentAdminSelect): AdminAgentRow {
  return {
    id: row.id,
    fullName: row.full_name,
    title: row.title,
    email: row.email,
    phone: row.phone,
    agencyName: row.agency_name,
    bio: row.bio,
    profileImage: row.profile_image,
    propertyCount: row.properties[0]?.count ?? 0,
  };
}

/** Every agent with their number of assigned properties, alphabetical. */
export async function getAdminAgents(): Promise<AdminAgentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select(AGENT_ADMIN_COLUMNS)
    .order("full_name")
    .order("id");
  if (error) throw new DataAccessError("load agents", error);
  return data.map(toAdminAgent);
}

export async function getAdminAgent(id: string): Promise<AdminAgentRow | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("agents").select(AGENT_ADMIN_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new DataAccessError("load agent", error);
  return data ? toAdminAgent(data) : null;
}

/** What deleting a property would also remove (admin-only database function). */
export async function getPropertyDependents(id: string): Promise<PropertyDependents> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_property_dependents", { p_property_id: id });
  if (error) throw new DataAccessError("check what the property is linked to", error);
  const row = data[0];
  return {
    images: row?.images ?? 0,
    bookings: row?.bookings ?? 0,
    activeBookings: row?.active_bookings ?? 0,
    contactRequests: row?.contact_requests ?? 0,
  };
}

/** What stands in the way of deleting an agent (admin-only database function). */
export async function getAgentDependents(id: string): Promise<AgentDependents> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_agent_dependents", { p_agent_id: id });
  if (error) throw new DataAccessError("check what the agent is linked to", error);
  const row = data[0];
  return {
    properties: row?.properties ?? 0,
    bookings: row?.bookings ?? 0,
    contactRequests: row?.contact_requests ?? 0,
  };
}

/** The properties assigned to an agent (id and title), for the agent's edit page. */
export async function getAgentProperties(agentId: string): Promise<{ id: string; title: string }[]> {
  if (!isUuid(agentId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("properties").select("id, title").eq("agent_id", agentId).order("title");
  if (error) throw new DataAccessError("load the agent's properties", error);
  return data;
}

/**
 * Every viewing request, latest viewing date and time first, with its property and agent. Only
 * admins get all rows: the database's "Admins can read all bookings" policy decides; anyone else
 * would get just their own.
 */
export async function getAdminBookings(): Promise<AdminBookingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, booking_time, status, name, email, phone, message, created_at, properties(id, title, city), agents(id, full_name)",
    )
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new DataAccessError("load bookings", error);
  return data.map((row) => ({
    id: row.id,
    reference: bookingReference(row.id),
    date: row.booking_date,
    time: row.booking_time.slice(0, 5), // Postgres returns HH:MM:SS
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    createdAt: row.created_at,
    property: row.properties ? { id: row.properties.id, title: row.properties.title, city: row.properties.city } : null,
    agent: row.agents ? { id: row.agents.id, fullName: row.agents.full_name } : null,
  }));
}

/**
 * Every contact request, newest first, with the property and/or agent it was about. Only admins
 * get all rows: the database's "Admins can read all contact requests" policy decides; anyone else
 * would get just their own. A property enquiry always also names the property's agent (set by the
 * contact_requests_set_defaults trigger); an agent enquiry names only the agent.
 */
export async function getAdminContactRequests(): Promise<AdminContactRequestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_requests")
    .select("id, user_id, name, email, phone, message, created_at, properties(id, title, city), agents(id, full_name)")
    .order("created_at", { ascending: false })
    .order("id");

  if (error) throw new DataAccessError("load contact requests", error);
  return data.map((row) => ({
    id: row.id,
    kind: row.properties ? "property" : row.agents ? "agent" : "general",
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    createdAt: row.created_at,
    fromAccount: row.user_id !== null,
    property: row.properties ? { id: row.properties.id, title: row.properties.title, city: row.properties.city } : null,
    agent: row.agents ? { id: row.agents.id, fullName: row.agents.full_name } : null,
  }));
}

/**
 * Every account's profile, newest first. Only the public.profiles columns are read — no passwords,
 * tokens or other auth data (those stay in auth.users, which the app never queries). Only admins
 * get all rows: the database's "Admins can read all profiles" policy decides.
 */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .order("id");

  if (error) throw new DataAccessError("load accounts", error);
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }));
}
