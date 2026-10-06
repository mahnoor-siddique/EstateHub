"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminWriteErrorMessage, formValues } from "@/lib/admin/errors";
import { getPropertyDependents } from "@/lib/admin/queries";
import { managedPropertyImagePath, removeImages } from "@/lib/admin/storage";
import type { AdminFormState } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/session";
import { isUuid } from "@/lib/queries/supabase/shared";
import { createClient } from "@/lib/supabase/server";
import { parseStatus, validateProperty, type PropertyField } from "@/lib/validations/admin-property";

/*
 * Server Actions behind /admin/properties. Every action first calls requireAdmin (guests go to
 * login, everyone else gets a 404), validates all input, and writes with the admin's own Supabase
 * session — so the database's admin-only RLS policies check each write a second time. No
 * privileged key is used.
 */

type State = AdminFormState<PropertyField>;

/** Listings appear on the home page, /properties, detail pages and agent pages. */
function revalidateCatalog() {
  revalidatePath("/", "layout");
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function agentExists(supabase: ServerClient, agentId: string): Promise<boolean> {
  const { data, error } = await supabase.from("agents").select("id").eq("id", agentId).maybeSingle();
  return !error && Boolean(data);
}

const UNKNOWN_AGENT = "That agent no longer exists. Choose another agent.";

export async function createProperty(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/properties/new");
  const values = formValues(formData);

  const result = validateProperty(formData);
  if (!result.ok) return { status: "error", fieldErrors: result.fieldErrors, values };

  const supabase = await createClient();
  if (!(await agentExists(supabase, result.data.agent_id))) {
    return { status: "error", fieldErrors: { agent_id: UNKNOWN_AGENT }, values };
  }

  const { data, error } = await supabase.from("properties").insert(result.data).select("id").single();
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "add the property"), values };

  revalidateCatalog();
  redirect(`/admin/properties/${data.id}?saved=created`);
}

export async function updateProperty(propertyId: string, _prev: State, formData: FormData): Promise<State> {
  await requireAdmin(isUuid(propertyId) ? `/admin/properties/${propertyId}` : "/admin/properties");
  const values = formValues(formData);
  if (!isUuid(propertyId)) return { status: "error", message: "This property could not be found.", values };

  const result = validateProperty(formData);
  if (!result.ok) return { status: "error", fieldErrors: result.fieldErrors, values };

  const supabase = await createClient();
  if (!(await agentExists(supabase, result.data.agent_id))) {
    return { status: "error", fieldErrors: { agent_id: UNKNOWN_AGENT }, values };
  }

  // updated_at is maintained by the properties_set_updated_at trigger.
  const { data, error } = await supabase.from("properties").update(result.data).eq("id", propertyId).select("id");
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "save the changes"), values };
  if (data.length === 0) {
    return { status: "error", message: "This property no longer exists, or you can't edit it.", values };
  }

  revalidateCatalog();
  return { status: "success", message: "Changes saved." };
}

/** Quick status change from the properties list. */
export async function updatePropertyStatus(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/properties");
  const propertyId = String(formData.get("propertyId") ?? "");
  const status = parseStatus(formData.get("status"));
  if (!isUuid(propertyId) || !status) return { status: "error", message: "Choose a valid status." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("properties").update({ status }).eq("id", propertyId).select("id");
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "change the status") };
  if (data.length === 0) return { status: "error", message: "This property no longer exists." };

  revalidateCatalog();
  return { status: "success", message: "Status updated." };
}

/**
 * Deletes a property. Following the schema, its photos and viewing requests are deleted with it
 * (on delete cascade) and its enquiries keep their message but lose the property link. When it
 * has viewing requests, the admin must have confirmed exactly how many — so a request that
 * arrived after the dialog opened is never deleted without being seen. Photo files that /admin
 * uploaded to S3 are removed only after the rows are gone, and only if no other photo row still
 * uses them; older photos still in Supabase Storage keep their files.
 */
export async function deleteProperty(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/properties");
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!isUuid(propertyId)) return { status: "error", message: "This property could not be found." };

  const dependents = await getPropertyDependents(propertyId);
  const confirmedBookings = Number(formData.get("confirmedBookings") ?? "0");
  if (dependents.bookings > 0 && confirmedBookings !== dependents.bookings) {
    return {
      status: "error",
      message: `This property now has ${dependents.bookings} viewing request(s). Reload the page and review them before deleting.`,
    };
  }
  if (dependents.bookings > 0 && formData.get("acknowledge") !== "on") {
    return { status: "error", message: "Confirm that the viewing requests will be deleted." };
  }

  const supabase = await createClient();
  const images = await supabase.from("property_images").select("image_url").eq("property_id", propertyId);
  if (images.error) return { status: "error", message: adminWriteErrorMessage(images.error, "delete the property") };

  const { data, error } = await supabase.from("properties").delete().eq("id", propertyId).select("id");
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "delete the property") };
  if (data.length === 0) return { status: "error", message: "This property no longer exists, or you can't delete it." };

  const urls = images.data.map((row) => row.image_url).filter((url) => managedPropertyImagePath(propertyId, url));
  if (urls.length > 0) {
    const stillUsed = await supabase.from("property_images").select("image_url").in("image_url", urls);
    const keep = new Set((stillUsed.data ?? []).map((row) => row.image_url));
    // If that check fails, keep every file: a stray file is harmless, a missing one is not.
    if (!stillUsed.error) {
      const paths = urls.filter((url) => !keep.has(url)).map((url) => managedPropertyImagePath(propertyId, url));
      await removeImages(paths.filter((path): path is string => path !== null));
    }
  }

  revalidateCatalog();
  redirect("/admin/properties?saved=deleted");
}
