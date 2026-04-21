-- Students request to join a studio (owner accepts → studio_memberships role student).

create table if not exists public.studio_student_join_requests (
  id                  uuid        primary key default gen_random_uuid(),
  studio_id           uuid        not null references public.studios(id) on delete cascade,
  requester_user_id   uuid        not null references auth.users(id) on delete cascade,
  status              text        not null default 'pending',
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz,

  constraint studio_student_join_requests_status_valid
    check (status in ('pending', 'accepted', 'rejected'))
);

create unique index if not exists studio_student_join_requests_one_pending_idx
  on public.studio_student_join_requests (studio_id, requester_user_id)
  where status = 'pending';

create index if not exists studio_student_join_requests_studio_idx
  on public.studio_student_join_requests (studio_id);

alter table public.studio_student_join_requests enable row level security;

drop policy if exists "studio_student_join_requests_select" on public.studio_student_join_requests;
create policy "studio_student_join_requests_select" on public.studio_student_join_requests
  for select
  using (
    requester_user_id = auth.uid()
    or public.is_superadmin()
    or exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_student_join_requests.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "studio_student_join_requests_insert" on public.studio_student_join_requests;
create policy "studio_student_join_requests_insert" on public.studio_student_join_requests
  for insert
  with check (
    requester_user_id = auth.uid()
    and status = 'pending'
    and not exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_student_join_requests.studio_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "studio_student_join_requests_update_owner" on public.studio_student_join_requests;
create policy "studio_student_join_requests_update_owner" on public.studio_student_join_requests
  for update
  using (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_student_join_requests.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_student_join_requests.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );
