-- EstateHub — Phase 9: Supabase Storage bucket for property photos
--
-- Creates the public `property-images` bucket that listing photos will be served from (the
-- property_images table records each photo's storage_path). Nothing else changes:
--
--   * Public bucket: anyone can fetch a photo by its public URL
--     (/storage/v1/object/public/property-images/<path>), exactly as listing photos are public
--     today. Public URLs do not go through storage.objects RLS.
--   * Limits enforced by Storage on every upload: at most 5 MB per file, and only JPEG, PNG or
--     WebP images (the optimised photos will be WebP, roughly 100–400 KB each).
--   * No policies are added on storage.objects, and RLS stays on there. So the anon and
--     authenticated roles (the website's visitors and users) cannot upload, replace, delete or
--     even list files in this bucket. Photos are managed only from the Supabase Dashboard, which
--     uses privileged access; no secret or service-role key is involved in the app.
--   * The property_images table and all other tables are untouched.
--
-- Re-running it is safe: an existing bucket with this id is reset to these settings.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880, -- 5 MB in bytes
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
