/*
 * Sections of the /admin area. A section with available: false is shown as "coming soon" (not a link).
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
    available: true,
  },
  {
    id: "agents",
    label: "Agents",
    href: "/admin/agents",
    description: "Manage the agent directory and profiles.",
    available: true,
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/admin/bookings",
    description: "Review viewing requests and update their status.",
    available: true,
  },
  {
    id: "contact-requests",
    label: "Contact Requests",
    href: "/admin/contact-requests",
    description: "Read and follow up on enquiries sent to agents.",
    available: true,
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    description: "View accounts and manage their roles.",
    available: true,
  },
];
