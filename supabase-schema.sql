-- Script App — Supabase Schema
-- Run this in the Supabase SQL editor

-- Enable RLS
-- Profiles table
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  raw_script text not null,
  portrait text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

-- Checkins table
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('morning', 'evening')) not null,
  content text not null,
  ai_response text not null,
  date date not null,
  created_at timestamptz default now()
);

alter table checkins enable row level security;

create policy "Users can read own checkins"
  on checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert own checkins"
  on checkins for insert
  with check (auth.uid() = user_id);

-- Prevent duplicate checkins of the same type on the same day
create unique index if not exists checkins_user_date_type_unique
  on checkins (user_id, date, type);

-- Weekly reflections table
create table if not exists weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  week_start date not null,
  created_at timestamptz default now()
);

alter table weekly_reflections enable row level security;

create policy "Users can read own weekly reflections"
  on weekly_reflections for select
  using (auth.uid() = user_id);

create policy "Users can insert own weekly reflections"
  on weekly_reflections for insert
  with check (auth.uid() = user_id);

create unique index if not exists weekly_reflections_user_week_unique
  on weekly_reflections (user_id, week_start);
