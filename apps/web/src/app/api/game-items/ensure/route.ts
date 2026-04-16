import { NextResponse } from 'next/server';
import { ROOTS, SCALE_DEFINITIONS } from '@the-shed/shared';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

type GameSeedSpec = {
  slug: 'full_scale' | 'full_chord' | 'sequence' | 'progression_251' | 'interval';
  items: Array<{ canonical_key: string; data: Record<string, unknown> }>;
};

function unique<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function buildSeedSpecs(): GameSeedSpec[] {
  const scaleTypes = SCALE_DEFINITIONS.map((d) => d.id);
  const chordQualities = unique(SCALE_DEFINITIONS.map((d) => d.chordQuality));

  const scaleLikeItems = scaleTypes.flatMap((scaleType) =>
    ROOTS.map((root) => ({
      canonical_key: `${scaleType}::${root}`,
      data: { scale_type: scaleType, root },
    })),
  );

  const chordItems = chordQualities.flatMap((chordQuality) =>
    ROOTS.map((root) => ({
      canonical_key: `${chordQuality}::${root}`,
      data: { chord_quality: chordQuality, root },
    })),
  );

  const twoFiveOneItems = ROOTS.flatMap((key) =>
    (['major', 'minor'] as const).map((tonality) => ({
      canonical_key: `251::${key}::${tonality}`,
      data: { progression: '251', key, tonality },
    })),
  );

  // Intervals: keep canonical as interval_id::root::direction.
  // The practice UI currently uses these interval IDs.
  const intervalIds = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'] as const;
  const intervalItems = ROOTS.flatMap((root) =>
    intervalIds.flatMap((interval_id) =>
      (['up', 'down'] as const).map((direction) => ({
        canonical_key: `${interval_id}::${root}::${direction}`,
        data: { root, interval_id, direction },
      })),
    ),
  );

  return [
    { slug: 'full_scale', items: scaleLikeItems },
    { slug: 'sequence', items: scaleLikeItems },
    { slug: 'full_chord', items: chordItems },
    { slug: 'progression_251', items: twoFiveOneItems },
    { slug: 'interval', items: intervalItems },
  ];
}

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const db = getSupabaseRlsClient(request);

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

  const specs = buildSeedSpecs();
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
    const { error } = await db
      .from('game_items')
      .upsert(rows, { onConflict: 'game_id,canonical_key', ignoreDuplicates: true });
    if (error) {
      console.error('[game-items/ensure] upsert game_items error:', error);
      return NextResponse.json({ error: `Failed to ensure game_items for ${spec.slug}`, detail: error.message }, { status: 500 });
    }
    ensured += rows.length;
  }

  return NextResponse.json({ ok: true, ensured });
}

