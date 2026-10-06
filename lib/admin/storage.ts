import "server-only";
import { randomUUID } from "node:crypto";
import { deleteFromS3, uploadToS3 } from "@/lib/aws/upload";
import { s3KeyFromUrl } from "@/lib/aws/urls";
import type { ValidImage } from "@/lib/validations/image-upload";

/*
 * Admin file operations on the AWS S3 image bucket (AWS_S3_BUCKET), always from server code:
 *   properties/<property id>/<random>.<ext>  — listing photos uploaded from /admin
 *   agents/<agent id>/<random>.<ext>         — agent portraits uploaded from /admin
 * The database stores each file's S3 URL (property_images.image_url, agents.profile_image).
 * Older photos still live in Supabase Storage until they are migrated; nothing here uploads to
 * or deletes from Supabase Storage.
 */

const UPLOADED_FILE = "[0-9a-f-]{36}\\.(jpg|png|webp)";

export function propertyImagePath(propertyId: string, image: ValidImage): string {
  return `properties/${propertyId}/${randomUUID()}.${image.ext}`;
}

export function agentImagePath(agentId: string, image: ValidImage): string {
  return `agents/${agentId}/${randomUUID()}.${image.ext}`;
}

/** Uploads a validated image to S3. Returns the URL to store in the database, or null on failure. */
export async function uploadImage(path: string, image: ValidImage): Promise<string | null> {
  try {
    return await uploadToS3(path, Buffer.from(await image.file.arrayBuffer()), image.contentType);
  } catch (error) {
    const { name, message } = error instanceof Error ? error : { name: "Error", message: String(error) };
    console.error("[admin] image upload failed", { name, message });
    return null;
  }
}

/**
 * Deletes files from the S3 bucket. Failures are logged, not thrown: by the time this runs the
 * database rows are already gone, and a leftover file is harmless (nothing links to it).
 */
export async function removeImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    await deleteFromS3(paths);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[admin] image removal failed", { count: paths.length, message });
  }
}

/** The S3 key behind a stored URL if it is a file /admin uploaded into `folder`, otherwise null. */
function managedImagePath(folder: string, url: string | null): string | null {
  const key = url ? s3KeyFromUrl(url) : null;
  if (!key || !key.startsWith(`${folder}/`)) return null;
  return new RegExp(`^${UPLOADED_FILE}$`).test(key.slice(folder.length + 1)) ? key : null;
}

/**
 * The S3 key of a listing photo that /admin uploaded for this property, from its image_url — or
 * null for anything else (photos still in Supabase Storage, other URLs), which are never deleted.
 */
export function managedPropertyImagePath(propertyId: string, imageUrl: string | null): string | null {
  return managedImagePath(`properties/${propertyId}`, imageUrl);
}

/**
 * The S3 key of an agent portrait that /admin uploaded for this agent, from its profile_image — or
 * null for anything else (portraits still in Supabase Storage, other URLs), which are never deleted.
 */
export function managedAgentImagePath(agentId: string, profileImage: string | null): string | null {
  return managedImagePath(`agents/${agentId}`, profileImage);
}
