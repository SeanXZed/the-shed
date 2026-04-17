import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

const createSessionSchema = z.object({
  game_slug: z.enum(['full_scale', 'full_chord', 'sequence', 'progression_251', 'interval']),
  track_id: z.string().uuid().nullable().optional(),
  node_id: z.string().uuid().nullable().optional(),
  config: z.record(z.unknown()).optional(),
  is_cram: z.boolean().default(false),
});

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = createSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getSupabaseRlsClient(request);
  const { game_slug, track_id, node_id, config, is_cram } = parsed.data;

  const { data: game, error: gameError } = await db
    .from('games')
    .select('id')
    .eq('slug', game_slug)
    .single();

  if (gameError || !game?.id) {
    return NextResponse.json({ error: 'Unknown game', detail: gameError?.message }, { status: 400 });
  }

  const { data, error } = await db
    .from('practice_sessions')
    .insert({
      user_id: userId,
      game_id: game.id,
      track_id: track_id ?? null,
      node_id: node_id ?? null,
      status: 'active',
      config: (config ?? {}) as Record<string, unknown>,
      is_cram,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}
