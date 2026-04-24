-- Cleanup stale practice sessions.
--
-- Goal:
-- - Sessions can cross midnight safely (e.g. started at 23:58 and still active at 00:05).
-- - Any "active" session older than 60 minutes is impossible (20 questions) and should be
--   marked `abandoned` so dashboards/stats reflect reality.
-- - Additionally, any "active" session that was started on a previous day AND has no
--   activity today should be marked `abandoned`.
-- - If a user is still playing (has activity today) AND the session is <= 60 minutes old,
--   do NOT clean it.
--
-- Activity signal:
-- - max(game_events.occurred_at) for that practice_session_id.

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
      -- Hard cap: older than 60 minutes => abandon, regardless of midnight/activity
      ps.started_at < too_old_at
      -- Midnight cleanup: started before today and no activity today
      or (
        ps.started_at < day_start
        and (la.last_at is null or la.last_at < day_start)
      )
    );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Optional scheduling (pg_cron) — runs daily at 00:05.
-- Safe when pg_cron isn't installed: no-op.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- remove any existing job with the same name
    perform cron.unschedule(jobid) from cron.job where jobname = 'practice_sessions_cleanup_daily';
    perform cron.schedule(
      'practice_sessions_cleanup_daily',
      '5 0 * * *',
      $cmd$select public.cleanup_stale_practice_sessions();$cmd$
    );
  end if;
exception
  when undefined_table then
    -- cron schema not available even if extension exists in some environments
    null;
end $$;

