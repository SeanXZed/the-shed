-- 0003_game_based.sql
-- Purpose: introduce game-based tables for independent games.
--
-- Apply the files in this order:
--
-- 1) supabase/tables/030_games.sql
-- 2) supabase/tables/031_practice_sessions.sql
-- 3) supabase/tables/032_game_items.sql
-- 4) supabase/tables/033_user_game_item_state.sql
-- 5) supabase/tables/034_game_events.sql
-- 6) supabase/tables/035_game_seed_policies.sql (temporary; authoring policies)
--
-- Notes:
-- - These tables are intended for Phase 5 ("game-based state split").
-- - They can be deployed early without changing app behavior.
-- - Backfill + dual-write/dual-read happens later.

-- Intentionally empty (ordering-only). See files above.

