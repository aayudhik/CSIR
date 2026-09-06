-- Physics JRF Journey V6: per-user profile and progress storage.
-- Run this once in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "progress_select_own" on public.user_progress;
create policy "progress_select_own" on public.user_progress
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "progress_insert_own" on public.user_progress;
create policy "progress_insert_own" on public.user_progress
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "progress_update_own" on public.user_progress;
create policy "progress_update_own" on public.user_progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "progress_delete_own" on public.user_progress;
create policy "progress_delete_own" on public.user_progress
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep updated_at current for profile changes.
create or replace function public.touch_profile_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_profile_updated_at();

-- Optional starter row: progress is created lazily by the application.
