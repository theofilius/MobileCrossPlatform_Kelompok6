-- ====================================================================
-- Aegis Call — RESET
-- ====================================================================
-- Run this FIRST if you hit errors like "column X does not exist"
-- when running schema.sql. Drops all Aegis tables, types, and triggers
-- so schema.sql can re-create everything from scratch.
--
-- WARNING: this DELETES all data in these tables. Safe to run only
-- while the project is still empty / in setup.
-- ====================================================================

-- Drop triggers first (depend on tables)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists ec_demote_other_primary on public.emergency_contacts;

-- Drop tables (cascade removes dependent objects)
drop table if exists public.notifications cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.reports cascade;
drop table if exists public.emergency_contacts cascade;
drop table if exists public.profiles cascade;

-- Drop enum types
drop type if exists emergency_type cascade;
drop type if exists report_status cascade;
drop type if exists contact_priority cascade;
drop type if exists notif_type cascade;

-- Drop functions
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.demote_other_primary_contacts() cascade;

-- Note: Storage buckets are NOT dropped automatically (they may contain files).
-- If you want to also reset storage, run these manually:
-- delete from storage.objects where bucket_id in ('avatars', 'report-photos', 'report-audio');
-- delete from storage.buckets where id in ('avatars', 'report-photos', 'report-audio');
