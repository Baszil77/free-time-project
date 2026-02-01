-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Places
create table if not exists places (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  summary text not null,
  why_it_matters text,
  confidence text check (confidence in ('high','medium','inferred')) not null,
  photo_url text,
  lat double precision,
  lng double precision,
  city text,
  country text,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- AI requests
create table if not exists ai_requests (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  anon_id text,
  created_at timestamptz default now()
);

-- AI cache
create table if not exists ai_cache (
  id bigserial primary key,
  hash text not null,
  coarse_location text not null,
  response jsonb not null,
  created_at timestamptz default now(),
  unique (hash, coarse_location)
);

-- RLS
alter table places enable row level security;
alter table ai_requests enable row level security;

create policy "places_owner_crud" on places
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "places_public_read" on places
  for select
  using (is_public = true);

create policy "ai_requests_insert" on ai_requests
  for insert
  with check (true);

create policy "ai_requests_select_restricted" on ai_requests
  for select
  using (false);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict do nothing;

-- Storage policies
create policy "photos_owner_read" on storage.objects
  for select
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos_owner_insert" on storage.objects
  for insert
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
