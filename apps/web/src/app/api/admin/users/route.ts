import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/require-superadmin';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: Request) {
  const auth = await requireSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const svc = createServiceRoleClient();
  const { data, error } = await svc.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = data.users.map((u) => u.id);
  const { data: profs } = await svc
    .from('profiles')
    .select('user_id, is_superadmin, is_tutor')
    .in('user_id', ids);

  const rowByUser = new Map(
    (profs ?? []).map((p) => [
      p.user_id,
      { is_superadmin: p.is_superadmin, is_tutor: p.is_tutor },
    ]),
  );

  const users = data.users.map((u) => {
    const row = rowByUser.get(u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      is_superadmin: row?.is_superadmin ?? false,
      is_tutor: row?.is_tutor ?? false,
    };
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = body.password ? String(body.password) : undefined;
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    ...(password ? { password } : {}),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ user: data.user });
}
