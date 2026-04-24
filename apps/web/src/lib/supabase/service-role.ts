import { createClient } from '@supabase/supabase-js';

/** Server-only: never import from client components. */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  // Prefer current Supabase naming (secret key); keep legacy name for existing env files.
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase URL (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL) or server secret (SUPABASE_SECRET_KEY, or legacy SUPABASE_SERVICE_ROLE_KEY)',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
