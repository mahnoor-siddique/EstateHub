"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminWriteErrorMessage, formValues } from "@/lib/admin/errors";
import { getAgentDependents } from "@/lib/admin/queries";
import { agentImagePath, agentImageUrl, managedAgentImagePath, removeImages, uploadImage } from "@/lib/admin/storage";
import type { AdminFormState } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/session";
import { isUuid } from "@/lib/queries/supabase/shared";
import { createClient } from "@/lib/supabase/server";
import { validateAgent, type AgentField } from "@/lib/validations/admin-agent";
import { isEmptyFile, validateImageFile, type ValidImage } from "@/lib/validations/image-upload";

/*
 * Server Actions behind /admin/agents. Admin-only: requireAdmin first, then the database and
 * Storage policies check every write again. Portraits go to the existing property-images bucket
 * under agents/<agent id>/, and agents.profile_image stores the public URL (as for seeded agents).
 */

type State = AdminFormState<AgentField | "photo">;

function revalidateCatalog() {
  revalidatePath("/", "layout");
}

/** The optional photo field: nothing chosen, a valid image, or an error. */
async function readPhoto(formData: FormData): Promise<{ image: ValidImage | null } | { error: string }> {
  const value = formData.get("photo");
  if (isEmptyFile(value)) return { image: null };
  const result = await validateImageFile(value);
  return result.ok ? { image: result.image } : { error: result.error };
}

export async function createAgent(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/agents/new");
  const values = formValues(formData);

  const result = validateAgent(formData);
  const photo = await readPhoto(formData);
  if (!result.ok || "error" in photo) {
    return {
      status: "error",
      fieldErrors: { ...(result.ok ? {} : result.fieldErrors), ...("error" in photo ? { photo: photo.error } : {}) },
      values,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("agents").insert(result.data).select("id").single();
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "add the agent"), values };

  // The photo's folder is the new agent's id, so it is uploaded after the row exists.
  let photoFailed = false;
  if (photo.image) {
    const path = agentImagePath(data.id, photo.image);
    const uploaded = await uploadImage(supabase, path, photo.image);
    const saved =
      uploaded &&
      !(await supabase.from("agents").update({ profile_image: agentImageUrl(path) }).eq("id", data.id)).error;
    if (uploaded && !saved) await removeImages(supabase, [path]);
    photoFailed = !saved;
  }

  revalidateCatalog();
  redirect(`/admin/agents/${data.id}?saved=${photoFailed ? "created-photo-failed" : "created"}`);
}

export async function updateAgent(agentId: string, _prev: State, formData: FormData): Promise<State> {
  await requireAdmin(isUuid(agentId) ? `/admin/agents/${agentId}` : "/admin/agents");
  const values = formValues(formData);
  if (!isUuid(agentId)) return { status: "error", message: "This agent could not be found.", values };

  const result = validateAgent(formData);
  const photo = await readPhoto(formData);
  if (!result.ok || "error" in photo) {
    return {
      status: "error",
      fieldErrors: { ...(result.ok ? {} : result.fieldErrors), ...("error" in photo ? { photo: photo.error } : {}) },
      values,
    };
  }

  const supabase = await createClient();
  const current = await supabase.from("agents").select("profile_image").eq("id", agentId).maybeSingle();
  if (current.error || !current.data) return { status: "error", message: "This agent no longer exists.", values };
  const oldImage = current.data.profile_image;

  let profileImage = oldImage;
  let newPath: string | null = null;
  if (photo.image) {
    newPath = agentImagePath(agentId, photo.image);
    if (!(await uploadImage(supabase, newPath, photo.image))) {
      return { status: "error", fieldErrors: { photo: "We couldn't upload the photo. Please try again." }, values };
    }
    profileImage = agentImageUrl(newPath);
  } else if (formData.get("removePhoto") === "on") {
    profileImage = null;
  }

  const { data, error } = await supabase
    .from("agents")
    .update({ ...result.data, profile_image: profileImage })
    .eq("id", agentId)
    .select("id");
  if (error || data.length === 0) {
    if (newPath) await removeImages(supabase, [newPath]);
    return {
      status: "error",
      message: error ? adminWriteErrorMessage(error, "save the changes") : "This agent no longer exists.",
      values,
    };
  }

  // Remove the previous portrait file only if /admin uploaded it for this agent.
  const oldPath = profileImage !== oldImage ? managedAgentImagePath(agentId, oldImage) : null;
  if (oldPath) await removeImages(supabase, [oldPath]);

  revalidateCatalog();
  return { status: "success", message: "Changes saved." };
}

/**
 * Deletes an agent. The schema blocks this while any property or viewing request still points at
 * the agent, so those are checked first and explained; enquiries just lose the agent link.
 */
export async function deleteAgent(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/agents");
  const agentId = String(formData.get("agentId") ?? "");
  if (!isUuid(agentId)) return { status: "error", message: "This agent could not be found." };

  const dependents = await getAgentDependents(agentId);
  if (dependents.properties > 0) {
    return {
      status: "error",
      message: `This agent still handles ${dependents.properties} ${dependents.properties === 1 ? "property" : "properties"}. Reassign or delete them first.`,
    };
  }
  if (dependents.bookings > 0) {
    return {
      status: "error",
      message: `This agent is named on ${dependents.bookings} viewing request(s), which keep their agent on record, so the agent can't be deleted.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("agents").delete().eq("id", agentId).select("id, profile_image");
  if (error) {
    const message =
      error.code === "23503"
        ? "This agent was just linked to a property or viewing request. Reload the page and try again."
        : adminWriteErrorMessage(error, "delete the agent");
    return { status: "error", message };
  }
  if (data.length === 0) return { status: "error", message: "This agent no longer exists, or you can't delete it." };

  const photoPath = managedAgentImagePath(agentId, data[0].profile_image);
  if (photoPath) await removeImages(supabase, [photoPath]);

  revalidateCatalog();
  redirect("/admin/agents?saved=deleted");
}
