-- public.profiles
-- Display names + platform Superadmin / platform tutor. Studio roles live in studio_memberships.

create table if not exists public.profiles (
  user_id       uuid        primary key references auth.users(id) on delete cascade,
  full_name     text,
  nickname      text,
  is_superadmin boolean     not null default false,
  is_tutor      boolean     not null default false,
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_is_superadmin_idx on public.profiles (is_superadmin) where is_superadmin = true;
create index if not exists profiles_is_tutor_idx on public.profiles (is_tutor) where is_tutor = true;

alter table public.profiles enable row level security;

-- SECURITY DEFINER: reads is_superadmin without RLS recursion.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_superadmin from public.profiles p where p.user_id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_superadmin() to authenticated;

create or replace function public.is_tutor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_tutor from public.profiles p where p.user_id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_tutor() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reg text;
  want_tutor boolean;
begin
  reg := nullif(
    lower(trim(coalesce(new.raw_user_meta_data->>'registration_role', 'student'))),
    ''
  );
  want_tutor := (reg = 'tutor');

  insert into public.profiles (user_id, full_name, nickname, is_tutor)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    nullif(trim(split_part(new.email, '@', 1)), ''),
    want_tutor
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.profiles_prevent_platform_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if old.is_superadmin is distinct from new.is_superadmin then
    if not public.is_superadmin() then
      raise exception 'cannot change superadmin flag';
    end if;
  end if;
  if old.is_tutor is distinct from new.is_tutor then
    if not public.is_superadmin() then
      raise exception 'cannot change platform tutor flag';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_superadmin_escalation on public.profiles;
drop trigger if exists profiles_prevent_platform_role_escalation on public.profiles;
create trigger profiles_prevent_platform_role_escalation
  before update on public.profiles
  for each row execute function public.profiles_prevent_platform_role_escalation();

drop policy if exists "profiles_select_own_or_superadmin" on public.profiles;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_select_superadmin_all" on public.profiles;
create policy "profiles_select_superadmin_all" on public.profiles
  for select
  using (public.is_superadmin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert
  with check (
    auth.uid() = user_id
    and is_superadmin = false
    and is_tutor = false
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_superadmin_any" on public.profiles;
create policy "profiles_update_superadmin_any" on public.profiles
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- public.studios insert (table from 020_studios.sql): only Superadmin or platform tutor may create studios.
drop policy if exists "studios_insert_own" on public.studios;
create policy "studios_insert_own" on public.studios
  for insert
  with check (
    auth.uid() = created_by_user_id
    and (public.is_superadmin() or public.is_tutor())
  );
