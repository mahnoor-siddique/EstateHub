import type { Database } from "@/types/database";

/*
 * Shapes shared by the admin pages, forms and Server Actions.
 */

type Enums = Database["public"]["Enums"];

/** State a Server Action returns to an admin form (via useActionState). `values` refills the form. */
export type AdminFormState<Field extends string = string> =
  | { status: "idle" }
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<Field, string>>;
      values?: Record<string, string>;
    }
  | { status: "success"; message: string };

export type AdminPropertyRow = {
  id: string;
  title: string;
  city: string;
  areaLocation: string;
  propertyType: Enums["property_type"];
  listingType: Enums["listing_type"];
  price: number;
  status: Enums["property_status"];
  agent: { id: string; fullName: string } | null;
  createdAt: string;
  imageCount: number;
};

export type AdminPropertyImage = {
  id: string;
  src: string;
  storagePath: string | null;
  altText: string;
  label: string | null;
  sortOrder: number;
};

/** Every column the edit form shows, keyed by form field name (= database column). */
export type AdminPropertyValues = Record<string, string>;

export type AdminPropertyDetail = {
  id: string;
  title: string;
  values: AdminPropertyValues;
  images: AdminPropertyImage[];
};

export type AgentOption = { id: string; fullName: string };

export type AdminAgentRow = {
  id: string;
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  agencyName: string | null;
  bio: string | null;
  profileImage: string | null;
  propertyCount: number;
};

export type PropertyDependents = {
  images: number;
  bookings: number;
  activeBookings: number;
  contactRequests: number;
};

export type AgentDependents = { properties: number; bookings: number; contactRequests: number };

/** One viewing request as the admin bookings page shows it. */
export type AdminBookingRow = {
  id: string;
  reference: string; // short form of the id, as shown to the customer on /bookings
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: Enums["booking_status"];
  name: string;
  email: string;
  phone: string;
  message: string | null;
  createdAt: string;
  property: { id: string; title: string; city: string } | null;
  agent: { id: string; fullName: string } | null;
};

/** What a contact request was about: a listing, an agent directly, or neither. */
export type ContactRequestKind = "property" | "agent" | "general";

/** One contact request as the admin contact-requests page shows it. */
export type AdminContactRequestRow = {
  id: string;
  kind: ContactRequestKind;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  /** False for requests sent by guests before sign-in became required. */
  fromAccount: boolean;
  property: { id: string; title: string; city: string } | null;
  agent: { id: string; fullName: string } | null;
};

/** One account as the admin users page shows it (from public.profiles; never auth secrets). */
export type AdminUserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: Enums["user_role"];
  createdAt: string;
};
