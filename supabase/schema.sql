-- ====================================================================
-- Aegis Call — Final Supabase Schema
-- ====================================================================
-- Generated from full project scan (see analysis):
--   profiles            → AuthContext + personal-info
--   emergency_contacts  → contactsService + emergency-contacts screen
--   reports             → reportService + report-form/community/history/detail
--   notifications       → notificationsService + 4 screens that trigger it
--   chat_messages       → chatService + chat screen
--
-- All tables use UUID PK, auth.users for identity, RLS enabled.
-- Storage buckets: avatars, report-photos, report-audio.
-- Idempotent: safe to re-run.
-- ====================================================================

-- ====================================================================
-- 1. ENUM TYPES
-- ====================================================================
do $$ begin
  create type emergency_type as enum ('fire', 'accident', 'crime', 'disaster', 'medical', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending', 'responded', 'resolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_priority as enum ('primary', 'secondary');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notif_type as enum ('sos', 'call', 'contact', 'security', 'permission');
exception when duplicate_object then null; end $$;

-- SOS lifecycle: active → acknowledged → responding → resolved | cancelled.
-- cancelled can come from any earlier state (user cancels);
-- resolved is the terminal success state after responding.
do $$ begin
  create type sos_status as enum ('active', 'acknowledged', 'responding', 'resolved', 'cancelled');
exception when duplicate_object then null; end $$;

-- ====================================================================
-- 2. TABLES
-- ====================================================================

-- 2.1 profiles — extends auth.users with display fields
-- role: 'user' (default, set automatically on signup), 'petugas', or 'admin'.
-- Admin/petugas accounts are created manually via Supabase Auth dashboard
-- and their role updated by hand in this table.
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  name        text        not null,
  phone       text,
  email       text,
  photo_uri   text,
  role        text        not null default 'user'
              check (role in ('user', 'petugas', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- For tables created before the role column existed, add it idempotently.
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'petugas', 'admin'));

-- Komunitas Siaga opt-in: when true, this user receives in-app alerts for
-- SOS events that fire within ~5 km of their last known location. Default
-- off so users explicitly consent before becoming an alert receiver.
alter table public.profiles
  add column if not exists community_siaga_opt_in boolean not null default false;

-- 2.2 emergency_contacts — per-user contact list
create table if not exists public.emergency_contacts (
  id            uuid              primary key default gen_random_uuid(),
  user_id       uuid              not null references auth.users(id) on delete cascade,
  name          text              not null,
  relationship  text              not null,
  phone         text              not null,
  priority      contact_priority  not null default 'secondary',
  created_at    timestamptz       not null default now()
);

-- 2.3 reports — emergency reports (community-visible)
create table if not exists public.reports (
  id           uuid            primary key default gen_random_uuid(),
  user_id      uuid            references auth.users(id) on delete set null,
  type         emergency_type  not null,
  description  text            not null,
  latitude     numeric(10, 8),
  longitude    numeric(11, 8),
  address      text,
  photo_url    text,
  audio_url    text,
  status       report_status   not null default 'pending',
  created_at   timestamptz     not null default now()
);

-- 2.4 notifications — per-user app alerts
create table if not exists public.notifications (
  id          uuid         primary key default gen_random_uuid(),
  user_id     uuid         not null references auth.users(id) on delete cascade,
  type        notif_type   not null,
  title       text         not null,
  body        text         not null,
  read        boolean      not null default false,
  created_at  timestamptz  not null default now()
);

-- 2.5 chat_messages — community chat (room-based, denormalized user_name)
create table if not exists public.chat_messages (
  id          uuid         primary key default gen_random_uuid(),
  room_id     text         not null default 'general',
  user_id     uuid         not null references auth.users(id) on delete cascade,
  user_name   text         not null,
  content     text         not null,
  created_at  timestamptz  not null default now()
);

-- 2.6 sos_events — one row per SOS button press. current_lat/lng hold the
-- latest known position (updated by the user device every 5s while active);
-- the full trail lives in sos_locations.
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

-- Explicit FK to profiles so PostgREST can embed reporter info in one query.
-- (FK to auth.users above gives cascade-on-delete; this one is the embed hint.)
do $$ begin
  alter table public.sos_events
    add constraint sos_events_user_id_profiles_fk
    foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- 2.7 sos_locations — append-only trail of GPS pings for one SOS event.
create table if not exists public.sos_locations (
  id           uuid          primary key default gen_random_uuid(),
  sos_id       uuid          not null references public.sos_events(id) on delete cascade,
  latitude     numeric(10, 8) not null,
  longitude    numeric(11, 8) not null,
  accuracy     numeric,
  recorded_at  timestamptz   not null default now()
);

-- ====================================================================
-- 3. INDEXES (for the queries the app actually runs)
-- ====================================================================
create index if not exists emergency_contacts_user_id_idx
  on public.emergency_contacts(user_id);

create index if not exists emergency_contacts_user_priority_idx
  on public.emergency_contacts(user_id, priority);

create index if not exists reports_created_at_idx
  on public.reports(created_at desc);

create index if not exists reports_user_id_created_at_idx
  on public.reports(user_id, created_at desc);

create index if not exists reports_type_idx
  on public.reports(type);

create index if not exists chat_messages_room_created_at_idx
  on public.chat_messages(room_id, created_at desc);

create index if not exists notifications_user_created_at_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id)
  where read = false;

