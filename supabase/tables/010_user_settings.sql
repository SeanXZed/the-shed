-- public.user_settings
-- Per-user preferences (RLS-protected)

create table if not exists public.user_settings (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  pitch_mode  text        not null default 'concert', -- 'concert' | 'bb' | 'eb'
  updated_at  timestamptz not null default now(),

  constraint user_settings_pitch_mode_valid check (pitch_mode in ('concert', 'bb', 'eb'))
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own" on public.user_settings
  for delete using (auth.uid() = user_id);

