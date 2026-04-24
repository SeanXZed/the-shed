-- Deterministic backfill of missing game_items canonical keys for the current game catalog contract.
-- Safe to run multiple times: inserts are guarded by NOT EXISTS and unique constraint (game_id, canonical_key).

-- NOTE: this migration may be executed under a role that is subject to RLS.
-- We temporarily disable RLS on catalog tables for the duration of the backfill,
-- then re-enable it at the end. (Catalog writes are controlled elsewhere.)
alter table public.games disable row level security;
alter table public.game_items disable row level security;

-- Ensure base games exist (idempotent).
insert into public.games (slug, title)
values
  ('full_scale', 'Scale Game'),
  ('full_chord', 'Chord Game'),
  ('sequence', 'Sequence Game'),
  ('progression_251', 'Chord Progression (251)'),
  ('interval', 'Interval Game')
on conflict (slug) do update set title = excluded.title;

-- Constants (keep in sync with @the-shed/shared if you change theory lists).
with
roots as (
  select unnest(array['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']::text[]) as root
),
scale_types as (
  select unnest(array[
    'major',
    'natural_minor',
    'melodic_minor',
    'harmonic_minor',
    'dorian',
    'phrygian',
    'lydian',
    'mixolydian',
    'locrian',
    'minor_blues',
    'mixolydian_b9b13',
    'lydian_dominant',
    'altered',
    'bebop_major',
    'bebop_minor',
    'bebop_dominant',
    'bebop_diminished'
  ]::text[]) as scale_type
),
game_ids as (
  select slug, id
  from public.games
  where slug in ('full_scale','full_chord','sequence','progression_251','interval')
)

-- full_scale and sequence (scale types × roots)
insert into public.game_items (game_id, canonical_key, data)
select g.id, st.scale_type || '::' || r.root,
       jsonb_build_object('scale_type', st.scale_type, 'root', r.root)
from game_ids g
join scale_types st on true
join roots r on true
where g.slug in ('full_scale','sequence')
  and not exists (
    select 1 from public.game_items i
    where i.game_id = g.id and i.canonical_key = st.scale_type || '::' || r.root
  );

-- full_chord (qualities × roots)
with
roots as (
  select unnest(array['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']::text[]) as root
),
chord_qualities as (
  select unnest(array['maj7','min7','dom7','min7b5','minmaj7','dim7']::text[]) as quality
),
game_ids as (
  select slug, id
  from public.games
  where slug in ('full_scale','full_chord','sequence','progression_251','interval')
)
insert into public.game_items (game_id, canonical_key, data)
select g.id, cq.quality || '::' || r.root,
       jsonb_build_object('chord_quality', cq.quality, 'root', r.root)
from game_ids g
join chord_qualities cq on true
join roots r on true
where g.slug = 'full_chord'
  and not exists (
    select 1 from public.game_items i
    where i.game_id = g.id and i.canonical_key = cq.quality || '::' || r.root
  );

-- progression_251 (roots × {major,minor})
with
roots as (
  select unnest(array['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']::text[]) as root
),
game_ids as (
  select slug, id
  from public.games
  where slug in ('full_scale','full_chord','sequence','progression_251','interval')
)
insert into public.game_items (game_id, canonical_key, data)
select g.id, '251::' || r.root || '::' || t.tonality,
       jsonb_build_object('progression','251','key', r.root, 'tonality', t.tonality)
from game_ids g
join roots r on true
join (select unnest(array['major','minor']::text[]) as tonality) t on true
where g.slug = 'progression_251'
  and not exists (
    select 1 from public.game_items i
    where i.game_id = g.id and i.canonical_key = '251::' || r.root || '::' || t.tonality
  );

-- interval (interval ids × roots × {up,down})
with
roots as (
  select unnest(array['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']::text[]) as root
),
interval_ids as (
  select unnest(array['m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7']::text[]) as interval_id
),
game_ids as (
  select slug, id
  from public.games
  where slug in ('full_scale','full_chord','sequence','progression_251','interval')
)
insert into public.game_items (game_id, canonical_key, data)
select g.id, it.interval_id || '::' || r.root || '::' || d.direction,
       jsonb_build_object('interval_id', it.interval_id, 'root', r.root, 'direction', d.direction)
from game_ids g
join interval_ids it on true
join roots r on true
join (select unnest(array['up','down']::text[]) as direction) d on true
where g.slug = 'interval'
  and not exists (
    select 1 from public.game_items i
    where i.game_id = g.id and i.canonical_key = it.interval_id || '::' || r.root || '::' || d.direction
  );

alter table public.game_items enable row level security;
alter table public.games enable row level security;

