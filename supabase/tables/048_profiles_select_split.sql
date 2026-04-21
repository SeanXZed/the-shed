-- Split profiles SELECT policies so "own row" never depends on is_superadmin() (clearer + avoids edge cases).

drop policy if exists "profiles_select_own_or_superadmin" on public.profiles;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_select_superadmin_all" on public.profiles;
create policy "profiles_select_superadmin_all" on public.profiles
  for select
  using (public.is_superadmin());
