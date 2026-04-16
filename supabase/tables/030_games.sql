-- public.games
-- Game catalog (Scale / Chord / Sequence / Progression / Interval, etc.)

create table if not exists public.games (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null unique,
  title      text        not null,
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;

-- For now: readable by any authenticated user (safe metadata).
drop policy if exists "games_select_authed" on public.games;
create policy "games_select_authed" on public.games
  for select using (auth.uid() is not null);

-- Writes restricted (authoring/admin later). No insert/update/delete policies yet.

