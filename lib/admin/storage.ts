import "server-only";
import { randomUUID } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import { PROPERTY_IMAGES_BUCKET, publicStorageUrl } from "@/lib/supabase/storage";
import type { ValidImage } from "@/lib/validations/image-upload";

/*
 * Admin file operations on the existing property-images bucket (no other bucket is used):
 *   properties/<property id>/<random>.<ext>  — listing photos uploaded from /admin
 *   agents/<agent id>/<random>.<ext>         — agent portraits uploaded from /admin
 * Seeded files (property-N/…, agents/<name>.webp) keep their paths. Every call runs with the
 * admin's own session, so the admin-only Storage policies decide; no privileged key is involved.
 */

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export function propertyImagePath(propertyId: string, image: ValidImage): string {
  return `properties/${propertyId}/${randomUUID()}.${image.ext}`;
}

export function agentImagePath(agentId: string, image: ValidImage): string {
  return `agents/${agentId}/${randomUUID()}.${image.ext}`;
}

/** Uploads a validated image; never overwrites an existing file. True when it was stored. */
export async function uploadImage(supabase: ServerClient, path: string, image: ValidImage): Promise<boolean> {
  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).upload(path, image.file, {
    contentType: image.contentType,
    cacheControl: "31536000", // paths are unique per upload, so files never change in place
    upsert: false,
  });
  if (error) console.error("[admin] image upload failed", { name: error.name, message: error.message });
  return !error;
}

/**
 * Deletes files from the bucket. Failures are logged, not thrown: by the time this runs the
 * database rows are already gone, and a leftover file is harmless (nothing links to it).
 */
export async function removeImages(supabase: ServerClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(paths);
  if (error) console.error("[admin] image removal failed", { count: paths.length, message: error.message });
}

/** Public URL stored in agents.profile_image (the table has no storage_path column). */
export function agentImageUrl(path: string): string {
  return publicStorageUrl(PROPERTY_IMAGES_BUCKET, path);
}

/**
 * The bucket path of an agent portrait that /admin uploaded for this agent, from its public URL —
 * or null for anything else (seeded portraits, other URLs), which are never deleted automatically.
 */
export function managedAgentImagePath(agentId: string, profileImage: string | null): string | null {
  if (!profileImage) return null;
  const prefix = publicStorageUrl(PROPERTY_IMAGES_BUCKET, `agents/${agentId}`) + "/";
  if (!profileImage.startsWith(prefix)) return null;
  const file = profileImage.slice(prefix.length);
  return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(file) ? `agents/${agentId}/${file}` : null;
}
