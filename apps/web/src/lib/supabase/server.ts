import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Verifies the Bearer token from a request and returns the user ID,
// or null if unauthenticated / invalid.
export async function getUserId(request: Request): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await createClient(URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  }).auth.getUser(token);
  return user?.id ?? null;
}

export function getSupabaseRlsClient(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  return createClient(URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false },
    ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
  });
}
