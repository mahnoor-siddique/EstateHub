"use server";

import { revalidatePath } from "next/cache";
import { adminWriteErrorMessage } from "@/lib/admin/errors";
import type { AdminFormState } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/session";
import { isUuid } from "@/lib/queries/supabase/shared";
import { createClient } from "@/lib/supabase/server";
import { USER_ROLE_LABELS, parseUserRole } from "@/lib/validations/admin-user";

/*
 * Server Action behind /admin/users. requireAdmin first (guests go to login, everyone else gets a
 * 404; the role is read from the caller's profile row, never from the browser). Only
 * profiles.role is written, with the admin's own session: the database allows admins to update
 * that one column and nothing else, and its profiles_prevent_self_admin_removal trigger refuses an
 * admin demoting themselves even if this check were bypassed. auth.users is never touched.
 */

const SELF_DEMOTION = "You can't remove your own admin access. Ask another admin if this is really needed.";

export async function updateUserRole(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireAdmin("/admin/users");
  const userId = String(formData.get("userId") ?? "");
  const role = parseUserRole(formData.get("role"));
  if (!isUuid(userId) || !role) return { status: "error", message: "Choose a valid role." };

  if (userId === admin.id && role !== "admin") return { status: "error", message: SELF_DEMOTION };

  const supabase = await createClient();
  const current = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (current.error) return { status: "error", message: adminWriteErrorMessage(current.error, "change the role") };
  if (!current.data) return { status: "error", message: "This account no longer exists." };

  // Granting admin gives full control of the site, so it must be explicitly confirmed.
  if (role === "admin" && current.data.role !== "admin" && formData.get("confirmAdmin") !== "on") {
    return { status: "error", message: "Tick the box to confirm giving this account full admin access." };
  }

  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select("id");

  if (error) {
    return {
      status: "error",
      message: error.code === "P0001" ? SELF_DEMOTION : adminWriteErrorMessage(error, "change the role"),
    };
  }
  if (data.length === 0) return { status: "error", message: "This account no longer exists." };

  // The changed account's Admin link and /admin access follow its new role on its next request.
  revalidatePath("/", "layout");
  return { status: "success", message: `Role set to ${USER_ROLE_LABELS[role]}.` };
}
