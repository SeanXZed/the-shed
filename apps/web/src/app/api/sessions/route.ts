import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserId, getSupabaseAdmin } from '@/lib/supabase/server';

const createSessionSchema = z.object({
  practice_mode: z.enum(['full_scale', 'full_chord', 'sequence', '251', 'interval']),
  root: z.string().nullable().optional(),
  sequence_count: z.number().int().min(3).max(7).nullable().optional(),
  is_cram: z.boolean().default(false),
});

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = createSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseAdmin() as any;
  const { data, error } = await db
    .from('practice_sessions')
    .insert({ user_id: userId, ...parsed.data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}
