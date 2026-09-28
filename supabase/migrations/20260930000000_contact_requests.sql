-- EstateHub — Phase 8: contact requests (guests and signed-in users)
--
-- Until now contact_requests was read-only for clients (a signed-in user could read their own
-- rows). This migration lets anyone submit an enquiry, and nothing more:
--
--   * Column-level grant: clients may only send property_id, agent_id, name, email, phone and
--     message. user_id is NOT insertable, so nobody can submit a request as another user; id and
--     created_at are not insertable either.
--   * A BEFORE INSERT trigger sets user_id from the caller's session (auth.uid(): the signed-in
--     user, or null for guests), fills agent_id from the property when a property is given, and
--     rejects an agent that does not match the property.
--   * RLS insert policies repeat the identity rule: guests (anon) insert only rows without a
--     user, signed-in users only rows with their own id.
--   * No new read access: anonymous visitors still cannot read any contact request, and signed-in
--     users can still only read their own. No update/delete policies.
--
-- The table structure itself is unchanged.

create function public.set_contact_request_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  listing_agent uuid;
begin
  -- The requester is whoever is calling, never a value from the client.
  new.user_id := auth.uid();
  new.created_at := now();

  if new.property_id is not null then
    -- Runs as the caller; properties are publicly readable, so no extra privileges are needed.
    select p.agent_id into listing_agent from public.properties p where p.id = new.property_id;
    if not found then
      raise exception 'Property % does not exist', new.property_id using errcode = '23503';
    end if;

    if new.agent_id is null then
      new.agent_id := listing_agent;
    elsif new.agent_id <> listing_agent then
      -- P0001 (raise_exception) is only raised here, so the app can tell this case apart.
      raise exception 'Agent does not handle this property' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.set_contact_request_defaults() from public, anon, authenticated;

create trigger contact_requests_set_defaults
  before insert on public.contact_requests
  for each row execute function public.set_contact_request_defaults();

grant insert (property_id, agent_id, name, email, phone, message)
  on public.contact_requests to anon, authenticated;

create policy "Guests can send contact requests"
  on public.contact_requests for insert
  to anon
  with check (user_id is null);

create policy "Users can send contact requests as themselves"
  on public.contact_requests for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
