-- Run this in your Supabase SQL editor (Database > SQL Editor > New query)

create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  type        text not null default 'text'
                check (type in ('text', 'journal', 'image', 'link')),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- Index for chronological feed
create index if not exists notes_created_at_idx on notes (created_at desc);

-- Row Level Security (enable once you add auth)
-- alter table notes enable row level security;
-- create policy "owner access" on notes using (auth.uid() = user_id);




create policy "allow public uploads"
on storage.objects
for insert
with check (bucket_id = 'images');

create policy "allow public reads"
on storage.objects
for select
using (bucket_id = 'images');



-- ─────────────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor (Database › SQL Editor › New query)
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE patterns
-- ─────────────────────────────────────────────────────────────────

-- 1. Notes table (unchanged columns, added user_id)
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  content     text not null,
  type        text not null default 'text'
                check (type in ('text', 'journal', 'image', 'link')),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- Add user_id column to existing tables if upgrading
alter table notes add column if not exists
  user_id uuid references auth.users(id) on delete cascade;

-- Indexes
create index if not exists notes_created_at_idx on notes (created_at desc);
create index if not exists notes_user_id_idx    on notes (user_id);

-- 2. Row Level Security
alter table notes enable row level security;

-- Drop old policies if re-running
drop policy if exists "Users see own notes"   on notes;
drop policy if exists "Users insert own notes" on notes;
drop policy if exists "Users delete own notes" on notes;

create policy "Users see own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Users insert own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users delete own notes"
  on notes for delete
  using (auth.uid() = user_id);

-- 3. Storage policies for the 'images' bucket
-- (bucket must already exist — create it in Storage UI if needed)

drop policy if exists "allow public uploads" on storage.objects;
drop policy if exists "allow public reads"   on storage.objects;
drop policy if exists "Users upload images"  on storage.objects;
drop policy if exists "Users read images"    on storage.objects;
drop policy if exists "Users delete images"  on storage.objects;

create policy "Users upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Users read images"
  on storage.objects for select
  using (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Users delete images"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.role() = 'authenticated');