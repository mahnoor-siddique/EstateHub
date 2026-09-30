-- EstateHub — Admin, step 2D: admins list accounts and change their application role
--
-- REQUIRES the admin step 1 migrations (public.is_admin()). Stops with a clear message otherwise.
--
-- Until now a profile was readable only by its owner, and no client could change any profile. This
-- adds, for ADMINS only:
--
--   * Read access to every profile (id, full_name, email, role, created_at — the table holds no
--     secrets; passwords and tokens live in auth.users, which is not touched here). RLS combines
--     SELECT policies with OR, so users keep seeing exactly their own profile.
--   * Update access to ONE column: role. The column-level grant means no one — admin included —
--     can change a profile's id, name, email or created_at through the API. A normal user holds the
--     column grant but no passing policy, so their updates (including promoting themselves) affect
--     zero rows.
--   * A guard trigger: through the API, an admin can never remove their OWN admin role (so the app
--     can't be left without the admin who is using it). Requests with no signed-in user — the
--     Supabase Dashboard SQL editor, migrations — are not affected, so the documented manual
--     promotion/demotion steps keep working.
--
-- Unchanged: auth.users, the on_auth_user_created / handle_new_user signup trigger (new accounts
-- are always 'user'), the user_role enum, and every other table.
--
-- Re-running is safe: the grant is idempotent, policies/trigger are dropped and re-created, and the
-- function uses create or replace.

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'public.is_admin() does not exist yet'
      using hint = 'Apply the admin step 1 migrations (20261003000000 and 20261003000100) first.';
  end if;
end;
$$;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

grant update (role) on public.profiles to authenticated;

drop policy if exists "Admins can change roles" on public.profiles;
create policy "Admins can change roles"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Blocks an API caller from demoting themselves out of the admin role.
create or replace function public.prevent_self_admin_removal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin'
     and new.role is distinct from 'admin'
     and old.id = auth.uid() then
    -- P0001 is raised only here, so the app can tell this case apart.
    raise exception 'You cannot remove your own admin access' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_self_admin_removal() from public, anon, authenticated;

drop trigger if exists profiles_prevent_self_admin_removal on public.profiles;
create trigger profiles_prevent_self_admin_removal
  before update of role on public.profiles
  for each row execute function public.prevent_self_admin_removal();
