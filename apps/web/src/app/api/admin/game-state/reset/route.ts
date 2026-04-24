import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/require-superadmin';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const schema = z.object({
  /** One of the canonical game slugs. */
  game_slug: z.enum(['full_scale', 'full_chord', 'sequence', 'progression_251', 'interval']),
  /**
   * Optional target user id. If omitted, defaults to the current superadmin user.
   * Useful for QA to reset your own state.
   */
  user_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const auth = await requireSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targetUserId = parsed.data.user_id ?? auth.userId;
  const gameSlug = parsed.data.game_slug;

  const svc = createServiceRoleClient();
  const { data: game, error: gameErr } = await svc
    .from('games')
    .select('id')
    .eq('slug', gameSlug)
    .maybeSingle();

  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 400 });
  if (!game?.id) return NextResponse.json({ error: 'Unknown game slug' }, { status: 400 });

  // Delete state rows for that user + that game only.
  // We do this in two steps to avoid relying on nested delete semantics.
  const { data: itemIds, error: itemsErr } = await svc
    .from('game_items')
    .select('id')
    .eq('game_id', game.id);

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 400 });

  const ids = (itemIds ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) return NextResponse.json({ ok: true, deleted: 0 });

  const { error: delErr, count } = await svc
    .from('user_game_item_state')
    .delete({ count: 'exact' })
    .eq('user_id', targetUserId)
    .in('game_item_id', ids);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, deleted: count ?? 0, user_id: targetUserId, game_slug: gameSlug });
}

