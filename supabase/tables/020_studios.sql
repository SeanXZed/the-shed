-- public.studios
-- Tenant boundary for multi-tenant + tutor/student features.

create table if not exists public.studios (
  id                 uuid        primary key default gen_random_uuid(),
  slug               text        not null unique,
  name               text        not null,
  created_by_user_id uuid        not null references auth.users(id) on delete restrict,
  created_at         timestamptz not null default now()
);

create index if not exists studios_created_by_user_id_idx on public.studios (created_by_user_id);

alter table public.studios enable row level security;

-- Insert: authenticated user can create a studio; must set themselves as creator.
drop policy if exists "studios_insert_own" on public.studios;
create policy "studios_insert_own" on public.studios
  for insert
  with check (auth.uid() = created_by_user_id);

