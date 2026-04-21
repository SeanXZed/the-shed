-- When a user creates a studio row, automatically add them as owner in studio_memberships.
-- Avoids a chicken-and-egg RLS problem (membership insert required an existing owner).

create or replace function public.after_studio_insert_assign_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.studio_memberships (studio_id, user_id, role)
  values (new.id, new.created_by_user_id, 'owner')
  on conflict (studio_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists studios_after_insert_owner on public.studios;
create trigger studios_after_insert_owner
  after insert on public.studios
  for each row execute procedure public.after_studio_insert_assign_owner();
