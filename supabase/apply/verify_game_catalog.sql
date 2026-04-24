-- Optional: run after apply + POST /api/game-items/ensure (or equivalent) to check row counts.
-- Adjust expected counts if SCALE_DEFINITIONS / ROOTS change in @the-shed/shared.

-- Expected: 5 games
select g.slug, count(gi.id) as item_count
from public.games g
left join public.game_items gi on gi.game_id = g.id
group by g.slug
order by g.slug;

-- full_chord must include every ChordQuality × 12 roots (6 × 12 = 72) when shared defs include 6 qualities.
select count(*) filter (where canonical_key like 'dim7::%') as dim7_rows
from public.game_items i
join public.games g on g.id = i.game_id
where g.slug = 'full_chord';

-- Expected counts (current seeding): full_scale=204, sequence=204, full_chord=72, progression_251=24, interval=264
select
  sum((g.slug = 'full_scale')::int) as has_full_scale,
  sum((g.slug = 'sequence')::int) as has_sequence,
  sum((g.slug = 'full_chord')::int) as has_full_chord,
  sum((g.slug = 'progression_251')::int) as has_251,
  sum((g.slug = 'interval')::int) as has_interval
from public.games g;
