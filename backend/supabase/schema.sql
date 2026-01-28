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
  latitude double precision not null,
  longitude double precision not null,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);



create index facilities_location_idx on facilities using gist(location);
create index facilities_activity_idx on facilities using gin(activity_types);

alter table facilities
add column location geography(point, 4326)
generated always as (
  st_makepoint(longitude, latitude)::geography
) stored;


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

  -- Identity (optional)
  user_id uuid null,
  anonymous_id uuid not null,

  -- Event metadata
  event_name text not null,
  event_version int not null default 1,

  -- Context
  screen text,
  source text, -- e.g. "mobile", "web"
  metadata jsonb,

  -- Compliance
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create index idx_events_name on events(event_name);
create index idx_events_user on events(user_id);
create index idx_events_anon on events(anonymous_id);

create table cached_searches (
  key text primary key,
  response jsonb,
  created_at timestamptz default now()
);

