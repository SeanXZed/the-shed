-- public.practice_sessions
-- One row per practice session (ONE game per session).
-- This is the session boundary + summary table. Detailed attempt telemetry lives in `public.game_events`.

create table if not exists public.practice_sessions (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  game_id        uuid        not null references public.games(id) on delete cascade,

  -- Skill-tree context (nullable; free practice sessions leave these null)
  track_id       uuid,
  node_id        uuid,

  started_at     timestamptz not null default now(),
  ended_at       timestamptz,

  status         text        not null default 'active',

  -- Session config snapshot (roots, sequence_count, direction, inversions, etc.)
  config         jsonb       not null default '{}'::jsonb,

  -- Summary counters (derived from `game_events`, but stored for fast dashboards)
  items_presented integer    not null default 0,
  items_completed integer    not null default 0,
  correct_count   integer    not null default 0,

  is_cram        boolean     not null default false,

  created_at     timestamptz not null default now(),

  constraint practice_sessions_status_valid check (status in ('active', 'completed', 'abandoned')),
  constraint practice_sessions_counts_valid check (
    items_presented >= 0 and items_completed >= 0 and correct_count >= 0
  )
);

alter table public.practice_sessions enable row level security;

drop policy if exists "practice_sessions_select_own" on public.practice_sessions;
create policy "practice_sessions_select_own" on public.practice_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "practice_sessions_insert_own" on public.practice_sessions;
create policy "practice_sessions_insert_own" on public.practice_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "practice_sessions_update_own" on public.practice_sessions;
create policy "practice_sessions_update_own" on public.practice_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "practice_sessions_delete_own" on public.practice_sessions;
create policy "practice_sessions_delete_own" on public.practice_sessions
  for delete using (auth.uid() = user_id);

