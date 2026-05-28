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