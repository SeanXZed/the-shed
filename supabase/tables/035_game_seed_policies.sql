-- TEMPORARY authoring policies for game catalog seeding.
--
-- Purpose:
-- Allow authenticated users to insert `games` and `game_items` so the app can
-- lazily ensure catalog rows exist during the dual-write migration.
--
-- Long term:
-- Replace these with admin-only / authoring-only policies (e.g. studio owner/admin),
-- or move seeding behind a security definer function.

-- games
drop policy if exists "games_insert_authed" on public.games;
create policy "games_insert_authed" on public.games
  for insert with check (auth.uid() is not null);

drop policy if exists "games_update_authed" on public.games;
create policy "games_update_authed" on public.games
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- game_items
drop policy if exists "game_items_insert_authed" on public.game_items;
create policy "game_items_insert_authed" on public.game_items
  for insert with check (auth.uid() is not null);

drop policy if exists "game_items_update_authed" on public.game_items;
create policy "game_items_update_authed" on public.game_items
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

