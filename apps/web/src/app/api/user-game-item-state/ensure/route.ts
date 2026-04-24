import { NextResponse } from 'next/server';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

const allowedSlugs = new Set(['full_scale', 'full_chord', 'sequence', 'progression_251', 'interval']);

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const db = getSupabaseRlsClient(request);

  const url = new URL(request.url);
  const gameSlug = url.searchParams.get('game_slug');
  const gameSlugSafe = gameSlug && allowedSlugs.has(gameSlug) ? gameSlug : null;

  // Fetch game_items ids (seeded elsewhere). Keep idempotent; prefer scoping by `game_slug`
  // to avoid write amplification as the global catalog grows.
  const itemsQuery = db
    .from('game_items')
    .select('id,games!inner(slug)');

  const { data: items, error: itemsError } = gameSlugSafe
    ? await itemsQuery.eq('games.slug', gameSlugSafe)
    : await itemsQuery;

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to load game_items', detail: itemsError.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const rows = (items ?? []).map((it) => ({
    user_id: userId,
    game_item_id: (it as { id: string }).id,
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    next_review: now,
    mastery: 0,
    last_played_at: null,
  }));

  if (rows.length === 0) return NextResponse.json({ ok: true, ensured: 0 });

  const { error } = await db
    .from('user_game_item_state')
    .upsert(rows, { onConflict: 'user_id,game_item_id', ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to ensure user_game_item_state', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ensured: rows.length });
}

