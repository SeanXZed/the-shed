import { NextResponse } from 'next/server';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

const GAMES: { slug: string; title: string }[] = [
  { slug: 'full_scale', title: 'Scale Game' },
  { slug: 'full_chord', title: 'Chord Game' },
  { slug: 'sequence', title: 'Sequence Game' },
  { slug: 'progression_251', title: 'Chord Progression (251)' },
  { slug: 'interval', title: 'Interval Game' },
];

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const db = getSupabaseRlsClient(request);

  // Best-effort upsert. Requires temporary insert policies during migration.
  const { error } = await db
    .from('games')
    .upsert(GAMES, { onConflict: 'slug' });

  if (error) {
    console.error('[games/ensure] supabase error:', error);
    return NextResponse.json({ error: 'Failed to ensure games', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ensured: GAMES.length });
}

