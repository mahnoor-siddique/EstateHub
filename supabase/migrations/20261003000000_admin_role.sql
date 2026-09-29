-- EstateHub — Admin, step 1a: add the `admin` role
--
-- Adds 'admin' to public.user_role alongside 'user' and 'agent'. Nothing else changes:
--
--   * Existing profiles keep their role. New signups still get the column default 'user', and
--     handle_new_user never reads a role from signup metadata, so nobody can sign up as an admin.
--   * Clients still have no insert/update/delete privilege on public.profiles, so a user cannot
--     promote themselves. An admin is promoted only with a manual, privileged SQL update (Supabase
--     Dashboard SQL editor), never by the app.
--
-- Run this file ON ITS OWN, before 20261003000100_admin_authorization.sql. Postgres does not let a
-- new enum value be used in the same transaction that adds it, so nothing here uses 'admin' as a
-- value — the only statement is the one that adds it.
--
-- Re-running it is safe: `if not exists` makes it a no-op once 'admin' exists. Existing 'user'
-- and 'agent' values, their order and every profile row are untouched.

alter type public.user_role add value if not exists 'admin';
