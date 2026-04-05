import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getUserId } from '@/lib/supabase/server';

const createSessionSchema = z.object({
  practice_mode: z.enum(['full_scale', 'full_chord', 'sequence', '251']),
  is_cram: z.boolean().default(false),
});

export async function POST(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const parsed = createSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const token = request.headers.get('authorization')!.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({ user_id: userId, ...parsed.data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}
