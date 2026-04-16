import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

const endSessionSchema = z.object({
  ended_at: z.string().datetime(),
  items_completed: z.number().int().min(0).optional(),
  correct_count: z.number().int().min(0).optional(),
  status: z.enum(['completed', 'abandoned']).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = endSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const db = getSupabaseRlsClient(request);

  const { data, error } = await db
    .from('practice_sessions')
    .update({
      ended_at: parsed.data.ended_at,
      items_completed: parsed.data.items_completed,
      correct_count: parsed.data.correct_count,
      status: parsed.data.status ?? 'completed',
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  return NextResponse.json({ session: data });
}
