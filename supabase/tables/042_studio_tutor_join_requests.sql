-- Tutors request to join a studio; studio owner (or future studio admin) resolves.

create table if not exists public.studio_tutor_join_requests (
  id                  uuid        primary key default gen_random_uuid(),
  studio_id           uuid        not null references public.studios(id) on delete cascade,
  requester_user_id   uuid        not null references auth.users(id) on delete cascade,
  status              text        not null default 'pending',
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz,

  constraint studio_tutor_join_requests_status_valid
    check (status in ('pending', 'accepted', 'rejected'))
);

create unique index if not exists studio_tutor_join_requests_one_pending_idx
  on public.studio_tutor_join_requests (studio_id, requester_user_id)
  where status = 'pending';

create index if not exists studio_tutor_join_requests_studio_idx
  on public.studio_tutor_join_requests (studio_id);

alter table public.studio_tutor_join_requests enable row level security;

drop policy if exists "studio_tutor_join_requests_select" on public.studio_tutor_join_requests;
create policy "studio_tutor_join_requests_select" on public.studio_tutor_join_requests
  for select
  using (
    requester_user_id = auth.uid()
    or public.is_superadmin()
    or exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_tutor_join_requests.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "studio_tutor_join_requests_insert" on public.studio_tutor_join_requests;
create policy "studio_tutor_join_requests_insert" on public.studio_tutor_join_requests
  for insert
  with check (
    requester_user_id = auth.uid()
    and status = 'pending'
    and not exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_tutor_join_requests.studio_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "studio_tutor_join_requests_update_owner" on public.studio_tutor_join_requests;
create policy "studio_tutor_join_requests_update_owner" on public.studio_tutor_join_requests
  for update
  using (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_tutor_join_requests.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studio_tutor_join_requests.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Discover studio by slug without membership (for join UI).
create or replace function public.get_studio_by_slug(p_slug text)
returns table (id uuid, name text, slug text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.slug from public.studios s where s.slug = p_slug limit 1;
$$;

grant execute on function public.get_studio_by_slug(text) to authenticated;

-- Discover studios by name or slug without membership (for join UI).
create or replace function public.get_studios_search(p_query text)
returns table (id uuid, name text, slug text)
language sql
stable
security definer
set search_path = public
as $$
  with q as (select nullif(trim(coalesce(p_query, '')), '') as v)
  select s.id, s.name, s.slug
  from public.studios s
  cross join q
  where q.v is not null
    and (
      s.slug = lower(q.v)
      or s.slug ilike '%' || lower(q.v) || '%'
      or s.name ilike '%' || q.v || '%'
    )
  order by
    case
      when s.slug = lower(q.v) then 0
      when lower(s.name) = lower(q.v) then 1
      when s.slug ilike lower(q.v) || '%' then 2
      when s.name ilike q.v || '%' then 3
      else 4
    end,
    s.name asc
  limit 10;
$$;

grant execute on function public.get_studios_search(text) to authenticated;
