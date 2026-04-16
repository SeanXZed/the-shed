-- public.game_items
-- Canonical content identity per game.
--
-- `canonical_key` is a stable, human-readable identifier that the app can
-- construct deterministically. Examples:
-- - full_scale:         "major::C"
-- - full_chord:         "maj7::C"              (if chord game is chord-quality based)
-- - sequence:           "major::C"
-- - progression_251:    "251::C::major"
-- - interval:           "M3::C::up"
--
-- `data` holds structured parameters (JSON) and can evolve without a migration.

create table if not exists public.game_items (
  id            uuid        primary key default gen_random_uuid(),
  game_id       uuid        not null references public.games(id) on delete cascade,
  canonical_key text        not null,
  data          jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),

  constraint game_items_unique_per_game unique (game_id, canonical_key)
);

create index if not exists game_items_game_id_idx on public.game_items (game_id);

alter table public.game_items enable row level security;

-- For now: readable by any authenticated user (safe metadata).
drop policy if exists "game_items_select_authed" on public.game_items;
create policy "game_items_select_authed" on public.game_items
  for select using (auth.uid() is not null);

-- Writes restricted (authoring/admin later). No insert/update/delete policies yet.

