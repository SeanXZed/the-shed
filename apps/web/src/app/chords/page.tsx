'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { usePitch } from '@/hooks/use-bb';
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
  EB_OFFSET,
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
import { cn } from '@/lib/utils';

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

function qualityLabel(q: ChordQuality, tr: ReturnType<typeof t>): string {
  const map: Record<ChordQuality, string> = {
    maj7: tr.qualityMaj7, min7: tr.qualityMin7, dom7: tr.qualityDom7,
    min7b5: tr.qualityMin7b5, dim7: tr.qualityDim7, minmaj7: tr.qualityMinmaj7,
  };
  return map[q];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChordsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [qualityFilter, setQualityFilter] = useState<ChordQuality | null>(null);
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

  const rows = useMemo(() =>
    CHORD_QUALITIES
      .filter(q => !qualityFilter || q === qualityFilter)
      .flatMap(quality =>
        ROOTS
          .filter(root => !rootFilter || root === rootFilter)
          .map(root => {
            const tones = getChordTones(root, quality);
            const degrees = CHORD_TONE_DEGREES[quality];
            return { quality, root, tones, degrees };
          }),
      ),
  [qualityFilter, rootFilter]);

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
          <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colChord}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">{tr.colQuality}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">{tr.colTonesDegrees}</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground hidden lg:table-cell">{tr.colUsedBy}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ quality, root, tones, degrees }) => {
                    const displayRoot = semitoneOffset ? transposeNote(root, semitoneOffset) : root;
                    const displayTones = semitoneOffset ? transposeNotes(tones, semitoneOffset) : tones;
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">{tr.noChordsMatch}</p>
              )}
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
