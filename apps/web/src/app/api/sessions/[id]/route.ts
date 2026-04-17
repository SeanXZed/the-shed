import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

const patchSessionSchema = z
  .object({
    ended_at: z.string().datetime().optional(),
    items_completed: z.number().int().min(0).optional(),
    correct_count: z.number().int().min(0).optional(),
    items_presented: z.number().int().min(0).optional(),
    status: z.enum(['active', 'completed', 'abandoned']).optional(),
    config: z.record(z.unknown()).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = patchSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const db = getSupabaseRlsClient(request);

  const row: Record<string, unknown> = {};
  if (parsed.data.ended_at !== undefined) row.ended_at = parsed.data.ended_at;
  if (parsed.data.items_completed !== undefined) row.items_completed = parsed.data.items_completed;
  if (parsed.data.correct_count !== undefined) row.correct_count = parsed.data.correct_count;
  if (parsed.data.items_presented !== undefined) row.items_presented = parsed.data.items_presented;
  if (parsed.data.status !== undefined) row.status = parsed.data.status;
  if (parsed.data.config !== undefined) row.config = parsed.data.config;

  const { data, error } = await db
    .from('practice_sessions')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  return NextResponse.json({ session: data });
}
