-- public.game_events
-- Append-only telemetry across all games (future-proof for adaptive sequencing,
-- tutor reporting, and analytics).
--
-- `practice_session_id` references `public.practice_sessions`.

create table if not exists public.game_events (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  game_item_id       uuid        not null references public.game_items(id) on delete cascade,
  practice_session_id uuid       references public.practice_sessions(id) on delete set null,

  occurred_at        timestamptz not null default now(),

  -- Common scoring fields (games may populate different subsets)
  grade              integer,     -- 1..4 where applicable
  score              integer,     -- game-specific score
  is_correct         boolean,

  meta               jsonb        not null default '{}'::jsonb
);

create index if not exists game_events_user_occurred_at_idx on public.game_events (user_id, occurred_at desc);
create index if not exists game_events_game_item_idx on public.game_events (game_item_id, occurred_at desc);

alter table public.game_events enable row level security;

drop policy if exists "game_events_select_own" on public.game_events;
create policy "game_events_select_own" on public.game_events
  for select using (auth.uid() = user_id);

drop policy if exists "game_events_insert_own" on public.game_events;
create policy "game_events_insert_own" on public.game_events
  for insert with check (auth.uid() = user_id);

-- Append-only for learners: no update/delete (protects analytics / adaptive weights).
-- Corrections: compensating events or service-role admin tooling.
drop policy if exists "game_events_update_own" on public.game_events;
drop policy if exists "game_events_delete_own" on public.game_events;

