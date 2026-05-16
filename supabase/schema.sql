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

-- ====================================================================
-- 2. TABLES
-- ====================================================================

-- 2.1 profiles — extends auth.users with display fields
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  name        text        not null,
  phone       text,
  email       text,
  photo_uri   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

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

-- ====================================================================
-- 4. ROW LEVEL SECURITY — enable on all tables
-- ====================================================================
alter table public.profiles            enable row level security;
alter table public.emergency_contacts  enable row level security;
alter table public.reports             enable row level security;
alter table public.notifications       enable row level security;
alter table public.chat_messages       enable row level security;

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
  insert into public.profiles (id, name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    new.raw_user_meta_data->>'phone',
    new.email
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

-- ====================================================================
-- DONE.
-- No seed data inserted — community feed will start empty.
-- Verify in Dashboard:
--   - Authentication > Users (empty)
--   - Table Editor: profiles, emergency_contacts, reports, chat_messages, notifications
--   - Storage: avatars, report-photos, report-audio
--   - Database > Policies: each table should have RLS enabled with policies listed
-- ====================================================================
