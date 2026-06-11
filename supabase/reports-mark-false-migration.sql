-- ====================================================================
-- Aegis Call — Reports "Mark as False" moderation (parallel to SOS)
-- ====================================================================
-- Paste in Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to run more than once.
--
-- Adds the same moderation signal we have on sos_events to the reports
-- table, so officers can flag a clearly fake category-based report
-- (e.g. a prank Kebakaran or Kecelakaan post) and contribute to the
-- reporter's overall trust score.
-- ====================================================================

-- 1. Columns ---------------------------------------------------------
alter table public.reports
  add column if not exists marked_false_at  timestamptz,
  add column if not exists marked_false_by  uuid references auth.users(id) on delete set null;

-- 2. Index -----------------------------------------------------------
create index if not exists reports_user_marked_false_idx
  on public.reports(user_id, marked_false_at)
  where marked_false_at is not null;

-- 3. RLS: allow staff to UPDATE other users' reports ------------------
-- The existing reports_update_own policy only allows the reporter
-- themselves to update; without this companion policy, petugas/admin
-- can't set marked_false_at on someone else's row.
drop policy if exists reports_update_staff on public.reports;
create policy reports_update_staff on public.reports
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ====================================================================
-- DONE — verify in Dashboard:
--   - Table Editor → reports: marked_false_at + marked_false_by visible
--   - Database → Policies → reports: now lists reports_update_staff
-- ====================================================================
