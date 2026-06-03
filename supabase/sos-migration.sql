-- ====================================================================
-- Aegis Call — SOS Migration (Phase 1)
-- ====================================================================
-- Paste this in Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to run more than once.
-- Adds:
--   - enum sos_status
--   - tables sos_events, sos_locations
--   - column profiles.community_siaga_opt_in
--   - helper function is_staff()
--   - RLS policies for new tables
--   - triggers (updated_at, auto-stamp status timestamps)
--   - realtime publication membership
-- ====================================================================

-- 1. ENUM ------------------------------------------------------------
do $$ begin
  create type sos_status as enum ('active', 'acknowledged', 'responding', 'resolved', 'cancelled');
exception when duplicate_object then null; end $$;

-- 2. Profiles column -------------------------------------------------
alter table public.profiles
  add column if not exists community_siaga_opt_in boolean not null default false;

-- 3. sos_events ------------------------------------------------------
create table if not exists public.sos_events (
  id               uuid         primary key default gen_random_uuid(),
  user_id          uuid         not null references auth.users(id) on delete cascade,
  status           sos_status   not null default 'active',
  current_lat      numeric(10, 8),
  current_lng      numeric(11, 8),
  started_at       timestamptz  not null default now(),
  acknowledged_at  timestamptz,
  resolved_at      timestamptz,
  cancelled_at     timestamptz,
  handled_by       uuid         references auth.users(id) on delete set null,
  note             text,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);

do $$ begin
  alter table public.sos_events
    add constraint sos_events_user_id_profiles_fk
    foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- 4. sos_locations ---------------------------------------------------
create table if not exists public.sos_locations (
  id           uuid          primary key default gen_random_uuid(),
  sos_id       uuid          not null references public.sos_events(id) on delete cascade,
  latitude     numeric(10, 8) not null,
  longitude    numeric(11, 8) not null,
  accuracy     numeric,
  recorded_at  timestamptz   not null default now()
);

-- 5. Indexes ---------------------------------------------------------
create index if not exists sos_events_status_started_at_idx
  on public.sos_events(status, started_at desc);

create index if not exists sos_events_user_id_started_at_idx
  on public.sos_events(user_id, started_at desc);

create unique index if not exists sos_events_one_open_per_user_idx
  on public.sos_events(user_id)
  where status in ('active', 'acknowledged', 'responding');

create index if not exists sos_locations_sos_recorded_at_idx
  on public.sos_locations(sos_id, recorded_at desc);

-- 6. RLS -------------------------------------------------------------
alter table public.sos_events    enable row level security;
alter table public.sos_locations enable row level security;

-- 6a. Helper: is the current user a petugas/admin?
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('petugas', 'admin')
  );
$$;

revoke execute on function public.is_staff() from public;
grant  execute on function public.is_staff() to authenticated;

-- 6b. sos_events policies
drop policy if exists sos_events_select_authenticated on public.sos_events;
create policy sos_events_select_authenticated on public.sos_events
  for select to authenticated using (true);

drop policy if exists sos_events_insert_own on public.sos_events;
create policy sos_events_insert_own on public.sos_events
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists sos_events_update_own on public.sos_events;
create policy sos_events_update_own on public.sos_events
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists sos_events_update_staff on public.sos_events;
create policy sos_events_update_staff on public.sos_events
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- 6c. sos_locations policies
drop policy if exists sos_locations_select_authenticated on public.sos_locations;
create policy sos_locations_select_authenticated on public.sos_locations
  for select to authenticated using (true);

drop policy if exists sos_locations_insert_own on public.sos_locations;
create policy sos_locations_insert_own on public.sos_locations
  for insert to authenticated
  with check (
    exists (
      select 1 from public.sos_events
      where id = sos_id and user_id = auth.uid()
    )
  );

-- 7. Triggers --------------------------------------------------------
-- 7a. updated_at (reuses existing set_updated_at function from main schema)
drop trigger if exists sos_events_set_updated_at on public.sos_events;
create trigger sos_events_set_updated_at
  before update on public.sos_events
  for each row execute procedure public.set_updated_at();

-- 7b. Auto-stamp lifecycle timestamps when status transitions.
create or replace function public.sos_stamp_status_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'acknowledged' and old.acknowledged_at is null then
      new.acknowledged_at := now();
    end if;
    if new.status = 'resolved' and old.resolved_at is null then
      new.resolved_at := now();
    end if;
    if new.status = 'cancelled' and old.cancelled_at is null then
      new.cancelled_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sos_events_stamp_status on public.sos_events;
create trigger sos_events_stamp_status
  before update on public.sos_events
  for each row execute procedure public.sos_stamp_status_change();

-- 8. Realtime --------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.sos_events;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.sos_locations;
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- ====================================================================
-- DONE — verify in Dashboard:
--   - Table Editor: sos_events, sos_locations visible
--   - Database → Policies: 4 policies on sos_events, 2 on sos_locations
--   - Database → Publications → supabase_realtime: sos_events + sos_locations listed
-- ====================================================================
