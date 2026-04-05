-- Supabase schema for The Shed (Foundation phase)
-- Apply this to a fresh Supabase project via the SQL editor.
-- All tables are created from scratch; no migration assumed.

-- ============================================================
-- FLASHCARD CARDS (SM-2 state per user per scale)
-- ============================================================

create table if not exists public.cards (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  scale_type       text        not null,
  root             text        not null,
  ease_factor      double precision not null default 2.5,
  interval_days    integer     not null default 1,
  next_review      timestamptz not null default now(),
  repetitions      integer     not null default 0,
  last_reviewed_at timestamptz,

  constraint cards_user_scale_root_unique
    unique (user_id, scale_type, root),

  constraint cards_scale_type_valid check (scale_type in (
    'major', 'natural_minor', 'melodic_minor', 'harmonic_minor',
    'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
    'minor_blues', 'mixolydian_b9b13', 'lydian_dominant', 'altered',
    'bebop_major', 'bebop_minor', 'bebop_dominant', 'bebop_diminished'
  )),

  constraint cards_root_valid check (root in (
    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'
  )),

  constraint cards_ease_factor_min check (ease_factor >= 1.3),
  constraint cards_interval_days_min check (interval_days >= 1),
  constraint cards_repetitions_min check (repetitions >= 0)
);

-- Critical for the due-card query: next_review <= now() per user
create index cards_user_next_review_idx
  on public.cards (user_id, next_review);

-- ============================================================
-- PRACTICE SESSIONS (one row per session start/end)
-- ============================================================

create table if not exists public.practice_sessions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  practice_mode text        not null,
  is_cram       boolean     not null default false,

  constraint practice_sessions_mode_valid check (practice_mode in (
    'full_scale', 'full_chord', 'sequence', '251'
  ))
);

-- ============================================================
-- PRACTICE EVENTS (per-card events within a session)
-- ============================================================

create table if not exists public.practice_events (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  session_id    uuid        references public.practice_sessions(id) on delete cascade,
  occurred_at   timestamptz not null default now(),
  event_type    text        not null,
  practice_mode text,
  root          text,
  scale_type    text,
  chord_name    text,
  grade         integer,

  constraint practice_events_grade_valid check (grade is null or grade between 1 and 4)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.cards enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_events enable row level security;

-- cards
create policy "cards_select_own" on public.cards
  for select using (auth.uid() = user_id);
create policy "cards_insert_own" on public.cards
  for insert with check (auth.uid() = user_id);
create policy "cards_update_own" on public.cards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cards_delete_own" on public.cards
  for delete using (auth.uid() = user_id);

-- practice_sessions
create policy "practice_sessions_select_own" on public.practice_sessions
  for select using (auth.uid() = user_id);
create policy "practice_sessions_insert_own" on public.practice_sessions
  for insert with check (auth.uid() = user_id);
create policy "practice_sessions_update_own" on public.practice_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "practice_sessions_delete_own" on public.practice_sessions
  for delete using (auth.uid() = user_id);

-- practice_events
create policy "practice_events_select_own" on public.practice_events
  for select using (auth.uid() = user_id);
create policy "practice_events_insert_own" on public.practice_events
  for insert with check (auth.uid() = user_id);
create policy "practice_events_update_own" on public.practice_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "practice_events_delete_own" on public.practice_events
  for delete using (auth.uid() = user_id);

-- ============================================================
-- SEEDING: 204 CARDS PER USER ON SIGN-UP
-- Creates one card row for every (scale_type, root) combination
-- (17 scales × 12 roots = 204 cards) when a new auth user is created.
-- The on conflict clause makes this idempotent.
-- ============================================================

create or replace function public.ensure_user_cards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cards (user_id, scale_type, root)
  select
    new.id,
    s.scale_type,
    r.root
  from (values
    ('major'),
    ('natural_minor'),
    ('melodic_minor'),
    ('harmonic_minor'),
    ('dorian'),
    ('phrygian'),
    ('lydian'),
    ('mixolydian'),
    ('locrian'),
    ('minor_blues'),
    ('mixolydian_b9b13'),
    ('lydian_dominant'),
    ('altered'),
    ('bebop_major'),
    ('bebop_minor'),
    ('bebop_dominant'),
    ('bebop_diminished')
  ) as s(scale_type)
  cross join (values
    ('C'), ('G'), ('D'), ('A'), ('E'), ('B'), ('F#'),
    ('Db'), ('Ab'), ('Eb'), ('Bb'), ('F')
  ) as r(root)
  on conflict (user_id, scale_type, root) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.ensure_user_cards();
