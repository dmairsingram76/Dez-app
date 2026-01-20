-- UUIDs
create extension if not exists "pgcrypto";

-- Geo search
create extension if not exists postgis;

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age int,
  height_cm int,
  weight_kg int,
  location geography(point, 4326),
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  version int not null,
  responses jsonb not null,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  activity_types text[] not null,
  location geography(point, 4326) not null,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index facilities_location_idx on facilities using gist(location);
create index facilities_activity_idx on facilities using gin(activity_types);

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  facility_id uuid references facilities(id),
  reasoning text,
  score numeric,
  ai_payload jsonb,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

