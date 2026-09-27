-- EstateHub — Phase 7: create a profile for every new Supabase Auth user
--
-- The signup form sends the user's full name as auth metadata (options.data.full_name). This
-- trigger copies it, with the email, into public.profiles as soon as auth.users gets the row, so
-- the browser never needs insert rights on profiles.
--
-- Security notes:
--   * security definer lets the trigger write to profiles even though clients cannot.
--   * search_path is empty and every name is schema-qualified, so a caller cannot hijack it.
--   * role is never read from metadata (users control their own metadata); it always takes the
--     column default 'user'. Agent accounts are promoted by trusted server code/dashboard only.
--   * The name is trimmed, blank names become null, and it is cut to the column's 120-char limit
--     so a bad value can never make signup itself fail.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    left(new.email, 254),
    left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 120)
  );
  return new;
end;
$$;

-- Only the trigger should run this function, never the Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any accounts created before this migration.
insert into public.profiles (id, email, full_name)
select
  u.id,
  left(u.email, 254),
  left(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 120)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
