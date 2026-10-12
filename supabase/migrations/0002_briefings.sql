-- Morning Desk: saved briefings ("episodes"), one per user per day, kept 7 days.
-- Run once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,                -- the listener's local date
  script text not null,
  audio_path text not null,         -- file in the "briefings" storage bucket
  duration_seconds integer not null default 0,
  voice text not null,
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists briefings_user_day on public.briefings (user_id, day desc);

-- Row Level Security: people only see and manage their own episodes.
alter table public.briefings enable row level security;

drop policy if exists "Read own briefings" on public.briefings;
create policy "Read own briefings" on public.briefings
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Create own briefings" on public.briefings;
create policy "Create own briefings" on public.briefings
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Update own briefings" on public.briefings;
create policy "Update own briefings" on public.briefings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own briefings" on public.briefings;
create policy "Delete own briefings" on public.briefings
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Private storage bucket for the MP3s. Files live at <user id>/<day>.mp3,
-- and each person can only reach files in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('briefings', 'briefings', false, 20971520, array['audio/mpeg'])
on conflict (id) do nothing;

drop policy if exists "Read own briefing audio" on storage.objects;
create policy "Read own briefing audio" on storage.objects
  for select to authenticated
  using (bucket_id = 'briefings' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Upload own briefing audio" on storage.objects;
create policy "Upload own briefing audio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'briefings' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Replace own briefing audio" on storage.objects;
create policy "Replace own briefing audio" on storage.objects
  for update to authenticated
  using (bucket_id = 'briefings' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Delete own briefing audio" on storage.objects;
create policy "Delete own briefing audio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'briefings' and (storage.foldername(name))[1] = (select auth.uid())::text);
