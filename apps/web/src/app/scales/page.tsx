'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { usePitch } from '@/hooks/use-bb';
import { SCALE_DEFINITIONS, ROOTS, getScaleData, transposeNotes, BB_OFFSET, EB_OFFSET, type Root } from '@the-shed/shared';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';

export default function ScalesPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState<Root | null>(null);
  const { pitch, cycle: cyclePitch } = usePitch();
  const semitoneOffset = pitch === 'bb' ? BB_OFFSET : pitch === 'eb' ? EB_OFFSET : 0;
  const { lang } = useLanguage();
  const tr = t(lang);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  // Filtered rows (reference only — no per-card review state)
  const rows = useMemo(() => {
    const lc = search.toLowerCase();
    return SCALE_DEFINITIONS.flatMap(def =>
      ROOTS
        .filter(root => !rootFilter || root === rootFilter)
        .filter(() => !lc || def.name.toLowerCase().includes(lc))
        .map(root => {
          const data = getScaleData(root as Root, def.id);
          return { def, root, data };
        }),
    );
  }, [search, rootFilter]);

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
                <BreadcrumbPage>{tr.navScales}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <button
            onClick={cyclePitch}
            className={cn(
              'ml-auto rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
              pitch !== 'concert'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {pitch === 'bb' ? tr.pitchBb : pitch === 'eb' ? tr.pitchEb : tr.pitchConcert}
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.scaleLibraryTitle}</h1>
            <p className="text-muted-foreground">{tr.scaleLibrarySubtitle}</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder={tr.searchScalePlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50 sm:w-56"
            />
            <div className="flex flex-wrap gap-1">
              <Button
                size="xs"
                variant={rootFilter === null ? 'default' : 'outline'}
                onClick={() => setRootFilter(null)}
              >
                {tr.filterAll}
              </Button>
              {ROOTS.map(r => (
                <Button
                  key={r}
                  size="xs"
                  variant={rootFilter === r ? 'default' : 'outline'}
                  onClick={() => setRootFilter(r as Root)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colScale}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colRoot}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">{tr.colNotesDegrees}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ def, root, data }) => (
                    <tr
                      key={`${def.id}:${root}`}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2 font-medium">{def.name}</td>
                      <td className="px-4 py-2 font-mono">
                        {semitoneOffset === 0 ? root : semitoneOffset === BB_OFFSET ? data.trumpetNotes[0] : transposeNotes(data.concertNotes, semitoneOffset)[0]}
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell font-mono text-xs leading-relaxed">
                        <div className="text-foreground tracking-wide">
                          {(semitoneOffset === 0 ? data.concertNotes : semitoneOffset === BB_OFFSET ? data.trumpetNotes : transposeNotes(data.concertNotes, semitoneOffset)).join('  ')}
                        </div>
                        <div className="text-muted-foreground tracking-wide">{def.degreeLabels.join('  ')}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">{tr.noScalesMatch}</p>
              )}
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
