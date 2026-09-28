import { getSupabaseEnv } from "@/lib/supabase/env";

/*
 * Supabase Storage helpers. Listing photos live in the public `property-images` bucket
 * (migration 20261001000000_property_images_bucket.sql); property_images.storage_path holds each
 * photo's path inside it, e.g. "property-1/main.webp".
 */

export const PROPERTY_IMAGES_BUCKET = "property-images";

/**
 * Public URL of an object in a public bucket — the same URL supabase-js getPublicUrl() returns,
 * built locally (no network call, no client needed). Each path segment is URL-encoded.
 */
export function publicStorageUrl(bucket: string, path: string): string {
  const base = getSupabaseEnv().url.replace(/\/+$/, "");
  const encodedPath = path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/** Public URL of a listing photo from its storage_path. */
export function propertyImageUrl(storagePath: string): string {
  return publicStorageUrl(PROPERTY_IMAGES_BUCKET, storagePath);
}
