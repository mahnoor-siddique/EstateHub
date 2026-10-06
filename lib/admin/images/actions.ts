"use server";

import { revalidatePath } from "next/cache";
import { adminWriteErrorMessage } from "@/lib/admin/errors";
import { managedPropertyImagePath, propertyImagePath, removeImages, uploadImage } from "@/lib/admin/storage";
import type { AdminFormState } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/session";
import { isUuid } from "@/lib/queries/supabase/shared";
import { createClient } from "@/lib/supabase/server";
import { validateImageFile, validatePhotoText } from "@/lib/validations/image-upload";

/*
 * Server Actions for a property's photos on /admin/properties/[id]. Admin-only (requireAdmin, then
 * the database policies again). Files go to the AWS S3 image bucket; each property_images row
 * records the file's S3 URL in image_url and leaves storage_path null (that column is only set on
 * older photos still in Supabase Storage, whose files these actions never touch).
 */

type PhotoField = "photo" | "alt_text" | "label";
type State = AdminFormState<PhotoField>;
type ServerClient = Awaited<ReturnType<typeof createClient>>;

function revalidateProperty(propertyId: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/admin/properties/${propertyId}`);
}

async function nextSortOrder(supabase: ServerClient, propertyId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("property_images")
    .select("sort_order")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (error) return null;
  return data.length ? data[0].sort_order + 1 : 0;
}

/** Uploads one photo and adds it to the end of the property's gallery. */
export async function uploadPropertyImage(propertyId: string, _prev: State, formData: FormData): Promise<State> {
  await requireAdmin(isUuid(propertyId) ? `/admin/properties/${propertyId}` : "/admin/properties");
  const values = { alt_text: String(formData.get("alt_text") ?? ""), label: String(formData.get("label") ?? "") };
  if (!isUuid(propertyId)) return { status: "error", message: "This property could not be found.", values };

  const [file, text] = [await validateImageFile(formData.get("photo")), validatePhotoText(formData)];
  const fieldErrors = { ...(file.ok ? {} : { photo: file.error }), ...(text.ok ? {} : text.fieldErrors) };
  if (!file.ok || !text.ok) return { status: "error", fieldErrors, values };

  const supabase = await createClient();
  const property = await supabase.from("properties").select("id").eq("id", propertyId).maybeSingle();
  if (property.error || !property.data) {
    return { status: "error", message: "This property no longer exists.", values };
  }

  const path = propertyImagePath(propertyId, file.image);
  const imageUrl = await uploadImage(path, file.image);
  if (!imageUrl) {
    return { status: "error", message: "We couldn't upload the photo. Please try again.", values };
  }

  // Two uploads at once can pick the same position; try once more with a fresh one.
  let error = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const sortOrder = await nextSortOrder(supabase, propertyId);
    if (sortOrder === null) break;
    ({ error } = await supabase.from("property_images").insert({
      property_id: propertyId,
      image_url: imageUrl,
      storage_path: null,
      ...text.data,
      sort_order: sortOrder,
    }));
    if (!error || error.code !== "23505") break;
  }

  if (error) {
    await removeImages([path]); // don't leave an unreferenced file behind
    return { status: "error", message: adminWriteErrorMessage(error, "save the photo"), values };
  }

  revalidateProperty(propertyId);
  return { status: "success", message: "Photo uploaded." };
}

/** Updates a photo's alt text and caption. */
export async function updatePropertyImage(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/properties");
  const imageId = String(formData.get("imageId") ?? "");
  const values = { alt_text: String(formData.get("alt_text") ?? ""), label: String(formData.get("label") ?? "") };
  if (!isUuid(imageId)) return { status: "error", message: "This photo could not be found.", values };

  const text = validatePhotoText(formData);
  if (!text.ok) return { status: "error", fieldErrors: text.fieldErrors, values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_images")
    .update(text.data)
    .eq("id", imageId)
    .select("property_id");
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "save the photo details"), values };
  if (data.length === 0) return { status: "error", message: "This photo no longer exists.", values };

  revalidateProperty(data[0].property_id);
  return { status: "success", message: "Photo details saved." };
}

/** Moves a photo one place earlier or later in the gallery (the first photo is the cover). */
export async function movePropertyImage(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/properties");
  const imageId = String(formData.get("imageId") ?? "");
  const direction = formData.get("direction");
  if (!isUuid(imageId) || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "This photo could not be moved." };
  }

  const supabase = await createClient();
  const image = await supabase.from("property_images").select("property_id").eq("id", imageId).maybeSingle();
  if (image.error || !image.data) return { status: "error", message: "This photo no longer exists." };
  const propertyId = image.data.property_id;

  const all = await supabase
    .from("property_images")
    .select("id")
    .eq("property_id", propertyId)
    .order("sort_order");
  if (all.error) return { status: "error", message: adminWriteErrorMessage(all.error, "move the photo") };

  const ids = all.data.map((row) => row.id);
  const from = ids.indexOf(imageId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return { status: "idle" };
  [ids[from], ids[to]] = [ids[to], ids[from]];

  // One database statement renumbers every photo, so positions can swap safely.
  const { error } = await supabase.rpc("reorder_property_images", { p_property_id: propertyId, p_image_ids: ids });
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "move the photo") };

  revalidateProperty(propertyId);
  return { status: "success", message: "Photo order saved." };
}

/** Deletes a photo's row, then its S3 file (unless another row still uses that file). */
export async function deletePropertyImage(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin("/admin/properties");
  const imageId = String(formData.get("imageId") ?? "");
  if (!isUuid(imageId)) return { status: "error", message: "This photo could not be found." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_images")
    .delete()
    .eq("id", imageId)
    .select("property_id, image_url");
  if (error) return { status: "error", message: adminWriteErrorMessage(error, "delete the photo") };
  if (data.length === 0) return { status: "error", message: "This photo no longer exists." };

  const { property_id: propertyId, image_url: imageUrl } = data[0];
  const path = managedPropertyImagePath(propertyId, imageUrl);
  if (path) {
    const stillUsed = await supabase.from("property_images").select("id").eq("image_url", imageUrl).limit(1);
    if (!stillUsed.error && stillUsed.data.length === 0) await removeImages([path]);
  }

  revalidateProperty(propertyId);
  return { status: "success", message: "Photo deleted." };
}
