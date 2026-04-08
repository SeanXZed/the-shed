'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAllCards } from '@/hooks/use-cards';
import { useBb } from '@/hooks/use-bb';
import { SCALE_DEFINITIONS, ROOTS, getScaleData, type Root } from '@the-shed/shared';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';

type Tr = ReturnType<typeof t>;

function relativeTime(dateStr: string, tr: Tr): string {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays < 0) return tr.timeOverdue;
  if (diffDays === 0) return tr.timeToday;
  if (diffDays === 1) return tr.timeTomorrow;
  return tr.timeInDays(diffDays);
}

function relativeClass(dateStr: string): string {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays < 0) return 'text-red-500';
  if (diffDays === 0) return 'text-orange-500';
  return 'text-muted-foreground';
}

export default function ScalesPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState<Root | null>(null);
  const { isBb, toggle: toggleBb } = useBb();
  const { lang } = useLanguage();
  const tr = t(lang);

  const { data: cards, isLoading } = useAllCards();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  // Build lookup: scale_type+root → card
  const cardMap = useMemo(() => {
    const map = new Map<string, typeof cards extends (infer T)[] | undefined ? T : never>();
    cards?.forEach(c => map.set(`${c.scale_type}:${c.root}`, c));
    return map;
  }, [cards]);

  // Filtered rows
  const rows = useMemo(() => {
    const lc = search.toLowerCase();
    return SCALE_DEFINITIONS.flatMap(def =>
      ROOTS
        .filter(root => !rootFilter || root === rootFilter)
        .filter(() => !lc || def.name.toLowerCase().includes(lc))
        .map(root => {
          const card = cardMap.get(`${def.id}:${root}`);
          const data = getScaleData(root as Root, def.id);
          return { def, root, card, data };
        }),
    );
  }, [cardMap, search, rootFilter]);

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
            onClick={toggleBb}
            className={cn(
              'ml-auto rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
              isBb
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {isBb ? 'Bb' : 'Concert'}
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-6 pt-2">
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
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colScale}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colRoot}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">{tr.colNotesDegrees}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colNextReview}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">{tr.colInterval}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">{tr.colReps}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ def, root, card, data }) => (
                    <tr
                      key={`${def.id}:${root}`}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2 font-medium">{def.name}</td>
                      <td className="px-4 py-2 font-mono">{isBb ? data.trumpetNotes[0] : root}</td>
                      <td className="px-4 py-2 hidden sm:table-cell font-mono text-xs leading-relaxed">
                        <div className="text-foreground tracking-wide">{(isBb ? data.trumpetNotes : data.concertNotes).join('  ')}</div>
                        <div className="text-muted-foreground tracking-wide">{def.degreeLabels.join('  ')}</div>
                      </td>
                      <td className={cn('px-4 py-2 tabular-nums', card ? relativeClass(card.next_review) : 'text-muted-foreground')}>
                        {card ? relativeTime(card.next_review, tr) : '—'}
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell text-muted-foreground tabular-nums">
                        {card ? `${card.interval_days}d` : '—'}
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell text-muted-foreground tabular-nums">
                        {card ? card.repetitions : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">{tr.noScalesMatch}</p>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
