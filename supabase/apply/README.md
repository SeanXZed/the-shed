# Full schema apply (source of truth)

The **authoritative** DDL lives in `supabase/tables/*.sql`. The files are applied in a fixed order so you can **recreate tables and policies** on an empty database.

## One-shot (recommended)

1. Set `DATABASE_URL` to your Postgres (local or Supabase direct connection string).
2. From the **repository root**:

```bash
chmod +x supabase/apply/apply.sh
export DATABASE_URL="postgresql://..."
./supabase/apply/apply.sh
```

3. The ordered list of files is in `apply-order.txt` (A → B → C → D sections).

## Supabase CLI `migration` history

`supabase/migrations/` is reduced to a **single marker** migration so `supabase db` commands do not point at a long chain of empty placeholder files. **New environments** should use `apply.sh` (or run each file in `apply-order.txt` in the Supabase SQL editor, in order).

If you already have a project that applied the old `0001`–`0007` files, you do not need to re-run them; the substantive SQL was only comments except where merged into `supabase/tables`.
