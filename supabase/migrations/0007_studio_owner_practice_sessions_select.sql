-- Allow studio owners/admins/tutors to read members' practice session summaries.
-- This powers Studio → Members → "View practice results".

drop policy if exists "practice_sessions_select_studio_staff" on public.practice_sessions;
create policy "practice_sessions_select_studio_staff" on public.practice_sessions
  for select
  using (
    exists (
      select 1
      from public.studio_memberships staff
      join public.studio_memberships member
        on member.studio_id = staff.studio_id
      where staff.user_id = auth.uid()
        and staff.role in ('owner', 'admin', 'tutor')
        and member.user_id = practice_sessions.user_id
    )
  );

