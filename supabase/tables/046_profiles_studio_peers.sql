-- Members of the same studio can read each other's profile display fields (rosters, join requests).

drop policy if exists "profiles_select_same_studio_peer" on public.profiles;
create policy "profiles_select_same_studio_peer" on public.profiles
  for select
  using (
    exists (
      select 1
      from public.studio_memberships mself
      inner join public.studio_memberships mpeer
        on mself.studio_id = mpeer.studio_id
      where mself.user_id = auth.uid()
        and mpeer.user_id = profiles.user_id
    )
  );
