-- EstateHub — Admin, step 2: admins manage properties, agents, property photos and their files
--
-- REQUIRES the step 1 admin migrations (public.is_admin()). Stops with a clear message otherwise.
--
-- Until now agents, properties and property_images were read-only for every client role, and the
-- property-images Storage bucket had no policies (files were managed from the Dashboard only).
-- This migration lets ADMINS — and only admins — write them. Everything is enforced here in the
-- database, independently of the /admin pages and Server Actions:
--
--   * Column-level grants to `authenticated` (never `anon`): the content columns can be inserted
--     and updated; id, created_at and updated_at cannot (updated_at stays trigger-maintained).
--     agents.user_id (linking an agent to a login) is deliberately NOT writable.
--   * RLS policies on those grants, each requiring (select public.is_admin()), which reads the
--     caller's own profiles.role. A normal user or agent has the grant but no passing policy, so
--     every write affects zero rows or is rejected.
--   * Storage: admin-only select/insert/update/delete policies on storage.objects, scoped to the
--     property-images bucket. Public photo URLs are unchanged (they do not go through RLS), the
--     bucket's 5 MB / JPEG-PNG-WebP limits still apply, and no other bucket is affected.
--   * Three helper functions, each refusing non-admins:
--       admin_property_dependents / admin_agent_dependents — counts shown before a delete (admins
--       cannot read other users' bookings or enquiries directly, and this does not change that);
--       reorder_property_images — renumbers a property's photos in one statement.
--
-- Unchanged: public SELECT on agents/properties/property_images, owner-only access to profiles,
-- bookings and contact_requests, the booking/contact insert rules, and the FK behaviour
-- (deleting a property cascades to its photos and bookings; an agent with properties or bookings
-- cannot be deleted).
--
-- Re-running is safe: grants are idempotent, policies are dropped and re-created, and functions
-- use create or replace.

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'public.is_admin() does not exist yet'
      using hint = 'Apply the admin step 1 migrations (20261003000000 and 20261003000100) first.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

grant insert (
    agent_id, title, description, property_type, listing_type, price, city, area_location,
    address, bedrooms, bathrooms, area, area_unit, year_built, parking_spaces, status,
    has_parking, has_garden, has_swimming_pool, has_security, has_gym, is_furnished,
    has_air_conditioning, has_backup_power
  ) on public.properties to authenticated;

grant update (
    agent_id, title, description, property_type, listing_type, price, city, area_location,
    address, bedrooms, bathrooms, area, area_unit, year_built, parking_spaces, status,
    has_parking, has_garden, has_swimming_pool, has_security, has_gym, is_furnished,
    has_air_conditioning, has_backup_power
  ) on public.properties to authenticated;

grant delete on public.properties to authenticated;

drop policy if exists "Admins can add properties" on public.properties;
create policy "Admins can add properties"
  on public.properties for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update properties" on public.properties;
create policy "Admins can update properties"
  on public.properties for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can delete properties"
  on public.properties for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- agents
-- ---------------------------------------------------------------------------

grant insert (full_name, title, email, phone, profile_image, bio, agency_name)
  on public.agents to authenticated;

grant update (full_name, title, email, phone, profile_image, bio, agency_name)
  on public.agents to authenticated;

grant delete on public.agents to authenticated;

drop policy if exists "Admins can add agents" on public.agents;
create policy "Admins can add agents"
  on public.agents for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update agents" on public.agents;
create policy "Admins can update agents"
  on public.agents for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete agents" on public.agents;
create policy "Admins can delete agents"
  on public.agents for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- property_images — a photo's file (storage_path) and property never change after upload;
-- only its caption, alt text and position can be edited.
-- ---------------------------------------------------------------------------

grant insert (property_id, image_url, storage_path, alt_text, label, sort_order)
  on public.property_images to authenticated;

grant update (alt_text, label, sort_order)
  on public.property_images to authenticated;

grant delete on public.property_images to authenticated;

drop policy if exists "Admins can add property images" on public.property_images;
create policy "Admins can add property images"
  on public.property_images for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update property images" on public.property_images;
create policy "Admins can update property images"
  on public.property_images for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete property images" on public.property_images;
create policy "Admins can delete property images"
  on public.property_images for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Storage: files in the property-images bucket (listing photos and agent portraits)
-- ---------------------------------------------------------------------------

drop policy if exists "Admins can list property-images files" on storage.objects;
create policy "Admins can list property-images files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));

drop policy if exists "Admins can upload property-images files" on storage.objects;
create policy "Admins can upload property-images files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images' and (select public.is_admin()));

drop policy if exists "Admins can update property-images files" on storage.objects;
create policy "Admins can update property-images files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()))
  with check (bucket_id = 'property-images' and (select public.is_admin()));

drop policy if exists "Admins can delete property-images files" on storage.objects;
create policy "Admins can delete property-images files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Helper functions (admin only)
-- ---------------------------------------------------------------------------

-- What deleting a property would affect. security definer so it can count bookings and enquiries
-- that RLS hides from the admin; it returns counts only, and only to admins.
create or replace function public.admin_property_dependents(p_property_id uuid)
returns table (images integer, bookings integer, active_bookings integer, contact_requests integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this' using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::integer from public.property_images i where i.property_id = p_property_id),
    (select count(*)::integer from public.bookings b where b.property_id = p_property_id),
    (select count(*)::integer from public.bookings b
      where b.property_id = p_property_id and b.status in ('pending', 'confirmed')),
    (select count(*)::integer from public.contact_requests c where c.property_id = p_property_id);
end;
$$;

-- What stands in the way of deleting an agent (properties and bookings both block it).
create or replace function public.admin_agent_dependents(p_agent_id uuid)
returns table (properties integer, bookings integer, contact_requests integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this' using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::integer from public.properties p where p.agent_id = p_agent_id),
    (select count(*)::integer from public.bookings b where b.agent_id = p_agent_id),
    (select count(*)::integer from public.contact_requests c where c.agent_id = p_agent_id);
end;
$$;

-- Sets a property's photo order to the order of p_image_ids (which must list exactly that
-- property's photos). One UPDATE statement, so the (property_id, sort_order) unique constraint
-- (deferrable, initially immediate) is checked once at the end, allowing positions to swap.
-- security invoker: the caller's own grants and RLS (admin update policy) still apply.
create or replace function public.reorder_property_images(p_property_id uuid, p_image_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this' using errcode = '42501';
  end if;

  if coalesce(cardinality(p_image_ids), 0) <> (select count(*) from public.property_images i
                                                where i.property_id = p_property_id)
     or cardinality(p_image_ids) <> (select count(distinct x) from unnest(p_image_ids) as x)
     or exists (select 1 from unnest(p_image_ids) as x
                 where not exists (select 1 from public.property_images i
                                    where i.id = x and i.property_id = p_property_id)) then
    raise exception 'The photo list does not match this property''s photos' using errcode = '22023';
  end if;

  update public.property_images i
     set sort_order = o.position - 1
    from unnest(p_image_ids) with ordinality as o(id, position)
   where i.id = o.id
     and i.property_id = p_property_id;
end;
$$;

revoke execute on function public.admin_property_dependents(uuid) from public, anon;
revoke execute on function public.admin_agent_dependents(uuid) from public, anon;
revoke execute on function public.reorder_property_images(uuid, uuid[]) from public, anon;
grant execute on function public.admin_property_dependents(uuid) to authenticated;
grant execute on function public.admin_agent_dependents(uuid) to authenticated;
grant execute on function public.reorder_property_images(uuid, uuid[]) to authenticated;
