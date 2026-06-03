-- ====================================================================
-- Aegis Call — SOS "Mark as False" + Trust Score (Phase 7C/D)
-- ====================================================================
-- Paste in Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to run more than once.
--
-- Adds:
--   - sos_events.marked_false_at  (timestamptz, nullable)
--   - sos_events.marked_false_by  (uuid → auth.users, nullable)
--   - RLS policy so only staff can set those columns
--
-- We deliberately do NOT add a 'false' value to sos_status. The lifecycle
-- enum already encodes "what state is this SOS in"; mark-as-false is a
-- separate moderation signal on top of cancelled/resolved.
-- ====================================================================

alter table public.sos_events
  add column if not exists marked_false_at  timestamptz,
  add column if not exists marked_false_by  uuid references auth.users(id) on delete set null;

-- Trust score read path: count of all + false per user. Reuses the existing
-- sos_events_select_authenticated policy so any authenticated client can
-- aggregate. No additional policy needed for SELECT.

-- WRITE path: only staff can flip the flag, via the existing
-- sos_events_update_staff policy (added in Phase 1 migration). No extra
-- check is needed here — the column is on the same table.

-- Helpful index for trust-score lookups by user.
create index if not exists sos_events_user_marked_false_idx
  on public.sos_events(user_id, marked_false_at)
  where marked_false_at is not null;

-- ====================================================================
-- DONE — verify:
--   - sos_events table now has two new columns visible in Table Editor.
--   - Try inserting a fake row as a non-staff user; the mark_false columns
--     should remain null because the UI can't reach them (and even if it
--     could, RLS update policy requires is_staff()).
-- ====================================================================
