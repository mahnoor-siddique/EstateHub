/** Site-wide constants shared by the layout, navbar, footer and metadata. */

export const SITE = {
  name: "EstateHub",
  tagline: "Find Your Place",
  description:
    "Explore verified properties for sale and rent across Lahore, Islamabad, Karachi and more. EstateHub connects you with trusted agents and makes booking a viewing simple.",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "Agents", href: "/agents" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const AUTH_LINKS = {
  login: { label: "Login", href: "/login" },
  signup: { label: "Get Started", href: "/signup" },
} as const;

/** Links shown only to signed-in users. */
export const ACCOUNT_LINKS = {
  bookings: { label: "My bookings", href: "/bookings" },
} as const;

/** Shown only to users whose profile role is `admin` (checked on the server). */
export const ADMIN_LINK = { label: "Admin", href: "/admin" } as const;

export const CITIES = [
  "Lahore",
  "Islamabad",
  "Karachi",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
] as const;
