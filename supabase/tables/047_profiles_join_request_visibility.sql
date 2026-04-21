-- Let owners see requester profiles for pending studio joins; tutors see student profiles for pending lesson links.

drop policy if exists "profiles_select_pending_tutor_join" on public.profiles;
create policy "profiles_select_pending_tutor_join" on public.profiles
  for select
  using (
    exists (
      select 1
      from public.studio_tutor_join_requests r
      inner join public.studio_memberships m on m.studio_id = r.studio_id
      where r.requester_user_id = profiles.user_id
        and r.status = 'pending'
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "profiles_select_pending_student_join" on public.profiles;
create policy "profiles_select_pending_student_join" on public.profiles
  for select
  using (
    exists (
      select 1
      from public.studio_student_join_requests r
      inner join public.studio_memberships m on m.studio_id = r.studio_id
      where r.requester_user_id = profiles.user_id
        and r.status = 'pending'
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "profiles_select_pending_tutor_student_link" on public.profiles;
create policy "profiles_select_pending_tutor_student_link" on public.profiles
  for select
  using (
    exists (
      select 1
      from public.tutor_student_links tsl
      where tsl.student_user_id = profiles.user_id
        and tsl.status = 'pending'
        and tsl.tutor_user_id = auth.uid()
    )
  );
