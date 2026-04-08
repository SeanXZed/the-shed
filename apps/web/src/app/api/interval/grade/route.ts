import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

const schema = z.object({
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  session_id: z.string().uuid().optional(),
  root: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getSupabaseRlsClient(request);
  const { grade, session_id, root } = parsed.data;

  const { error } = await db.from('practice_events').insert({
    user_id: userId,
    session_id: session_id ?? null,
    practice_mode: 'interval',
    root: root ?? null,
    scale_type: null,
    grade,
    is_correct: grade >= 3,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record event', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

