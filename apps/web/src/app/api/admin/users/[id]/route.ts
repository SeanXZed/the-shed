import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/auth/require-superadmin';
import {
  isPlatformRole,
  platformRoleToFlags,
} from '@/lib/platform-role';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: target, error: readErr } = await admin
    .from('profiles')
    .select('is_superadmin')
    .eq('user_id', id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 400 });

  if (target?.is_superadmin) {
    const { count, error: countErr } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_superadmin', true)
      .neq('user_id', id);
    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 400 });
    if ((count ?? 0) < 1) {
      return NextResponse.json({ error: 'LAST_SUPERADMIN' }, { status: 400 });
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (auth.userId === id) {
    return NextResponse.json({ error: 'SELF_ROLE_CHANGE' }, { status: 403 });
  }

  let body: { role?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isPlatformRole(body.role)) {
    return NextResponse.json(
      { error: 'role must be "student", "tutor", or "superadmin"' },
      { status: 400 },
    );
  }

  const admin = createServiceRoleClient();
  const { data: current, error: readErr } = await admin
    .from('profiles')
    .select('is_superadmin, is_tutor')
    .eq('user_id', id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 400 });

  const flags = platformRoleToFlags(body.role);

  if (current?.is_superadmin && !flags.is_superadmin) {
    const { count, error: countErr } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_superadmin', true)
      .neq('user_id', id);
    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 400 });
    if ((count ?? 0) < 1) {
      return NextResponse.json({ error: 'LAST_SUPERADMIN' }, { status: 400 });
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({
      ...flags,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
