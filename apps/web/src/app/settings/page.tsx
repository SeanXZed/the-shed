'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionDeduped } from '@/lib/supabase/get-session-deduped';
import { AppSidebar } from '@/components/app-sidebar';
import { supabase } from '@/lib/supabase/client';
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
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import { usePitch, type PitchMode } from '@/hooks/use-bb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PITCHES: { id: PitchMode; labelKey: 'pitchConcert' | 'pitchBb' | 'pitchEb' }[] = [
  { id: 'concert', labelKey: 'pitchConcert' },
  { id: 'bb', labelKey: 'pitchBb' },
  { id: 'eb', labelKey: 'pitchEb' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const { lang } = useLanguage();
  const tr = t(lang);

  const { pitch, setPitch } = usePitch();

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authed) return;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, nickname')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        setProfileMsg(error.message);
        return;
      }
      setFullName(data?.full_name ?? '');
      setNickname(data?.nickname ?? '');
      setNewEmail(user.email ?? '');
    })();
  }, [authed]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const payload = {
      full_name: fullName.trim() || null,
      nickname: nickname.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updErr } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', user.id)
      .select('user_id');

    if (updErr) {
      setProfileMsg(updErr.message);
      return;
    }

    if (!updatedRows?.length) {
      const { error: insErr } = await supabase.from('profiles').insert({
        user_id: user.id,
        full_name: payload.full_name,
        nickname: payload.nickname,
        is_superadmin: false,
        updated_at: payload.updated_at,
      });
      if (insErr) {
        setProfileMsg(insErr.message);
        return;
      }
    }

    setSaved(true);
    setProfileMsg(tr.settingsProfileSaved);
    window.setTimeout(() => setSaved(false), 1200);
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    const updates: { email?: string; password?: string } = {};
    if (newPassword.trim()) updates.password = newPassword.trim();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email && newEmail.trim() && newEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      updates.email = newEmail.trim().toLowerCase();
    }
    if (Object.keys(updates).length === 0) {
      setProfileMsg(tr.settingsSaved);
      return;
    }
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      setProfileMsg(error.message);
      return;
    }
    setNewPassword('');
    setProfileMsg(tr.settingsAccountHint);
  }

  if (!authed) return null;

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
                <BreadcrumbPage>{tr.navSettings}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.settingsTitle}</h1>
            <p className="text-muted-foreground">{tr.settingsSubtitle}</p>
          </div>

          <form onSubmit={saveProfile} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <h2 className="text-base font-semibold">{tr.settingsProfileSection}</h2>
            <div className="grid gap-3 sm:max-w-md">
              <div>
                <label className="text-sm text-muted-foreground">{tr.settingsFullName}</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{tr.settingsNickname}</label>
                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} className="mt-1" />
              </div>
            </div>
            <Button type="submit">{tr.settingsSaveProfile}</Button>
          </form>

          <form onSubmit={saveAccount} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <h2 className="text-base font-semibold">{tr.settingsAccountSection}</h2>
            <p className="text-sm text-muted-foreground">{tr.settingsAccountHint}</p>
            <div className="grid gap-3 sm:max-w-md">
              <div>
                <label className="text-sm text-muted-foreground">{tr.settingsNewEmail}</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{tr.settingsNewPassword}</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={tr.authPasswordHintPlaceholder}
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary">
              {tr.settingsSaveProfile}
            </Button>
          </form>

          {profileMsg && <p className="text-sm text-muted-foreground">{profileMsg}</p>}

          <section className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{tr.settingsPitchLabel}</h2>
              <p className="text-sm text-muted-foreground">{tr.settingsPitchHelp}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {PITCHES.map((p) => {
                const active = pitch === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPitch(p.id, { persist: true });
                      setSaved(true);
                      window.setTimeout(() => setSaved(false), 1200);
                    }}
                    className={cn(
                      'rounded-lg border px-4 py-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-muted/40',
                    )}
                  >
                    <div className={cn('text-sm font-semibold', !active && 'text-foreground')}>
                      {tr[p.labelKey]}
                    </div>
                    <div className={cn('text-xs', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      {p.id === 'concert' ? 'C instruments' : p.id === 'bb' ? 'Bb instruments' : 'Eb instruments'}
                    </div>
                  </button>
                );
              })}
            </div>

            {saved && (
              <p className="text-sm text-muted-foreground">{tr.settingsSaved}</p>
            )}
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

