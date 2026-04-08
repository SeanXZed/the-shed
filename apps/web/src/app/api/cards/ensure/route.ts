import { NextResponse } from 'next/server';
import { ROOTS, SCALE_DEFINITIONS } from '@the-shed/shared';
import { getSupabaseRlsClient, getUserId } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const rows = SCALE_DEFINITIONS.flatMap((scale) =>
    ROOTS.map((root) => ({ user_id: userId, scale_type: scale.id, root })),
  );

  const db = getSupabaseRlsClient(request);
  const { error } = await db
    .from('cards')
    .upsert(rows, { onConflict: 'user_id,scale_type,root', ignoreDuplicates: true });

  if (error) {
    console.error('[ensure] supabase error:', error);
    return NextResponse.json({ error: 'Failed to ensure cards' }, { status: 500 });
  }

  return NextResponse.json({ inserted: rows.length });
}
