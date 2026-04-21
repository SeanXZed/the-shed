-- Tutors read linked students' practice data when tutor_student_links.status = 'accepted'.
-- Superadmin can read all practice rows (support).

-- ─── practice_sessions ───────────────────────────────────────────────────────
drop policy if exists "practice_sessions_select_linked_tutor" on public.practice_sessions;
create policy "practice_sessions_select_linked_tutor" on public.practice_sessions
  for select
  using (
    exists (
      select 1
      from public.tutor_student_links tsl
      where tsl.tutor_user_id = auth.uid()
        and tsl.student_user_id = practice_sessions.user_id
        and tsl.status = 'accepted'
    )
  );

drop policy if exists "practice_sessions_select_superadmin" on public.practice_sessions;
create policy "practice_sessions_select_superadmin" on public.practice_sessions
  for select
  using (public.is_superadmin());

-- ─── game_events ─────────────────────────────────────────────────────────────
drop policy if exists "game_events_select_linked_tutor" on public.game_events;
create policy "game_events_select_linked_tutor" on public.game_events
  for select
  using (
    exists (
      select 1
      from public.tutor_student_links tsl
      where tsl.tutor_user_id = auth.uid()
        and tsl.student_user_id = game_events.user_id
        and tsl.status = 'accepted'
    )
  );

drop policy if exists "game_events_select_superadmin" on public.game_events;
create policy "game_events_select_superadmin" on public.game_events
  for select
  using (public.is_superadmin());

-- ─── user_game_item_state ────────────────────────────────────────────────────
drop policy if exists "user_game_item_state_select_linked_tutor" on public.user_game_item_state;
create policy "user_game_item_state_select_linked_tutor" on public.user_game_item_state
  for select
  using (
    exists (
      select 1
      from public.tutor_student_links tsl
      where tsl.tutor_user_id = auth.uid()
        and tsl.student_user_id = user_game_item_state.user_id
        and tsl.status = 'accepted'
    )
  );

drop policy if exists "user_game_item_state_select_superadmin" on public.user_game_item_state;
create policy "user_game_item_state_select_superadmin" on public.user_game_item_state
  for select
  using (public.is_superadmin());

-- ─── tutor_student_links: student visibility + pending inserts + tutor resolve ─
drop policy if exists "tutor_student_links_select_student" on public.tutor_student_links;
create policy "tutor_student_links_select_student" on public.tutor_student_links
  for select
  using (student_user_id = auth.uid() or public.is_superadmin());

drop policy if exists "tutor_student_links_insert_student_pending" on public.tutor_student_links;
create policy "tutor_student_links_insert_student_pending" on public.tutor_student_links
  for insert
  with check (
    student_user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1
      from public.studio_memberships ms
      where ms.studio_id = tutor_student_links.studio_id
        and ms.user_id = auth.uid()
        and ms.role = 'student'
    )
    and exists (
      select 1
      from public.studio_memberships mt
      where mt.studio_id = tutor_student_links.studio_id
        and mt.user_id = tutor_student_links.tutor_user_id
        and mt.role = 'tutor'
    )
  );

drop policy if exists "tutor_student_links_update_tutor_status" on public.tutor_student_links;
create policy "tutor_student_links_update_tutor_status" on public.tutor_student_links
  for update
  using (tutor_user_id = auth.uid())
  with check (tutor_user_id = auth.uid());

drop policy if exists "tutor_student_links_delete_student_pending" on public.tutor_student_links;
create policy "tutor_student_links_delete_student_pending" on public.tutor_student_links
  for delete
  using (student_user_id = auth.uid() and status = 'pending');
