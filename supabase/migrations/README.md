# Migrations

Incremental SQL history was consolidated. **Full schema** is defined in `supabase/tables/*.sql` and applied in order via:

- `supabase/apply/apply-order.txt`
- `supabase/apply/apply.sh` (see `supabase/apply/README.md`)

The file `20260124120000_baseline_schema_from_supabase_tables.sql` is a **marker** so this folder is not empty.
