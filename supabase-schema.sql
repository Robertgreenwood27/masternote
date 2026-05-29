-- ════════════════════════════════════════════════════════════════════
-- masternote — full database rebuild
-- Paste into Supabase: Database › SQL Editor › New query › Run
--
-- Idempotent: safe to re-run on an existing project.
-- For a TRUE from-scratch rebuild, uncomment Section 0 first (destructive).
-- ════════════════════════════════════════════════════════════════════


-- ─── 0. OPTIONAL CLEAN SLATE (DESTRUCTIVE — deletes all rows) ─────────
-- Uncomment ONLY if you want to wipe and rebuild from zero.
-- This is the reliable way to fix a table whose schema has drifted,
-- because `create table if not exists` will NOT modify an existing table
-- (that's exactly why the todos default never applied the first time).
--
-- drop table if exists todos cascade;
-- drop table if exists notes cascade;


-- ─── 1. NOTES ────────────────────────────────────────────────────────
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  content     text not null,
  type        text not null default 'text'
                check (type in ('text', 'journal', 'image', 'link')),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- Repair an older notes table that predates user_id / its default:
alter table notes add column if not exists
  user_id uuid references auth.users(id) on delete cascade;
alter table notes alter column user_id set default auth.uid();

create index if not exists notes_created_at_idx on notes (created_at desc);
create index if not exists notes_user_id_idx    on notes (user_id);

alter table notes enable row level security;

drop policy if exists "Users see own notes"    on notes;
drop policy if exists "Users insert own notes" on notes;
drop policy if exists "Users delete own notes" on notes;

create policy "Users see own notes"    on notes for select using (auth.uid() = user_id);
create policy "Users insert own notes" on notes for insert with check (auth.uid() = user_id);
create policy "Users delete own notes" on notes for delete using (auth.uid() = user_id);


-- ─── 2. TODOS ────────────────────────────────────────────────────────
create table if not exists todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  text        text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Repair an existing todos table that was created without the default
-- (this was the cause of "new row violates row-level security policy"):
alter table todos alter column user_id set default auth.uid();

create index if not exists todos_user_id_idx    on todos (user_id);
create index if not exists todos_created_at_idx on todos (created_at);

alter table todos enable row level security;

drop policy if exists "Users see own todos"    on todos;
drop policy if exists "Users insert own todos" on todos;
drop policy if exists "Users update own todos" on todos;
drop policy if exists "Users delete own todos" on todos;

create policy "Users see own todos"    on todos for select using (auth.uid() = user_id);
create policy "Users insert own todos" on todos for insert with check (auth.uid() = user_id);
create policy "Users update own todos" on todos for update using (auth.uid() = user_id);  -- needed for the checkbox toggle
create policy "Users delete own todos" on todos for delete using (auth.uid() = user_id);


-- ─── 3. STORAGE: images bucket ───────────────────────────────────────
-- The bucket itself is NOT created by SQL. In the dashboard:
--   Storage › New bucket › name it exactly `images` › toggle PUBLIC on.
--
-- Why public: your code calls supabase.storage...getPublicUrl(), and that
-- only resolves to a working image URL when the bucket is public. On a
-- public bucket, READS bypass RLS automatically, so you don't need a read
-- policy. WRITES (upload/delete) still go through the policies below.

drop policy if exists "allow public uploads" on storage.objects;
drop policy if exists "allow public reads"   on storage.objects;
drop policy if exists "Users upload images"  on storage.objects;
drop policy if exists "Users read images"    on storage.objects;
drop policy if exists "Users delete images"  on storage.objects;

create policy "Users upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Users delete images"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.role() = 'authenticated');


-- ─── 4. VERIFY (optional) ────────────────────────────────────────────
-- Run this afterward to confirm the defaults actually stuck. Both rows
-- should show `auth.uid()` under column_default — if a user_id row is
-- blank, that table predated the default and inserts will fail RLS.
--
-- select table_name, column_name, column_default
-- from information_schema.columns
-- where table_name in ('notes', 'todos') and column_name = 'user_id';