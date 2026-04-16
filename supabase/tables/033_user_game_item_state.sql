-- public.user_game_item_state
-- Per-user state per (game item). This is the "independent game state" layer.
--
-- Notes:
-- - This table intentionally supports SM-2 fields, but they are optional:
--   games can use mastery/rolling scores instead of due dates.
-- - `mastery` is an app-level signal (0..1) that can evolve over time.

create table if not exists public.user_game_item_state (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  game_item_id   uuid        not null references public.game_items(id) on delete cascade,

  -- Optional scheduling fields (SM-2 or similar)
  ease_factor    double precision,
  interval_days  integer,
  next_review    timestamptz,
  repetitions    integer,

  -- Game-agnostic progress signals
  mastery        double precision not null default 0, -- 0..1
  last_played_at timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  primary key (user_id, game_item_id),

  constraint user_game_item_state_mastery_valid check (mastery >= 0 and mastery <= 1),
  constraint user_game_item_state_interval_days_min check (interval_days is null or interval_days >= 1),
  constraint user_game_item_state_repetitions_min check (repetitions is null or repetitions >= 0),
  constraint user_game_item_state_ease_factor_min check (ease_factor is null or ease_factor >= 1.3)
);

create index if not exists user_game_item_state_user_next_review_idx
  on public.user_game_item_state (user_id, next_review);

alter table public.user_game_item_state enable row level security;

drop policy if exists "user_game_item_state_select_own" on public.user_game_item_state;
create policy "user_game_item_state_select_own" on public.user_game_item_state
  for select using (auth.uid() = user_id);

drop policy if exists "user_game_item_state_insert_own" on public.user_game_item_state;
create policy "user_game_item_state_insert_own" on public.user_game_item_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_game_item_state_update_own" on public.user_game_item_state;
create policy "user_game_item_state_update_own" on public.user_game_item_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_game_item_state_delete_own" on public.user_game_item_state;
create policy "user_game_item_state_delete_own" on public.user_game_item_state
  for delete using (auth.uid() = user_id);

