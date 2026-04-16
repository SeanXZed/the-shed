-- public.* RBAC policies that depend on cross-table references.
--
-- IMPORTANT:
-- Postgres validates policy expressions at creation time. Policies that
-- reference other tables must be applied AFTER all referenced tables exist.
--
-- Apply order:
-- 1) 020_studios.sql
-- 2) 021_studio_memberships.sql
-- 3) 022_tutor_student_links.sql
-- 4) this file

-- ─────────────────────────────────────────────────────────────────────────────
-- studios: select/update/delete depend on studio_memberships
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "studios_select_member" on public.studios;
create policy "studios_select_member" on public.studios
  for select
  using (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studios.id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "studios_update_admin" on public.studios;
create policy "studios_update_admin" on public.studios
  for update
  using (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studios.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studios.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "studios_delete_owner" on public.studios;
create policy "studios_delete_owner" on public.studios
  for delete
  using (
    exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = studios.id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- tutor_student_links: policies depend on studio_memberships
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "tutor_student_links_select_tutor_or_admin" on public.tutor_student_links;
create policy "tutor_student_links_select_tutor_or_admin" on public.tutor_student_links
  for select
  using (
    tutor_user_id = auth.uid()
    or exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = tutor_student_links.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "tutor_student_links_insert_tutor_or_admin" on public.tutor_student_links;
create policy "tutor_student_links_insert_tutor_or_admin" on public.tutor_student_links
  for insert
  with check (
    tutor_user_id = auth.uid()
    or exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = tutor_student_links.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

drop policy if exists "tutor_student_links_delete_tutor_or_admin" on public.tutor_student_links;
create policy "tutor_student_links_delete_tutor_or_admin" on public.tutor_student_links
  for delete
  using (
    tutor_user_id = auth.uid()
    or exists (
      select 1
      from public.studio_memberships m
      where m.studio_id = tutor_student_links.studio_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

