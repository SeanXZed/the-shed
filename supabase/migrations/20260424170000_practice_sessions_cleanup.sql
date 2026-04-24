-- Add daily cleanup for stale active practice sessions.
-- See `supabase/tables/036_practice_sessions_cleanup.sql` for the canonical definition.

create or replace function public.cleanup_stale_practice_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  day_start timestamptz := date_trunc('day', now());
  too_old_at timestamptz := now() - interval '60 minutes';
  updated_count integer := 0;
begin
  with last_activity as (
    select
      ps.id as practice_session_id,
      max(ge.occurred_at) as last_at
    from public.practice_sessions ps
    left join public.game_events ge
      on ge.practice_session_id = ps.id
    where ps.status = 'active'
    group by ps.id
  )
  update public.practice_sessions ps
  set
    status = 'abandoned',
    ended_at = coalesce(ps.ended_at, now())
  from last_activity la
  where ps.id = la.practice_session_id
    and (
      ps.started_at < too_old_at
      or (
        ps.started_at < day_start
        and (la.last_at is null or la.last_at < day_start)
      )
    );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'practice_sessions_cleanup_daily';
    perform cron.schedule(
      'practice_sessions_cleanup_daily',
      '5 0 * * *',
      $cmd$select public.cleanup_stale_practice_sessions();$cmd$
    );
  end if;
exception
  when undefined_table then
    null;
end $$;

