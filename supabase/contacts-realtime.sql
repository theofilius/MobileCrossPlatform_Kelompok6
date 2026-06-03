-- ====================================================================
-- Aegis Call — Add emergency_contacts to realtime publication
-- ====================================================================
-- Paste in Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to re-run.
--
-- After this, contactsService can pick up changes from other devices
-- (e.g. user adds a contact on phone A and it appears on phone B
-- without manual refresh).
-- ====================================================================

do $$
begin
  alter publication supabase_realtime add table public.emergency_contacts;
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- (Optional but recommended for Phase 6 step 2 — notifications service):
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when others then null;
end $$;
