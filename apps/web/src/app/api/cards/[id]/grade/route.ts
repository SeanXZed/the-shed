import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { nextSM2State } from '@the-shed/shared';
import { getUserId } from '@/lib/supabase/server';

const gradeSchema = z.object({
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
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

  // Scoped client — RLS applies via the user's JWT.
  const token = request.headers.get('authorization')!.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: card, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
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

  const { data: updated, error: updateError } = await supabase
    .from('cards')
    .update({
      ease_factor: nextState.ease_factor,
      interval_days: nextState.interval_days,
      repetitions: nextState.repetitions,
      next_review: nextState.next_review.toISOString(),
      last_reviewed_at: nextState.last_reviewed_at.toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }

  return NextResponse.json({ card: updated });
}
