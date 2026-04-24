import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

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

  // Catalog writes use the service role so RLS need not allow arbitrary users
  // to insert/update global `games` rows (see `supabase/tables/035_game_seed_policies.sql`).
  const db = createServiceRoleClient();

  const { error } = await db
    .from('games')
    .upsert(GAMES, { onConflict: 'slug' });

  if (error) {
    console.error('[games/ensure] supabase error:', error);
    return NextResponse.json({ error: 'Failed to ensure games', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ensured: GAMES.length });
}

