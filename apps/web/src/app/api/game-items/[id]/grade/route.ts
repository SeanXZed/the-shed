import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nextSM2State } from '@the-shed/shared';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

const schema = z.object({
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  session_id: z.string().uuid().optional(),
  practice_mode: z.string().optional(),
  is_cram: z.boolean().optional(),
  meta: z.record(z.unknown()).optional(),
});

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const { grade, session_id, practice_mode, is_cram, meta } = parsed.data;
  const db = getSupabaseRlsClient(request);

  // Append-only telemetry (always).
  const { error: eventError } = await db.from('game_events').insert({
    user_id: userId,
    game_item_id: id,
    practice_session_id: session_id ?? null,
    grade,
    is_correct: grade >= 3,
    meta: { ...(meta ?? {}), ...(practice_mode ? { practice_mode } : {}) },
  });
  if (eventError) {
    return NextResponse.json({ error: 'Failed to record game event', detail: eventError.message }, { status: 500 });
  }

  const now = new Date();
  const isCram = is_cram === true;

  // Update scheduling + mastery unless cram.
  if (!isCram) {
    const { data: stateRow, error: stateError } = await db
      .from('user_game_item_state')
      .select('ease_factor,interval_days,repetitions,next_review,mastery')
      .eq('user_id', userId)
      .eq('game_item_id', id)
      .maybeSingle();

    if (stateError) {
      return NextResponse.json({ error: 'Failed to load state', detail: stateError.message }, { status: 500 });
    }

    const current = {
      ease_factor: stateRow?.ease_factor ?? 2.5,
      interval_days: stateRow?.interval_days ?? 1,
      repetitions: stateRow?.repetitions ?? 0,
      next_review: stateRow?.next_review ? new Date(stateRow.next_review) : now,
      last_reviewed_at: now,
    };

    const next = nextSM2State(current, grade);
    const mastery0 = typeof stateRow?.mastery === 'number' ? stateRow.mastery : 0;
    const mastery1 = clamp(mastery0 + (grade >= 3 ? 0.03 : -0.05), 0, 1);

    const { error: upsertError } = await db
      .from('user_game_item_state')
      .upsert({
        user_id: userId,
        game_item_id: id,
        ease_factor: next.ease_factor,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        next_review: next.next_review.toISOString(),
        mastery: mastery1,
        last_played_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to update state', detail: upsertError.message }, { status: 500 });
    }
  } else {
    // Still track last_played_at for engagement analytics.
    await db.from('user_game_item_state').upsert({
      user_id: userId,
      game_item_id: id,
      last_played_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  }

  return NextResponse.json({ ok: true, wrote_sm2: !isCram });
}

