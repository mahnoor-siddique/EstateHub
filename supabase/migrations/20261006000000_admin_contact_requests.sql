-- EstateHub — Admin, step 2C: admins can read every contact request
--
-- REQUIRES the admin step 1 migrations (public.is_admin()). Stops with a clear message otherwise.
--
-- Until now a contact request was readable only by the signed-in user who sent it. This adds one
-- policy so ADMINS can also read all of them for the /admin/contact-requests page. RLS combines
-- SELECT policies with OR, so users keep seeing exactly their own requests
-- ("Users can read their own contact requests", unchanged).
--
-- Nothing else changes: no new grants (authenticated already holds SELECT; anon holds nothing, so
-- guests still cannot read any request), no update or delete access for anyone, the insert rules
-- and contact_requests_set_defaults trigger are untouched, and the table structure is unchanged.
--
-- Re-running is safe: the policy is dropped and re-created.

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'public.is_admin() does not exist yet'
      using hint = 'Apply the admin step 1 migrations (20261003000000 and 20261003000100) first.';
  end if;
end;
$$;

drop policy if exists "Admins can read all contact requests" on public.contact_requests;
create policy "Admins can read all contact requests"
  on public.contact_requests for select
  to authenticated
  using ((select public.is_admin()));
