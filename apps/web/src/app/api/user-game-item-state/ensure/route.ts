import { NextResponse } from 'next/server';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const db = getSupabaseRlsClient(request);

  // Fetch all game_items ids (seeded elsewhere). We keep it simple and idempotent:
  // create a state row for every item the user might encounter.
  const { data: items, error: itemsError } = await db
    .from('game_items')
    .select('id');

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to load game_items', detail: itemsError.message }, { status: 500 });
  }

  const now = new Date().toISOString();
  const rows = (items ?? []).map((it) => ({
    user_id: userId,
    game_item_id: it.id,
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

