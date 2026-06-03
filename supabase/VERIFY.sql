-- ====================================================================
-- Aegis Call — Database verification
-- ====================================================================
-- Paste in Supabase SQL Editor. Each query should return at least the
-- expected rows. If something is missing, run the matching migration:
--
--   sos_events / sos_locations / sos_status     → supabase/sos-migration.sql
--   marked_false_*                              → supabase/sos-mark-false-migration.sql
--   emergency_contacts / notifications in pub   → supabase/contacts-realtime.sql
--   priority / assigned_to / updated_at in reports → (see note at bottom)
-- ====================================================================

-- 1) New SOS tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('sos_events', 'sos_locations');
-- Expected: 2 rows

-- 2) sos_events has the moderation columns (Phase 7CD)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sos_events'
  and column_name in ('marked_false_at', 'marked_false_by');
-- Expected: 2 rows

-- 3) profiles has community_siaga_opt_in (Phase 4)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'community_siaga_opt_in';
-- Expected: 1 row

-- 4) is_staff() helper function exists
select proname
from pg_proc
where proname = 'is_staff'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');
-- Expected: 1 row

-- 5) Realtime publication contains all the tables we subscribe to
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;
-- Expected at minimum: chat_messages, emergency_contacts, notifications,
--                       sos_events, sos_locations

-- 6) RLS is enabled on all our tables
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'emergency_contacts', 'reports',
    'notifications', 'chat_messages',
    'sos_events', 'sos_locations'
  )
order by tablename;
-- Expected: every row should have rowsecurity = true

-- ====================================================================
-- ⚠️ Pre-existing concern: the reports table.
-- ====================================================================
-- services/reportService.ts references columns `priority`, `assigned_to`,
-- and `updated_at` that ARE NOT in the original supabase/schema.sql.
-- If they were never added manually, the "Tangani Laporan" button in the
-- petugas dashboard will silently fail.
--
-- Check whether they exist:

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reports'
  and column_name in ('priority', 'assigned_to', 'updated_at')
order by column_name;
-- Expected (if app is to work): assigned_to, priority, updated_at (3 rows).
-- If you see less than 3, run the patch below.

-- ── PATCH (only run if the query above returns < 3 rows) ─────────────
-- Uncomment and execute:
--
-- do $$ begin
--   create type report_priority as enum ('low','medium','high','critical');
-- exception when duplicate_object then null; end $$;
--
-- alter table public.reports
--   add column if not exists priority    report_priority not null default 'medium',
--   add column if not exists assigned_to uuid references auth.users(id) on delete set null,
--   add column if not exists updated_at  timestamptz not null default now();
--
-- drop trigger if exists reports_set_updated_at on public.reports;
-- create trigger reports_set_updated_at
--   before update on public.reports
--   for each row execute procedure public.set_updated_at();
--
-- -- Also make reports realtime if you want petugas dashboard to live-refresh:
-- do $$ begin
--   alter publication supabase_realtime add table public.reports;
-- exception when duplicate_object then null; when others then null; end $$;
