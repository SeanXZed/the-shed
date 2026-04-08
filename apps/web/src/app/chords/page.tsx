'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAllCards } from '@/hooks/use-cards';
import { useBb } from '@/hooks/use-bb';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import {
  ROOTS,
  CHORD_TONE_DEGREES,
  CHORD_SUFFIX,
  getChordTones,
  transposeNote,
  transposeNotes,
  BB_OFFSET,
  type Root,
  type ChordQuality,
} from '@the-shed/shared';
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

type Tr = ReturnType<typeof t>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CHORD_QUALITIES: ChordQuality[] = ['maj7', 'min7', 'dom7', 'min7b5', 'dim7', 'minmaj7'];

// Which scales use each chord quality (for context column)
const QUALITY_SCALES: Record<ChordQuality, string[]> = {
  maj7:    ['Major', 'Lydian', 'Bebop Major'],
  min7:    ['Dorian', 'Phrygian', 'Natural Minor', 'Bebop Minor', 'Minor Blues'],
  dom7:    ['Mixolydian', 'Lydian Dom.', 'Altered', 'Mixo b9b13', 'Bebop Dom.'],
  min7b5:  ['Locrian'],
  dim7:    ['Diminished scale'],
  minmaj7: ['Melodic Minor', 'Harmonic Minor'],
};

// Representative scale per quality for SM-2 lookup (null = no direct card)
const QUALITY_REP_SCALE: Record<ChordQuality, string | null> = {
  maj7:    'major',
  min7:    'dorian',
  dom7:    'mixolydian',
  min7b5:  'locrian',
  dim7:    null,
  minmaj7: 'melodic_minor',
};

function qualityLabel(q: ChordQuality, tr: Tr): string {
  const map: Record<ChordQuality, string> = {
    maj7: tr.qualityMaj7, min7: tr.qualityMin7, dom7: tr.qualityDom7,
    min7b5: tr.qualityMin7b5, dim7: tr.qualityDim7, minmaj7: tr.qualityMinmaj7,
  };
  return map[q];
}

function relativeTime(dateStr: string, tr: Tr): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return tr.timeOverdue;
  if (days === 0) return tr.timeToday;
  if (days === 1) return tr.timeTomorrow;
  return tr.timeInDays(days);
}

function relativeClass(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return 'text-rose-500';
  if (days === 0) return 'text-amber-500';
  return 'text-muted-foreground';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChordsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [qualityFilter, setQualityFilter] = useState<ChordQuality | null>(null);
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

  // Card lookup: scale_type:root → card
  const cardMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof cards>[number]>();
    cards?.forEach(c => map.set(`${c.scale_type}:${c.root}`, c));
    return map;
  }, [cards]);

  const rows = useMemo(() =>
    CHORD_QUALITIES
      .filter(q => !qualityFilter || q === qualityFilter)
      .flatMap(quality =>
        ROOTS
          .filter(root => !rootFilter || root === rootFilter)
          .map(root => {
            const tones = getChordTones(root, quality);
            const degrees = CHORD_TONE_DEGREES[quality];
            const symbol = `${root}${CHORD_SUFFIX[quality]}`;
            const repScale = QUALITY_REP_SCALE[quality];
            const card = repScale ? cardMap.get(`${repScale}:${root}`) : undefined;
            return { quality, root, symbol, tones, degrees, card };
          }),
      ),
  [qualityFilter, rootFilter, cardMap]);

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
                <BreadcrumbPage>{tr.navChords}</BreadcrumbPage>
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

        <div className="flex flex-1 flex-col gap-4 p-4 pt-2 sm:p-6 sm:pt-2">
          <div>
            <h1 className="text-3xl">{tr.chordLibraryTitle}</h1>
            <p className="text-muted-foreground">{tr.chordLibrarySubtitle}</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1">
              <Button
                size="xs"
                variant={qualityFilter === null ? 'default' : 'outline'}
                onClick={() => setQualityFilter(null)}
              >
                {tr.filterAllQualities}
              </Button>
              {CHORD_QUALITIES.map(q => (
                <Button
                  key={q}
                  size="xs"
                  variant={qualityFilter === q ? 'default' : 'outline'}
                  onClick={() => setQualityFilter(q)}
                >
                  {qualityLabel(q, tr)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                size="xs"
                variant={rootFilter === null ? 'default' : 'outline'}
                onClick={() => setRootFilter(null)}
              >
                {tr.filterAllRoots}
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
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colChord}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">{tr.colQuality}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colTonesDegrees}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden lg:table-cell">{tr.colUsedBy}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">{tr.colNextReview}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">{tr.colReps}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ quality, root, tones, degrees, card }) => {
                    const displayRoot = isBb ? transposeNote(root, BB_OFFSET) : root;
                    const displayTones = isBb ? transposeNotes(tones, BB_OFFSET) : tones;
                    const displaySymbol = `${displayRoot}${CHORD_SUFFIX[quality]}`;
                    return (
                      <tr
                        key={`${quality}:${root}`}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2 font-mono font-semibold">{displaySymbol}</td>
                        <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">
                          {qualityLabel(quality, tr)}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs leading-relaxed">
                          <div className="text-foreground tracking-wide">{displayTones.join('  ')}</div>
                          <div className="text-muted-foreground tracking-wide">{degrees.join('  ')}</div>
                        </td>
                        <td className="px-4 py-2 hidden lg:table-cell text-xs text-muted-foreground">
                          {QUALITY_SCALES[quality].join(', ')}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-2 hidden md:table-cell tabular-nums text-xs',
                            card ? relativeClass(card.next_review) : 'text-muted-foreground',
                          )}
                        >
                          {card ? relativeTime(card.next_review, tr) : '—'}
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell text-muted-foreground tabular-nums text-xs">
                          {card ? card.repetitions : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">{tr.noChordsMatch}</p>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
