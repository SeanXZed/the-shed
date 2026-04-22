'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionDeduped } from '@/lib/supabase/get-session-deduped';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import { authFetch } from '@/lib/auth-fetch';
import type { PlatformRole } from '@/lib/platform-role';
import { profileToPlatformRole } from '@/lib/platform-role';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  nickname?: string | null;
  email: string | undefined;
  created_at: string | undefined;
  is_superadmin: boolean;
  is_tutor: boolean;
};

type Gate = 'pending' | 'ok' | 'forbidden';

function adminErrorMessage(
  j: { error?: string },
  tr: ReturnType<typeof t>,
): string {
  const code = j.error;
  if (code === 'LAST_SUPERADMIN') return tr.systemRoleLastSuperadmin;
  if (code === 'SELF_ROLE_CHANGE') return tr.systemRoleSelfForbidden;
  return code ?? 'Error';
}

const selectClass = cn(
  'h-8 max-w-[12rem] min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
  'dark:bg-input/30 dark:disabled:bg-input/80',
);

export default function SystemSettingsPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const tr = t(lang);
  const [authed, setAuthed] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else {
        setAuthed(true);
        setMeId(session.user.id);
      }
    });
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/users');
      if (res.status === 401) {
        setGate('forbidden');
        setRows([]);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(adminErrorMessage(j as { error?: string }, t(lang)));
        setGate('forbidden');
        return;
      }
      const j = (await res.json()) as { users: Row[] };
      setRows(j.users ?? []);
      setGate('ok');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setGate('forbidden');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    if (!authed) {
      setGate(null);
      return;
    }
    setGate('pending');
    void load();
  }, [authed, load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((j as { error?: string }).error ?? 'Error');
        return;
      }
      setEmail('');
      setPassword('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function removeUser(id: string) {
    if (!confirm('Delete this user?')) return;
    setError(null);
    try {
      const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(adminErrorMessage(j as { error?: string }, t(lang)));
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function setRole(userId: string, next: PlatformRole) {
    setError(null);
    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(adminErrorMessage(j as { error?: string }, t(lang)));
        await load();
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      await load();
    }
  }

  if (!authed) return null;

  if (gate === 'pending' || gate === null) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center p-6 text-muted-foreground">
            {tr.systemSettingsTitle}…
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (gate === 'forbidden') {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="p-6">
            <p className="text-muted-foreground">{tr.systemUnauthorized}</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{tr.navSystemSettings}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.systemSettingsTitle}</h1>
            <p className="text-muted-foreground">{tr.systemSettingsSubtitle}</p>
          </div>

          <form onSubmit={createUser} className="flex max-w-xl flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">{tr.systemUsersCreate}</h2>
            <Input
              type="email"
              placeholder={tr.authEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder={tr.systemUsersPasswordOptional}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit">{tr.systemUsersCreate}</Button>
          </form>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-center">
                  <th className="p-3 font-medium">{tr.settingsNickname}</th>
                  <th className="p-3 font-medium">{tr.systemUsersEmail}</th>
                  <th className="p-3 font-medium">{tr.systemUsersCreated}</th>
                  <th className="p-3 font-medium">{tr.systemUsersRole}</th>
                  <th className="p-3 font-medium">{tr.systemUsersOperation}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-muted-foreground text-center">
                      …
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-muted-foreground text-center">
                      {tr.systemUsersEmpty}
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => {
                    const current = profileToPlatformRole(u);
                    const isSelf = meId !== null && u.id === meId;
                    return (
                      <tr key={u.id} className="border-b border-border/60">
                        <td className="p-3 text-center">{u.nickname || '—'}</td>
                        <td className="p-3 text-center">{u.email ?? u.id}</td>
                        <td className="p-3 text-center text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <select
                            className={selectClass}
                            value={current}
                            disabled={isSelf}
                            title={isSelf ? tr.systemRoleSelfHint : undefined}
                            onChange={(e) => {
                              const next = e.target.value as PlatformRole;
                              if (next === current) return;
                              void setRole(u.id, next);
                            }}
                          >
                            <option value="student">{tr.systemRoleStudent}</option>
                            <option value="tutor">{tr.systemRoleTutor}</option>
                            <option value="superadmin">{tr.systemRoleSuperadmin}</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <Button type="button" variant="destructive" size="sm" onClick={() => void removeUser(u.id)}>
                            {tr.systemUsersDelete}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
