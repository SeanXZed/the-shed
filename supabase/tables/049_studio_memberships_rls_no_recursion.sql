-- studio_memberships RLS must not subquery studio_memberships inside policies (infinite recursion).
-- Use SECURITY DEFINER helpers that read the table without RLS.

create or replace function public.is_member_of_studio(p_studio_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studio_memberships m
    where m.studio_id = p_studio_id and m.user_id = p_user_id
  );
$$;

create or replace function public.member_role_in_studio(p_studio_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.studio_memberships m
  where m.studio_id = p_studio_id and m.user_id = p_user_id
  limit 1;
$$;

grant execute on function public.is_member_of_studio(uuid, uuid) to authenticated;
grant execute on function public.member_role_in_studio(uuid, uuid) to authenticated;

drop policy if exists "studio_memberships_select_member" on public.studio_memberships;
create policy "studio_memberships_select_member" on public.studio_memberships
  for select
  using (public.is_member_of_studio(studio_id, auth.uid()));

drop policy if exists "studio_memberships_insert_admin_or_tutor" on public.studio_memberships;
create policy "studio_memberships_insert_admin_or_tutor" on public.studio_memberships
  for insert
  with check (
    public.member_role_in_studio(studio_id, auth.uid()) in ('owner', 'admin')
    or (
      public.member_role_in_studio(studio_id, auth.uid()) = 'tutor'
      and role = 'student'
    )
  );

drop policy if exists "studio_memberships_update_admin" on public.studio_memberships;
create policy "studio_memberships_update_admin" on public.studio_memberships
  for update
  using (public.member_role_in_studio(studio_id, auth.uid()) in ('owner', 'admin'))
  with check (public.member_role_in_studio(studio_id, auth.uid()) in ('owner', 'admin'));

drop policy if exists "studio_memberships_delete_admin_or_self" on public.studio_memberships;
create policy "studio_memberships_delete_admin_or_self" on public.studio_memberships
  for delete
  using (
    user_id = auth.uid()
    or public.member_role_in_studio(studio_id, auth.uid()) in ('owner', 'admin')
  );
