-- public.studio_memberships
-- Users in a studio with a role.

create table if not exists public.studio_memberships (
  studio_id  uuid        not null references public.studios(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null,
  created_at timestamptz not null default now(),

  primary key (studio_id, user_id),
  constraint studio_memberships_role_valid check (role in ('owner', 'admin', 'tutor', 'student'))
);

create index if not exists studio_memberships_user_id_idx on public.studio_memberships (user_id);
create index if not exists studio_memberships_studio_id_idx on public.studio_memberships (studio_id);

alter table public.studio_memberships enable row level security;

-- Read: members can read membership rows within the same studio.
drop policy if exists "studio_memberships_select_member" on public.studio_memberships;
create policy "studio_memberships_select_member" on public.studio_memberships
  for select
  using (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_memberships.studio_id
        and m.user_id = auth.uid()
    )
  );

-- Insert: admins/owners can add members; tutors can add students.
drop policy if exists "studio_memberships_insert_admin_or_tutor" on public.studio_memberships;
create policy "studio_memberships_insert_admin_or_tutor" on public.studio_memberships
  for insert
  with check (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_memberships.studio_id
        and m.user_id = auth.uid()
        and (
          m.role in ('owner', 'admin')
          or (m.role = 'tutor' and studio_memberships.role = 'student')
        )
    )
  );

-- Update: owners/admins can change roles; tutors cannot elevate roles.
drop policy if exists "studio_memberships_update_admin" on public.studio_memberships;
create policy "studio_memberships_update_admin" on public.studio_memberships
  for update
  using (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_memberships.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_memberships.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Delete: owners/admins can remove any member; users can remove themselves (leave studio).
drop policy if exists "studio_memberships_delete_admin_or_self" on public.studio_memberships;
create policy "studio_memberships_delete_admin_or_self" on public.studio_memberships
  for delete
  using (
    (user_id = auth.uid())
    or exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_memberships.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