create index if not exists profiles_role_idx on public.profiles(role);

-- SOS indexes — main read paths are "open SOS feed for petugas" and "trail by sos_id".
create index if not exists sos_events_status_started_at_idx
  on public.sos_events(status, started_at desc);

create index if not exists sos_events_user_id_started_at_idx
  on public.sos_events(user_id, started_at desc);

-- Enforce at most one in-progress SOS per user (active/acknowledged/responding).
-- The same user can have many resolved/cancelled rows in history.
create unique index if not exists sos_events_one_open_per_user_idx
  on public.sos_events(user_id)
  where status in ('active', 'acknowledged', 'responding');

create index if not exists sos_locations_sos_recorded_at_idx
  on public.sos_locations(sos_id, recorded_at desc);

-- ====================================================================
-- 4. ROW LEVEL SECURITY — enable on all tables
-- ====================================================================
alter table public.profiles            enable row level security;
alter table public.emergency_contacts  enable row level security;
alter table public.reports             enable row level security;
alter table public.notifications       enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.sos_events          enable row level security;
alter table public.sos_locations       enable row level security;

-- Helper: is the current auth.uid() a petugas/admin? Used by RLS policies
-- that grant write access to staff (e.g. petugas changing an SOS status on
-- behalf of another user). SECURITY DEFINER so the profile lookup bypasses
-- the profiles_select_own policy without exposing other profile fields.
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

-- ====================================================================
-- 5. RLS POLICIES
-- ====================================================================

-- 5.1 profiles — user reads & writes only own row
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Block authenticated/anon from updating the role column.
-- Row policy still allows updating name/phone/email/photo_uri.
-- Role can only be changed by the service role (e.g. via Supabase dashboard).
revoke update (role) on public.profiles from authenticated;
revoke update (role) on public.profiles from anon;

-- 5.2 emergency_contacts — full CRUD on own rows only
drop policy if exists ec_select_own on public.emergency_contacts;
create policy ec_select_own on public.emergency_contacts
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists ec_insert_own on public.emergency_contacts;
create policy ec_insert_own on public.emergency_contacts
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists ec_update_own on public.emergency_contacts;
create policy ec_update_own on public.emergency_contacts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists ec_delete_own on public.emergency_contacts;
create policy ec_delete_own on public.emergency_contacts
  for delete to authenticated
  using (auth.uid() = user_id);

-- 5.3 reports
-- All authenticated can SELECT (community feed is public among users)
-- Insert/update/delete only by owner
drop policy if exists reports_select_authenticated on public.reports;
create policy reports_select_authenticated on public.reports
  for select to authenticated
  using (true);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists reports_update_own on public.reports;
create policy reports_update_own on public.reports
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists reports_delete_own on public.reports;
create policy reports_delete_own on public.reports
  for delete to authenticated
  using (auth.uid() = user_id);

-- 5.4 notifications — own rows only
drop policy if exists notif_select_own on public.notifications;
create policy notif_select_own on public.notifications
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists notif_insert_own on public.notifications;
create policy notif_insert_own on public.notifications
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists notif_update_own on public.notifications;
create policy notif_update_own on public.notifications
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists notif_delete_own on public.notifications;
create policy notif_delete_own on public.notifications
  for delete to authenticated
  using (auth.uid() = user_id);

-- 5.5 chat_messages — all authenticated can read; send only as self
drop policy if exists chat_select_authenticated on public.chat_messages;
create policy chat_select_authenticated on public.chat_messages
  for select to authenticated
  using (true);

drop policy if exists chat_insert_own on public.chat_messages;
create policy chat_insert_own on public.chat_messages
  for insert to authenticated
  with check (auth.uid() = user_id);

-- 5.6 sos_events
-- SELECT: every authenticated user (staff need the full feed; opt-in
--   Komunitas Siaga users need to see nearby events to compute distance).
-- INSERT: only as self (auth.uid() = user_id).
-- UPDATE: owner (to cancel their own SOS) OR staff (to change status).
drop policy if exists sos_events_select_authenticated on public.sos_events;
create policy sos_events_select_authenticated on public.sos_events
  for select to authenticated
  using (true);

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

-- No DELETE policy — SOS history is kept for audit. Service role can purge
-- via the Supabase dashboard when needed.

-- 5.7 sos_locations
-- SELECT: every authenticated user (mirrors sos_events visibility).
-- INSERT: only by the owner of the parent SOS event.
drop policy if exists sos_locations_select_authenticated on public.sos_locations;
create policy sos_locations_select_authenticated on public.sos_locations
  for select to authenticated
  using (true);

drop policy if exists sos_locations_insert_own on public.sos_locations;
create policy sos_locations_insert_own on public.sos_locations
  for insert to authenticated
  with check (
    exists (
      select 1 from public.sos_events
      where id = sos_id and user_id = auth.uid()
    )
  );

-- ====================================================================
-- 6. TRIGGERS
-- ====================================================================

-- 6.1 Auto-create profile row when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- role is hardcoded to 'user' here so the client cannot self-elevate
  -- by sending a `role` value in raw_user_meta_data at signup time.
  insert into public.profiles (id, name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    new.raw_user_meta_data->>'phone',
    new.email,
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- handle_new_user is SECURITY DEFINER (needs elevated privilege to write to profiles).
-- Revoke EXECUTE from API roles so it cannot be called via PostgREST /rpc/...
-- The trigger still fires because triggers don't check EXECUTE.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- 6.2 Auto-update updated_at on profile changes
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- 6.3 Enforce single-primary-contact-per-user
-- (mirrors contactsService addContact logic — auto-demotes existing primary)
create or replace function public.demote_other_primary_contacts()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.priority = 'primary' then
    update public.emergency_contacts
       set priority = 'secondary'
     where user_id = new.user_id
       and id <> new.id
       and priority = 'primary';
  end if;
  return new;
end;
$$;

drop trigger if exists ec_demote_other_primary on public.emergency_contacts;
create trigger ec_demote_other_primary
  before insert or update of priority on public.emergency_contacts
  for each row execute procedure public.demote_other_primary_contacts();

-- 6.4 Keep sos_events.updated_at in sync (reuses set_updated_at from 6.2).
drop trigger if exists sos_events_set_updated_at on public.sos_events;
create trigger sos_events_set_updated_at
  before update on public.sos_events
  for each row execute procedure public.set_updated_at();

-- 6.5 Auto-stamp lifecycle timestamps when status transitions. Avoids the
-- client having to remember to set acknowledged_at / resolved_at /
-- cancelled_at on every update.
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

-- ====================================================================
-- 7. STORAGE BUCKETS
-- ====================================================================

-- 7.1 Create three public buckets (idempotent)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('report-audio', 'report-audio', true)
on conflict (id) do nothing;

-- 7.2 Storage RLS — uploads scoped to user's own folder (<user_id>/...).
-- NOTE: We intentionally do NOT add a SELECT policy on these buckets.
-- Because buckets are public, public URLs work without a SELECT policy.
-- Adding a broad SELECT policy would let anyone LIST every object via API
-- (advisor lint 0025).
drop policy if exists avatars_upload_own_folder on storage.objects;
create policy avatars_upload_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own_folder on storage.objects;
create policy avatars_update_own_folder on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_delete_own_folder on storage.objects;
create policy avatars_delete_own_folder on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists report_photos_upload_own_folder on storage.objects;
create policy report_photos_upload_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists report_audio_upload_own_folder on storage.objects;
create policy report_audio_upload_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ====================================================================
-- 8. REALTIME — enable for chat_messages
-- Wrapped in DO block because "alter publication ... add table" is not
-- idempotent and errors if the table is already a member.
-- ====================================================================
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- Petugas dashboard subscribes to sos_events INSERT/UPDATE to render the
-- live SOS feed; sos_detail subscribes to sos_locations INSERT to draw
-- the moving marker trail.
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
-- DONE.
-- No seed data inserted — community feed will start empty.
-- Verify in Dashboard:
--   - Authentication > Users (empty)
--   - Table Editor: profiles, emergency_contacts, reports, chat_messages,
--                   notifications, sos_events, sos_locations
--   - Storage: avatars, report-photos, report-audio
--   - Database > Policies: each table should have RLS enabled with policies listed
--   - Database > Publications > supabase_realtime: chat_messages,
--                   sos_events, sos_locations listed
-- ====================================================================
