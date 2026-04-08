import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nextSM2State } from '@the-shed/shared';
import { getUserId, getSupabaseAdmin } from '@/lib/supabase/server';

const gradeSchema = z.object({
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  session_id: z.string().uuid().optional(),
  practice_mode: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = gradeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'grade must be 1, 2, 3, or 4' }, { status: 400 });
  }

  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseAdmin() as any;

  const { data: card, error: fetchError } = await db
    .from('cards')
    .select('ease_factor, interval_days, repetitions, next_review, last_reviewed_at, root, scale_type')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !card) {
    return NextResponse.json(
      { error: 'Card not found', detail: fetchError?.message },
      { status: 404 },
    );
  }

  const nextState = nextSM2State(
    {
      ease_factor: card.ease_factor,
      interval_days: card.interval_days,
      repetitions: card.repetitions,
      next_review: new Date(card.next_review),
      last_reviewed_at: card.last_reviewed_at ? new Date(card.last_reviewed_at) : new Date(),
    },
    parsed.data.grade,
  );

  const { error: updateError } = await db
    .from('cards')
    .update({
      ease_factor: nextState.ease_factor,
      interval_days: nextState.interval_days,
      repetitions: nextState.repetitions,
      next_review: nextState.next_review.toISOString(),
      last_reviewed_at: nextState.last_reviewed_at.toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update card', detail: updateError.message },
      { status: 500 },
    );
  }

  // Record practice event if session context was provided
  if (parsed.data.session_id && parsed.data.practice_mode) {
    await db.from('practice_events').insert({
      user_id: userId,
      session_id: parsed.data.session_id,
      practice_mode: parsed.data.practice_mode,
      root: card.root,
      scale_type: card.scale_type,
      grade: parsed.data.grade,
      is_correct: parsed.data.grade >= 3,
    });
  }

  return NextResponse.json({
    next_review: nextState.next_review.toISOString(),
    interval_days: nextState.interval_days,
  });
}
