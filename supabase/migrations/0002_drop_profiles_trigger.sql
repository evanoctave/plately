-- =============================================================================
-- 0002_drop_profiles_trigger — remove orphaned new-user trigger
-- =============================================================================
-- A leftover `handle_new_user` trigger (from a Supabase quickstart template)
-- inserted every new auth user into `public.profiles`. That table never existed
-- in this project, so the insert failed and GoTrue returned "Database error
-- saving new user" for ALL sign-ups (email, Apple, Google). The app keys all
-- sync on auth.users.id directly and has no use for a profiles table.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
