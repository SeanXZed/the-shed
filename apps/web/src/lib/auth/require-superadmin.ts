import { getUserId } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/** Validates JWT, then reads profiles with service role (faster than RLS for this check). */
export async function requireSuperadmin(request: Request): Promise<{ userId: string } | null> {
  const userId = await getUserId(request);
  if (!userId) return null;
  const svc = createServiceRoleClient();
  const { data, error } = await svc
    .from('profiles')
    .select('is_superadmin')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data?.is_superadmin) return null;
  return { userId };
}
