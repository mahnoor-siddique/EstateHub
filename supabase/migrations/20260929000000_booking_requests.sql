-- EstateHub — Phase 8: let signed-in users request property viewings
--
-- Until now the bookings table was read-only for clients (select own rows). This migration lets an
-- authenticated user insert a viewing request for themselves, and nothing more:
--
--   * Column-level grant: the client may only send user_id, property_id, booking_date,
--     booking_time, name, email, phone and message. agent_id, status, id and created_at are not
--     insertable, so a user cannot pick the agent or mark their own booking "confirmed".
--   * A BEFORE INSERT trigger fills agent_id from the property (the listing agent), forces
--     status = 'pending' and rejects properties that are not available for viewings.
--   * RLS: user_id must be the caller, and the date cannot be in the past (Pakistan time).
--   * Still no update/delete policies: changing or cancelling a booking is a later step.
--   * Duplicate slots are already blocked by bookings_unique_active_slot_idx.
--
-- The table structure itself is unchanged.

create function public.set_booking_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  listing_agent uuid;
  listing_status public.property_status;
begin
  -- Runs as the caller; properties are publicly readable, so no extra privileges are needed.
  select p.agent_id, p.status
    into listing_agent, listing_status
    from public.properties p
   where p.id = new.property_id;

  if listing_agent is null then
    raise exception 'Property % does not exist', new.property_id using errcode = '23503';
  end if;
  if listing_status <> 'available' then
    -- P0001 (raise_exception) is only ever raised here, so the app can tell this case apart.
    raise exception 'Property is not available for viewings' using errcode = 'P0001';
  end if;

  new.agent_id := listing_agent;
  new.status := 'pending';
  new.created_at := now();
  return new;
end;
$$;

revoke execute on function public.set_booking_defaults() from public, anon, authenticated;

create trigger bookings_set_defaults
  before insert on public.bookings
  for each row execute function public.set_booking_defaults();

grant insert (user_id, property_id, booking_date, booking_time, name, email, phone, message)
  on public.bookings to authenticated;

create policy "Users can request viewings for themselves"
  on public.bookings for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and booking_date >= (now() at time zone 'Asia/Karachi')::date
  );
