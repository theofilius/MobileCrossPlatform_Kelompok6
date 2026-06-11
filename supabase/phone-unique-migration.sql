-- ====================================================================
-- Aegis Call — Phone uniqueness check (pre-signup)
-- ====================================================================
-- Paste in Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to re-run.
--
-- Adds a SECURITY DEFINER function so the unauthenticated signup
-- screen can ask "is this phone already taken?" without exposing the
-- profiles table to anonymous SELECT. The function only returns a
-- boolean — no profile data leaks.
-- ====================================================================

create or replace function public.phone_exists(phone_to_check text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles
    where phone = phone_to_check
  );
$$;

-- Lock down execute, then explicitly grant to the API roles. anon is
-- required because signup happens before any session exists.
revoke execute on function public.phone_exists(text) from public;
grant  execute on function public.phone_exists(text) to anon;
grant  execute on function public.phone_exists(text) to authenticated;

-- ====================================================================
-- DONE — verify:
--
--   select public.phone_exists('+628123456789');
--   -- → false (or true if that number is actually registered)
-- ====================================================================
