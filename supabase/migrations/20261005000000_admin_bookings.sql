-- EstateHub — Admin, step 2B: admins review all viewing requests and change their status
--
-- REQUIRES the admin step 1 migrations (public.is_admin()). Stops with a clear message otherwise.
--
-- Until now bookings were readable only by their owner and nobody could update them. This adds,
-- for ADMINS only:
--
--   * Read access to every booking. RLS combines SELECT policies with OR, so users keep seeing
--     exactly their own bookings (policy "Users can read their own bookings", unchanged) and admins
--     additionally see all of them.
--   * Update access to ONE column: status. The column-level grant means no one — admin included —
--     can change a booking's user, property, agent, date, time, contact details, message or
--     created_at through the API. The policy limits even status changes to admins; a normal user
--     holds the column grant but no passing policy, so their updates affect zero rows.
--
-- Unchanged: the owner-only insert rule and bookings_set_defaults trigger (new requests are always
-- pending), bookings_unique_active_slot_idx (a slot can hold only one non-cancelled booking per
-- user — so re-opening a cancelled booking whose slot was taken again fails with 23505), and there
-- is still no delete access for anyone.
--
-- Re-running is safe: the grant is idempotent and policies are dropped and re-created.

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'public.is_admin() does not exist yet'
      using hint = 'Apply the admin step 1 migrations (20261003000000 and 20261003000100) first.';
  end if;
end;
$$;

drop policy if exists "Admins can read all bookings" on public.bookings;
create policy "Admins can read all bookings"
  on public.bookings for select
  to authenticated
  using ((select public.is_admin()));

grant update (status) on public.bookings to authenticated;

drop policy if exists "Admins can update booking status" on public.bookings;
create policy "Admins can update booking status"
  on public.bookings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
