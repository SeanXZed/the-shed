-- public.tutor_student_links
-- Explicit tutor ↔ student relationships within a studio.
--
-- This is optional: some products only use studio_memberships roles and allow
-- tutors to see all students in their studio. Keeping explicit links supports:
-- - private rosters (tutor sees only their linked students)
-- - multiple tutors per studio with separate student sets

create table if not exists public.tutor_student_links (
  studio_id       uuid        not null references public.studios(id) on delete cascade,
  tutor_user_id   uuid        not null references auth.users(id) on delete cascade,
  student_user_id uuid        not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),

  primary key (studio_id, tutor_user_id, student_user_id),
  constraint tutor_student_links_tutor_not_student check (tutor_user_id <> student_user_id)
);

create index if not exists tutor_student_links_student_idx on public.tutor_student_links (studio_id, student_user_id);

alter table public.tutor_student_links enable row level security;

