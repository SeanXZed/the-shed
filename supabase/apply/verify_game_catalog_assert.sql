-- Assert invariants for game catalog completeness (pure SQL; no plpgsql).
-- Usage: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/apply/verify_game_catalog_assert.sql
--
-- This uses “divide by zero” to fail the script when an invariant is violated.

with expected as (
  select
    17 * 12 as full_scale,            -- scale_types * roots
    17 * 12 as sequence,              -- scale_types * roots
    6 * 12  as full_chord,            -- chord_qualities * roots
    12 * 2  as progression_251,       -- roots * tonalities
    11 * 12 * 2 as interval,          -- interval_ids * roots * directions
    12 as dim7_rows
),
actual as (
  select
    (select count(*) from game_items i join games g on g.id = i.game_id where g.slug = 'full_scale') as full_scale,
    (select count(*) from game_items i join games g on g.id = i.game_id where g.slug = 'sequence') as sequence,
    (select count(*) from game_items i join games g on g.id = i.game_id where g.slug = 'full_chord') as full_chord,
    (select count(*) from game_items i join games g on g.id = i.game_id where g.slug = 'progression_251') as progression_251,
    (select count(*) from game_items i join games g on g.id = i.game_id where g.slug = 'interval') as interval,
    (select count(*) from game_items i join games g on g.id = i.game_id where g.slug = 'full_chord' and i.canonical_key like 'dim7::%') as dim7_rows,
    (select count(*) from game_items) as total
),
expected_total as (
  select (full_scale + sequence + full_chord + progression_251 + interval) as total from expected
)
select
  1 / (case when a.full_scale = e.full_scale then 1 else 0 end) as assert_full_scale,
  1 / (case when a.sequence = e.sequence then 1 else 0 end) as assert_sequence,
  1 / (case when a.full_chord = e.full_chord then 1 else 0 end) as assert_full_chord,
  1 / (case when a.progression_251 = e.progression_251 then 1 else 0 end) as assert_251,
  1 / (case when a.interval = e.interval then 1 else 0 end) as assert_interval,
  1 / (case when a.dim7_rows = e.dim7_rows then 1 else 0 end) as assert_dim7_rows,
  1 / (case when a.total = t.total then 1 else 0 end) as assert_total
from actual a, expected e, expected_total t;

