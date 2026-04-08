import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

// Server-only admin client using the secret key — bypasses RLS.
// Never import this in Client Components.
let _admin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_admin) _admin = createClient(URL, SECRET_KEY);
  return _admin;
}

// Verifies the Bearer token from a request and returns the user ID,
// or null if unauthenticated / invalid.
export async function getUserId(request: Request): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await getSupabaseAdmin().auth.getUser(token);
  return user?.id ?? null;
}
