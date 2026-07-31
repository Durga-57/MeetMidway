-- MeetMidway Supabase schema
-- Run once in Supabase Dashboard -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) between 6 and 6),
  name text not null check (char_length(name) between 2 and 60),
  place_type text not null,
  created_by uuid references auth.users(id) on delete set null,
  midpoint_lat double precision,
  midpoint_lng double precision,
  confirmed_place_id bigint,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.trip_participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 40),
  address text not null check (char_length(address) between 3 and 120),
  lat double precision not null,
  lng double precision not null,
  color text not null,
  joined_at timestamptz not null default now()
);

create table if not exists public.trip_places (
  id bigint not null,
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  place_type text not null,
  tags jsonb not null default '{}'::jsonb,
  distances jsonb not null default '[]'::jsonb,
  avg_distance double precision not null default 0,
  max_distance double precision not null default 0,
  min_distance double precision not null default 0,
  fairness_score double precision not null default 0,
  created_at timestamptz not null default now(),
  primary key (trip_id, id)
);

create table if not exists public.trip_votes (
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id),
  foreign key (trip_id, place_id) references public.trip_places(trip_id, id) on delete cascade
);

create index if not exists trips_code_idx on public.trips(code);
create index if not exists trips_expires_at_idx on public.trips(expires_at);
create index if not exists trip_participants_trip_id_idx on public.trip_participants(trip_id);
create index if not exists trip_places_trip_id_idx on public.trip_places(trip_id);
create index if not exists trip_votes_place_id_idx on public.trip_votes(trip_id, place_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_participants enable row level security;
alter table public.trip_places enable row level security;
alter table public.trip_votes enable row level security;

create or replace function public.is_trip_member(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trip_participants
    where trip_id = target_trip_id and user_id = auth.uid()
  );
$$;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Members can view trips" on public.trips;
create policy "Members can view trips" on public.trips
for select to authenticated using (created_by = auth.uid() or public.is_trip_member(id));

drop policy if exists "Users can create trips" on public.trips;
create policy "Users can create trips" on public.trips
for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "Creators can update trips" on public.trips;
create policy "Creators can update trips" on public.trips
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "Members can view participants" on public.trip_participants;
create policy "Members can view participants" on public.trip_participants
for select to authenticated using (public.is_trip_member(trip_id) or user_id = auth.uid());

drop policy if exists "Users can join trips" on public.trip_participants;
create policy "Users can join trips" on public.trip_participants
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Users can update their participant row" on public.trip_participants;
create policy "Users can update their participant row" on public.trip_participants
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Members can view places" on public.trip_places;
create policy "Members can view places" on public.trip_places
for select to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "Members can manage places" on public.trip_places;
create policy "Members can manage places" on public.trip_places
for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

drop policy if exists "Members can view votes" on public.trip_votes;
create policy "Members can view votes" on public.trip_votes
for select to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "Users can cast their own vote" on public.trip_votes;
create policy "Users can cast their own vote" on public.trip_votes
for insert to authenticated with check (user_id = auth.uid() and public.is_trip_member(trip_id));

drop policy if exists "Users can change their own vote" on public.trip_votes;
create policy "Users can change their own vote" on public.trip_votes
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can remove their own vote" on public.trip_votes;
create policy "Users can remove their own vote" on public.trip_votes
for delete to authenticated using (user_id = auth.uid());
