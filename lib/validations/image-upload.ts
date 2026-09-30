/*
 * Checks for photos uploaded by admins, matching the property-images bucket's own limits
 * (supabase/migrations/20261001000000_property_images_bucket.sql): at most 5 MB, JPEG, PNG or
 * WebP. The browser-reported type is not trusted on its own: the file's first bytes must match it.
 */

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const ALT_TEXT_MAX = 300;
export const LABEL_MAX = 60;
export const IMAGE_TOO_LARGE = "That photo is larger than 5 MB. Please upload a smaller one.";

/**
 * Browser-side pre-check for the admin photo inputs: the size error for a chosen file over 5 MB,
 * else null. It only saves a pointless upload; the Server Action always validates again.
 */
export function imageTooLargeError(value: FormDataEntryValue | null): string | null {
  return value instanceof File && value.size > IMAGE_MAX_BYTES ? IMAGE_TOO_LARGE : null;
}

type ImageType = { contentType: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };

const SIGNATURES: { type: ImageType; matches: (b: Uint8Array) => boolean }[] = [
  { type: { contentType: "image/jpeg", ext: "jpg" }, matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: { contentType: "image/png", ext: "png" },
    matches: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => b[i] === byte),
  },
  {
    type: { contentType: "image/webp", ext: "webp" },
    // "RIFF" <size> "WEBP"
    matches: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
];

export type ValidImage = ImageType & { file: File };

/** A real, non-empty JPEG/PNG/WebP File of at most 5 MB, or a user-facing error. */
export async function validateImageFile(value: FormDataEntryValue | null): Promise<
  { ok: true; image: ValidImage } | { ok: false; error: string }
> {
  if (!(value instanceof File) || value.size === 0) return { ok: false, error: "Choose a photo to upload." };
  if (value.size > IMAGE_MAX_BYTES) return { ok: false, error: IMAGE_TOO_LARGE };

  const head = new Uint8Array(await value.slice(0, 12).arrayBuffer());
  const detected = SIGNATURES.find((signature) => signature.matches(head))?.type;
  if (!detected || (value.type && value.type !== detected.contentType)) {
    return { ok: false, error: "Upload a JPEG, PNG or WebP image." };
  }
  return { ok: true, image: { ...detected, file: value } };
}

/** True when the form's file input was left empty (browsers still send an empty File). */
export function isEmptyFile(value: FormDataEntryValue | null): boolean {
  return value === null || (value instanceof File && value.size === 0 && !value.name);
}

/** Alt text and caption for a listing photo, trimmed and length-checked. */
export function validatePhotoText(formData: FormData):
  | { ok: true; data: { alt_text: string; label: string | null } }
  | { ok: false; fieldErrors: Partial<Record<"alt_text" | "label", string>> } {
  const alt = String(formData.get("alt_text") ?? "").trim().replace(/\s+/g, " ");
  const label = String(formData.get("label") ?? "").trim().replace(/\s+/g, " ");
  const fieldErrors: Partial<Record<"alt_text" | "label", string>> = {};
  if (!alt) fieldErrors.alt_text = "Describe the photo for people using screen readers.";
  else if (alt.length > ALT_TEXT_MAX) fieldErrors.alt_text = `Keep the description under ${ALT_TEXT_MAX} characters.`;
  if (label.length > LABEL_MAX) fieldErrors.label = `Keep the caption under ${LABEL_MAX} characters.`;
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, data: { alt_text: alt, label: label || null } };
}
