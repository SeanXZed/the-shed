-- Game hardening: append-only game_events for end users; remove temporary catalog write policies.
-- (Catalog seeding is done by server routes using the service role — see apps/web API games/game-items ensure.)

-- ─── game_events: learners cannot edit telemetry ─────────────────────────────
drop policy if exists "game_events_update_own" on public.game_events;
drop policy if exists "game_events_delete_own" on public.game_events;

-- ─── games / game_items: revoke broad authenticated insert/update (035 replacement) ─
drop policy if exists "games_insert_authed" on public.games;
drop policy if exists "games_update_authed" on public.games;
drop policy if exists "game_items_insert_authed" on public.game_items;
drop policy if exists "game_items_update_authed" on public.game_items;
