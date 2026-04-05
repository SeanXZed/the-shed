import { createClient } from '@supabase/supabase-js';

// Server-only admin client — never import this in Client Components.
// Uses service role key: bypasses RLS only for seeding; all per-user
// operations must pass the user's JWT to preserve RLS protection.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Verifies the Bearer token from a request and returns the user ID,
// or null if unauthenticated / invalid.
export async function getUserId(request: Request): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}
