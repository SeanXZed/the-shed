'use client';

import { useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import { usePitch, type PitchMode } from '@/hooks/use-bb';

const PITCHES: { id: PitchMode; labelKey: 'pitchConcert' | 'pitchBb' | 'pitchEb' }[] = [
  { id: 'concert', labelKey: 'pitchConcert' },
  { id: 'bb', labelKey: 'pitchBb' },
  { id: 'eb', labelKey: 'pitchEb' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [saved, setSaved] = useState(false);
  const { lang } = useLanguage();
  const tr = t(lang);

  const { pitch, setPitch } = usePitch();

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

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

