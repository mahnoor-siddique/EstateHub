/*
 * Sections of the /admin area. Only the dashboard exists so far; the others are placeholders for
 * the upcoming management pages and are shown as "coming soon" (not links) until they are built.
 */

export type AdminSectionId =
  | "dashboard"
  | "properties"
  | "agents"
  | "bookings"
  | "contact-requests"
  | "users";

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  href: string;
  description: string;
  available: boolean;
};

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    description: "Overview of the admin area.",
    available: true,
  },
  {
    id: "properties",
    label: "Properties",
    href: "/admin/properties",
    description: "Create, edit and retire listings, and manage their photos.",
    available: false,
  },
  {
    id: "agents",
    label: "Agents",
    href: "/admin/agents",
    description: "Manage the agent directory and profiles.",
    available: false,
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/admin/bookings",
    description: "Review viewing requests and update their status.",
    available: false,
  },
  {
    id: "contact-requests",
    label: "Contact Requests",
    href: "/admin/contact-requests",
    description: "Read and follow up on enquiries sent to agents.",
    available: false,
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    description: "View accounts and manage their roles.",
    available: false,
  },
];
