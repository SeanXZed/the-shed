import { spawnSync } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Set DATABASE_URL (Postgres connection string).');
  process.exit(1);
}

const args = [
  databaseUrl,
  '-v',
  'ON_ERROR_STOP=1',
  '-f',
  'supabase/apply/verify_game_catalog_assert.sql',
];

const res = spawnSync('psql', args, { stdio: 'inherit' });
process.exit(res.status ?? 1);

