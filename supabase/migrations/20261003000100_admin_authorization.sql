-- EstateHub — Admin, step 1b: a single database check for "is the caller an admin?"
--
-- REQUIRES 20261003000000_admin_role.sql to have been applied first (it adds 'admin' to
-- public.user_role). If it has not, this migration stops with a clear message and changes nothing.
--
-- public.is_admin() answers from the caller's own profile row (auth.uid() comes from the verified
-- JWT; nothing the client sends is trusted). It is the foundation for future admin features:
-- admin RLS policies will be written as
--
--     create policy "Admins can ..." on public.<table> for <command>
--       to authenticated
--       using ((select public.is_admin()))
--
-- so every admin operation is enforced by the database, not only by hiding UI.
--
-- Security notes:
--   * security definer, so it can read profiles.role even from a policy on profiles itself
--     without RLS recursion. It returns only a boolean about the caller; it cannot be pointed at
--     another user.
--   * search_path is empty and every name is schema-qualified, so it cannot be hijacked.
--   * Only `authenticated` may execute it. Guests (anon) are never admins, so they get no access.
--   * plpgsql (not sql): Postgres checks a `language sql` body when the function is created, which
--     turns 'admin' into a user_role value right then — failing if the enum value is missing, or
--     if it was added in the same transaction (e.g. both admin migrations run in one SQL Editor
--     execution). A plpgsql body is only evaluated when called, by which time the value exists.
--
-- Re-running this file is safe: the guard is read-only, `create or replace` keeps one definition,
-- and the comment/revoke/grant statements produce the same end state every time.
--
-- No policies or grants on any table change in this step: public catalog reads, owner-only
-- reads of profiles/bookings/contact_requests, and the booking/contact insert rules stay exactly
-- as they were. No admin read/write policies exist yet.

do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_enum e
     where e.enumtypid = 'public.user_role'::regtype
       and e.enumlabel = 'admin'
  ) then
    raise exception 'public.user_role has no ''admin'' value yet'
      using hint = 'Apply supabase/migrations/20261003000000_admin_role.sql first, then re-run this migration.';
  end if;
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and p.role = 'admin'
  );
end;
$$;

comment on function public.is_admin() is
  'True when the calling user''s profile role is admin. Use in RLS policies for admin operations.';

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
