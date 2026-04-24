-- Baseline marker: the full schema is defined under `supabase/tables/*.sql`
-- and applied in order via `supabase/apply/apply-order.txt` (see `supabase/apply/README.md`).
--
-- This file exists so the `supabase/migrations/` folder is not empty and documents
-- that incremental history was consolidated. Use `supabase/apply/apply.sh` to
-- build a fresh database from the table sources.

select 1 as migrations_baseline;
