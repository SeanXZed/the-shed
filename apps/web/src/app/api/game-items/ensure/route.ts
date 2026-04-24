import { NextResponse } from 'next/server';
import { buildGameSeedSpecs } from '@the-shed/shared';
import { getUserId } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

type GameSeedSpec = ReturnType<typeof buildGameSeedSpecs>[number];

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const db = createServiceRoleClient();

  // Ensure game catalog exists first.
  const { error: gameEnsureError } = await db.from('games').upsert([
    { slug: 'full_scale', title: 'Scale Game' },
    { slug: 'full_chord', title: 'Chord Game' },
    { slug: 'sequence', title: 'Sequence Game' },
    { slug: 'progression_251', title: 'Chord Progression (251)' },
    { slug: 'interval', title: 'Interval Game' },
  ], { onConflict: 'slug' });
  if (gameEnsureError) {
    console.error('[game-items/ensure] ensure games error:', gameEnsureError);
    return NextResponse.json({ error: 'Failed to ensure games', detail: gameEnsureError.message }, { status: 500 });
  }

  const specs = buildGameSeedSpecs() as GameSeedSpec[];
  const { data: games, error: gamesError } = await db.from('games').select('id,slug').in('slug', specs.map(s => s.slug));
  if (gamesError) {
    console.error('[game-items/ensure] load games error:', gamesError);
    return NextResponse.json({ error: 'Failed to load games', detail: gamesError.message }, { status: 500 });
  }

  const gameIdBySlug = new Map<string, string>((games ?? []).map((g) => [g.slug, g.id]));

  let ensured = 0;
  for (const spec of specs) {
    const gameId = gameIdBySlug.get(spec.slug);
    if (!gameId) continue;
    const rows = spec.items.map((it) => ({ game_id: gameId, canonical_key: it.canonical_key, data: it.data }));
    // Merge on conflict so existing DBs backfill *missing* keys and refresh `data` for known keys
    // (ignoreDuplicates would skip new canonical_keys when any row already existed).
    const { error } = await db
      .from('game_items')
      .upsert(rows, { onConflict: 'game_id,canonical_key' });
    if (error) {
      console.error('[game-items/ensure] upsert game_items error:', error);
      return NextResponse.json({ error: `Failed to ensure game_items for ${spec.slug}`, detail: error.message }, { status: 500 });
    }
    ensured += rows.length;
  }

  return NextResponse.json({ ok: true, ensured });
}

