-- EstateHub — contact requests require a signed-in user
--
-- Contacting an agent now needs an account, like booking a viewing. The /contact page and the
-- sendContactRequest Server Action already require login; this closes the same door at the
-- database, so a guest cannot insert through the Supabase API with the public key either.
--
--   * anon loses its insert grant and insert policy on contact_requests.
--   * Signed-in users are unchanged: they insert as themselves (the trigger sets user_id) and read
--     only their own rows.
--   * Existing guest rows (user_id is null) are kept as they are.

drop policy "Guests can send contact requests" on public.contact_requests;

revoke insert on public.contact_requests from anon;
