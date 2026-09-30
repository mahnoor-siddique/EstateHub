import type { UserRole } from "@/lib/auth/types";

/*
 * The application roles an admin may assign — exactly the user_role enum. Roles are stored only in
 * public.profiles.role; nothing here touches auth.users.
 */

export const USER_ROLES = ["user", "agent", "admin"] as const satisfies readonly UserRole[];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  agent: "Agent",
  admin: "Admin",
};

export function parseUserRole(value: FormDataEntryValue | null): UserRole | null {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value) ? (value as UserRole) : null;
}
