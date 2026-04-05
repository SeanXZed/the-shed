import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getUserId } from '@/lib/supabase/server';

const endSessionSchema = z.object({
  ended_at: z.string().datetime(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = endSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const token = request.headers.get('authorization')!.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data, error } = await supabase
    .from('practice_sessions')
    .update({ ended_at: parsed.data.ended_at })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  return NextResponse.json({ session: data });
}
