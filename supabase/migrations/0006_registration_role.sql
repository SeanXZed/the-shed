-- 0006_registration_role.sql
-- Apply: `handle_new_user` sets `profiles.is_tutor` from auth metadata `registration_role`
--        ('tutor' | otherwise student). Re-run from: supabase/tables/040_profiles.sql (partial).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reg text;
  want_tutor boolean;
begin
  reg := nullif(
    lower(trim(coalesce(new.raw_user_meta_data->>'registration_role', 'student'))),
    ''
  );
  want_tutor := (reg = 'tutor');

  insert into public.profiles (user_id, full_name, nickname, is_tutor)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    nullif(trim(split_part(new.email, '@', 1)), ''),
    want_tutor
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
