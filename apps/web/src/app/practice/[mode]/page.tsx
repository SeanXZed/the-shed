'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { Loader2, Volume2 } from 'lucide-react';
import {
  getScaleData,
  getScaleDefinition,
  getChordTones,
  getChordSymbol,
  get251,
  SCALE_MAP,
  ROOTS,
  transposeNote,
  transposeNotes,
  BB_OFFSET,
  EB_OFFSET,
  formatNoteWithEnharmonicHint,
  formatNotesWithEnharmonicHints,
  type ChordQuality,
  type Grade,
  type Root,
} from '@the-shed/shared';
import { supabase } from '@/lib/supabase/client';
import { getSessionDeduped } from '@/lib/supabase/get-session-deduped';
import { useAllGameItems, useDueGameItems, useInvalidateGameItems, type GameItemRow } from '@/hooks/use-game-items';
import { usePitch } from '@/hooks/use-bb';
import { useAdaptiveWeights } from '@/hooks/use-adaptive';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import { GAME_SLUG_TO_PATH } from '@/lib/practiceGameRoutes';
import { AppSidebar } from '@/components/app-sidebar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getEventXp } from '@/lib/xp';
import {
  type DeckItem,
  type IntervalItem,
  type PracticeMode,
  type StandardItem,
  type TwoFiveOneItem,
  getExpectedNotes,
} from '@/lib/practiceExpectedNotes';
import {
  type ChordPlayMode,
  getChordPlayMode,
  setChordPlayMode,
  playPracticeItem,
} from '@/lib/tonePlayback';

type Tr = ReturnType<typeof t>;

// ─── Constants ───────────────────────────────────────────────────────────────

const SLUG_TO_DB_MODE: Record<string, string> = {
  'full-scale': 'full_scale',
  'full-chord': 'full_chord',
  'sequence': 'sequence',
  '251': '251',
};

const DB_MODE_TO_GAME_SLUG: Record<string, 'full_scale' | 'full_chord' | 'sequence' | 'progression_251' | 'interval'> = {
  full_scale: 'full_scale',
  full_chord: 'full_chord',
  sequence: 'sequence',
  '251': 'progression_251',
  interval: 'interval',
};

const SESSION_SIZE = 20;

const INTERVALS = [
  { id: 'm2',  name: 'Minor 2nd',   semitones: 1  },
  { id: 'M2',  name: 'Major 2nd',   semitones: 2  },
  { id: 'm3',  name: 'Minor 3rd',   semitones: 3  },
  { id: 'M3',  name: 'Major 3rd',   semitones: 4  },
  { id: 'P4',  name: 'Perfect 4th', semitones: 5  },
  { id: 'TT',  name: 'Tritone',     semitones: 6  },
  { id: 'P5',  name: 'Perfect 5th', semitones: 7  },
  { id: 'm6',  name: 'Minor 6th',   semitones: 8  },
  { id: 'M6',  name: 'Major 6th',   semitones: 9  },
  { id: 'm7',  name: 'Minor 7th',   semitones: 10 },
  { id: 'M7',  name: 'Major 7th',   semitones: 11 },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

type PracticeConfig =
  | {
      type: 'root-free';
      sequenceCount: number;
      scaleDirection: 'up' | 'down' | 'mixed';
      chordInversions: 'root' | '1' | '2' | '3' | 'random';
    }
    | {
      type: 'root-selected';
      roots: Root[];
      sequenceCount: number;
      scaleDirection: 'up' | 'down' | 'mixed';
      chordInversions: 'root' | '1' | '2' | '3' | 'random';
    };

function parseSessionConfig(raw: Record<string, unknown>): PracticeConfig | null {
  const rm = raw.root_mode;
  const sd = raw.scale_direction;
  const inv = raw.chord_inversions;
  const scaleDirection =
    sd === 'up' || sd === 'down' || sd === 'mixed' ? sd : 'up';
  const chordInversions =
    inv === 'root' || inv === '1' || inv === '2' || inv === '3' || inv === 'random' ? inv : 'root';

  if (rm === 'root-free') {
    return {
      type: 'root-free',
      sequenceCount: typeof raw.sequence_count === 'number' ? raw.sequence_count : 5,
      scaleDirection,
      chordInversions,
    };
  }
  if (rm === 'root-selected' && Array.isArray(raw.roots)) {
    return {
      type: 'root-selected',
      roots: raw.roots as Root[],
      sequenceCount: typeof raw.sequence_count === 'number' ? raw.sequence_count : 5,
      scaleDirection,
      chordInversions,
    };
  }
  return null;
}

function buildSessionConfigPayload(
  practiceMode: PracticeMode,
  config: PracticeConfig,
  extras: {
    deck_game_item_ids: string[];
    current_index: number;
    session_seed: string;
  },
): Record<string, unknown> {
  const dbMode = SLUG_TO_DB_MODE[practiceMode] ?? practiceMode;
  return {
    mode: dbMode,
    root_mode: config.type,
    roots: config.type === 'root-selected' ? config.roots : null,
    sequence_count: practiceMode === 'sequence' ? config.sequenceCount : null,
    scale_direction: config.scaleDirection,
    chord_inversions: config.chordInversions,
    ...extras,
  };
}

function rotate<T>(arr: readonly T[], by: number): T[] {
  if (arr.length === 0) return [];
  const n = ((by % arr.length) + arr.length) % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

function resolveExpectedNotesWithVariants(args: {
  item: DeckItem;
  mode: PracticeMode;
  sequence: string[];
  semitoneOffset: number;
  scaleDirection: 'up' | 'down' | 'mixed';
  chordInversions: 'root' | '1' | '2' | '3' | 'random';
  // Stable-ish random per card
  seed: string;
}): { expected: string[]; direction?: 'up' | 'down'; inversion?: number } {
  const { item, mode, sequence, semitoneOffset, scaleDirection, chordInversions, seed } = args;

  // Default expected notes (existing logic)
  const base = getExpectedNotes(item, mode, sequence, semitoneOffset);

  if (mode === 'full-scale' && item.type === 'standard') {
    let dir: 'up' | 'down' = 'up';
    if (scaleDirection === 'down') dir = 'down';
    else if (scaleDirection === 'mixed') dir = (seed.charCodeAt(0) % 2 === 0) ? 'up' : 'down';
    const expected = dir === 'down' ? [...base].reverse() : base;
    return { expected, direction: dir };
  }

  if (mode === 'full-chord' && item.type === 'standard') {
    // 7th-chords: 4 tones. If not 4, just don't invert.
    if (base.length !== 4) return { expected: base, inversion: 0 };

    let inv: number;
    if (chordInversions === 'root') inv = 0;
    else if (chordInversions === '1') inv = 1;
    else if (chordInversions === '2') inv = 2;
    else if (chordInversions === '3') inv = 3;
    else inv = (seed.charCodeAt(seed.length - 1) % 4); // random including root

    const expected = rotate(base, inv);
    return { expected, inversion: inv };
  }

  return { expected: base };
}

function modeLabel(mode: PracticeMode, tr: Tr): string {
  switch (mode) {
    case 'full-scale': return tr.modeFullScale;
    case 'full-chord': return tr.modeFullChord;
    case 'sequence':   return tr.modeSequence;
    case '251':        return tr.mode251;
    case 'interval':   return tr.modeInterval;
  }
}

const GRADE_CLASSES: Record<Grade, string> = {
  1: 'border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 dark:border-rose-500/30 dark:bg-rose-500/15 dark:hover:bg-rose-500/25',
  2: 'border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 dark:bg-amber-500/15 dark:hover:bg-amber-500/25',
  3: 'border-sky-500/40 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 dark:bg-sky-500/15 dark:hover:bg-sky-500/25',
  4: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

function weightedSample<T>(
  items: readonly T[],
  count: number,
  weightOf: (item: T) => number,
): T[] {
  if (items.length === 0 || count <= 0) return [];

  const pool = [...items];
  const out: T[] = [];

  while (out.length < count) {
    // If we exhausted the pool, start again (allows repeats when pool < count).
    if (pool.length === 0) pool.push(...items);

    let total = 0;
    const weights = pool.map((it) => {
      const w = Math.max(0, weightOf(it));
      total += w;
      return w;
    });

    // Fallback to uniform if all weights are zero.
    if (total <= 0) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
      continue;
    }

    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= weights[idx] ?? 0;
      if (r <= 0) break;
    }
    const pickedIdx = Math.min(idx, pool.length - 1);
    out.push(pool.splice(pickedIdx, 1)[0]!);
  }

  return out;
}

function buildDeck(
  mode: PracticeMode,
  dueItems: GameItemRow[],
  allItems: GameItemRow[],
  config: PracticeConfig | null,
  weights: Record<string, number> | null,
): { deck: DeckItem[]; isCram: boolean } {
  if (mode === 'interval') {
    const roots = config?.type === 'root-selected' ? new Set(config.roots) : null;
    const parsed: IntervalItem[] = [];
    for (const it of allItems) {
      const [intervalId, root, direction] = it.canonical_key.split('::');
      if (!intervalId) continue;
      const intervalMeta = INTERVALS.find((x) => x.id === intervalId);
      if (!intervalMeta) continue;
      if (!root || (roots && !roots.has(root as Root))) continue;
      if (direction !== 'up' && direction !== 'down') continue;
      const semitones = direction === 'up' ? intervalMeta.semitones : -intervalMeta.semitones;
      const answer = transposeNote(root, semitones);
      parsed.push({
        type: 'interval',
        gameItemId: it.id,
        canonicalKey: it.canonical_key,
        root: root as Root,
        intervalId,
        intervalName: intervalMeta.name,
        semitones: intervalMeta.semitones,
        direction,
        answer,
      });
    }
    const result: DeckItem[] = [];
    while (result.length < SESSION_SIZE) result.push(...shuffled(parsed));
    return { deck: result.slice(0, SESSION_SIZE), isCram: false };
  }

  if (mode === '251') {
    const keys = config?.type === 'root-selected' ? new Set(config.roots) : null;
    const items: TwoFiveOneItem[] = [];
    for (const it of allItems) {
      const parts = it.canonical_key.split('::');
      if (parts[0] !== '251') continue;
      const key = parts[1] as Root | undefined;
      const tonality = parts[2] === 'minor' ? 'minor' : parts[2] === 'major' ? 'major' : null;
      if (!key || !tonality) continue;
      if (keys && !keys.has(key)) continue;
      items.push({
        type: '251',
        gameItemId: it.id,
        canonicalKey: it.canonical_key,
        key,
        tonality,
        combo: get251(key, tonality),
      });
    }
    const result: DeckItem[] = [];
    while (result.length < SESSION_SIZE) result.push(...shuffled(items));
    return { deck: result.slice(0, SESSION_SIZE), isCram: false };
  }

  // Standard modes (full-scale, full-chord, sequence)
  if (config?.type === 'root-selected') {
    const rootsSet = new Set(config.roots as Root[]);
    const rootItems = allItems.filter((it) => {
      const parts = it.canonical_key.split('::');
      return rootsSet.has(parts[1] as Root);
    });
    const chosen = weightedSample(
      rootItems,
      SESSION_SIZE,
      (it) => {
        return weights?.[it.canonical_key] ?? 1;
      },
    );
    return { deck: chosen.map((it) => toStandardItem(mode, it)).filter(Boolean) as DeckItem[], isCram: false };
  }

  // root-free: due queue capped at SESSION_SIZE
  const source = dueItems.length > 0 ? dueItems : allItems;
  const isCram = dueItems.length === 0;
  return {
    deck: weightedSample(
      source,
      SESSION_SIZE,
      (it) => {
        return weights?.[it.canonical_key] ?? 1;
      },
    ).map((it) => toStandardItem(mode, it)).filter(Boolean) as DeckItem[],
    isCram,
  };
}

function toStandardItem(mode: PracticeMode, it: GameItemRow): StandardItem | null {
  const parts = it.canonical_key.split('::');
  if (mode === 'full-chord') {
    const chordQuality = parts[0];
    const root = parts[1] as Root | undefined;
    if (!chordQuality || !root) return null;
    return {
      type: 'standard',
      kind: 'chord',
      gameItemId: it.id,
      canonicalKey: it.canonical_key,
      root,
      chordQuality: chordQuality as ChordQuality,
    };
  }
  const scaleType = parts[0];
  const root = parts[1] as Root | undefined;
  if (!scaleType || !root) return null;
  return { type: 'standard', kind: mode === 'sequence' ? 'sequence' : 'scale', gameItemId: it.id, canonicalKey: it.canonical_key, root, scaleType };
}

function gameItemRowToDeckItem(mode: PracticeMode, row: GameItemRow): DeckItem | null {
  if (mode === 'interval') {
    const [intervalId, root, direction] = row.canonical_key.split('::');
    if (!intervalId) return null;
    const intervalMeta = INTERVALS.find((x) => x.id === intervalId);
    if (!intervalMeta) return null;
    if (!root || (direction !== 'up' && direction !== 'down')) return null;
    const semitones = direction === 'up' ? intervalMeta.semitones : -intervalMeta.semitones;
    const answer = transposeNote(root, semitones);
    return {
      type: 'interval',
      gameItemId: row.id,
      canonicalKey: row.canonical_key,
      root: root as Root,
      intervalId,
      intervalName: intervalMeta.name,
      semitones: intervalMeta.semitones,
      direction,
      answer,
    };
  }
  if (mode === '251') {
    const parts = row.canonical_key.split('::');
    if (parts[0] !== '251') return null;
    const key = parts[1] as Root | undefined;
    const tonality = parts[2] === 'minor' ? 'minor' : parts[2] === 'major' ? 'major' : null;
    if (!key || !tonality) return null;
    return {
      type: '251',
      gameItemId: row.id,
      canonicalKey: row.canonical_key,
      key,
      tonality,
      combo: get251(key, tonality),
    };
  }
  return toStandardItem(mode, row);
}

function buildDeckFromGameItemIds(
  mode: PracticeMode,
  ids: string[],
  byId: Map<string, GameItemRow>,
): DeckItem[] {
  const out: DeckItem[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) continue;
    const item = gameItemRowToDeckItem(mode, row);
    if (item) out.push(item);
  }
  return out;
}

function generateSequence(scaleType: string, count = 5): string[] {
  const def = SCALE_MAP.get(scaleType);
  if (!def) return [];
  const degrees = [...def.degreeLabels];
  for (let i = degrees.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = degrees[i] as string;
    degrees[i] = degrees[j] as string;
    degrees[j] = tmp;
  }
  return degrees.slice(0, Math.min(count, degrees.length));
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

interface AnswerScore {
  correct: Set<string>;   // canonical notes the user got right
  missing: string[];      // expected notes the user missed
  wrong: string[];        // user notes that don't match any expected
  total: number;          // total expected notes
  suggestedGrade: Grade;
}

// Enharmonic equivalents → canonical form (flats preferred, F# retained)
const ENHARMONIC: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'E#': 'F',
  'G#': 'Ab', 'A#': 'Bb', 'B#': 'C',
  'Cb': 'B',  'Fb': 'E',  'Gb': 'F#',
};

function canonicalNote(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const n = s[0]!.toUpperCase() + s.slice(1).toLowerCase();
  return ENHARMONIC[n] ?? n;
}

function parseNotes(input: string): string[] {
  return input
    .split(/[\s,/|+\n]+/)
    .map(canonicalNote)
    .filter(n => n.length > 0);
}

const NOTE_INPUT_SCHEMA = z
  .string()
  .trim()
  .regex(/^[A-Ga-g](?:b|#)?$/, 'Invalid note');

function canonicalizeNoteInput(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const letter = s[0]!.toUpperCase();
  const acc = (s[1] ?? '').toLowerCase();
  if (acc === 'b') return `${letter}b`;
  if (acc === '#') return `${letter}#`;
  return letter;
}

function scoreAnswer(userInput: string, expectedNotes: string[]): AnswerScore {
  const parsed = parseNotes(userInput);
  const expectedCanon = expectedNotes.map(canonicalNote);
  const expectedSet = new Set(expectedCanon);
  const parsedSet = new Set(parsed.map(canonicalNote));

  const correct = new Set([...parsedSet].filter(n => expectedSet.has(n)));
  const missing = expectedNotes.filter(n => !parsedSet.has(canonicalNote(n)));
  const wrong   = [...parsedSet].filter(n => !expectedSet.has(n));
  const total   = expectedNotes.length;
  const pct     = total > 0 ? correct.size / total : 0;

  let suggestedGrade: Grade;
  if (pct === 1 && wrong.length === 0)       suggestedGrade = 4;
  else if (pct >= 0.7 && wrong.length <= 1)  suggestedGrade = 3;
  else if (pct > 0)                          suggestedGrade = 2;
  else                                        suggestedGrade = 1;

  return { correct, missing, wrong, total, suggestedGrade };
}

async function gradeCard(
  gameItemId: string,
  grade: Grade,
  sessionId?: string,
  practiceMode?: string,
  isCram?: boolean,
  meta?: Record<string, unknown>,
): Promise<void> {
  const { data: { session } } = await getSessionDeduped();
  const res = await fetch(`/api/game-items/${gameItemId}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({
      grade,
      ...(isCram ? { is_cram: true } : {}),
      ...(sessionId ? { session_id: sessionId, practice_mode: practiceMode } : {}),
      ...(meta ? { meta } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
    throw new Error(body.detail ?? body.error ?? `Grade failed (${res.status})`);
  }
}

// ─── Note display helper ──────────────────────────────────────────────────────

function NoteRow({ notes, degrees }: { notes: readonly string[]; degrees: readonly string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-separate border-spacing-x-3 border-spacing-y-1 text-center">
        <tbody>
          <tr>
            {notes.map((note, i) => (
              <td key={i} className="text-xl font-semibold tabular-nums">{formatNoteWithEnharmonicHint(note)}</td>
            ))}
          </tr>
          <tr>
            {degrees.map((deg, i) => (
              <td key={i} className="text-sm text-muted-foreground tabular-nums">{deg}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Card faces ───────────────────────────────────────────────────────────────

function StandardFront({ item, mode, sequence, semitoneOffset, tr }: {
  item: StandardItem;
  mode: PracticeMode;
  sequence: string[];
  semitoneOffset: number;
  tr: Tr;
}) {
  const displayRoot = semitoneOffset === 0 ? item.root : transposeNote(item.root, semitoneOffset);
  const chordSymbol = (() => {
    if (item.kind === 'chord') return getChordSymbol(displayRoot, item.chordQuality);
    const def = getScaleDefinition(item.scaleType);
    return getChordSymbol(displayRoot, def.chordQuality);
  })();

  if (mode === 'full-scale') {
    if (item.kind === 'chord') return null;
    const data = getScaleData(item.root, item.scaleType);
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">{tr.labelScale}</p>
        <p className="text-5xl font-bold">{displayRoot}</p>
        <p className="text-2xl text-muted-foreground">{data.scaleName}</p>
      </div>
    );
  }

  if (mode === 'full-chord') {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">{tr.labelChordTones}</p>
        <p className="text-5xl font-bold">{chordSymbol}</p>
      </div>
    );
  }

  // sequence — show degree numbers only (no # or b); user knows the scale so knows the quality
  if (item.kind === 'chord') return null;
  const data = getScaleData(item.root, item.scaleType);
  return (
    <div className="text-center space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">{tr.labelSequence}</p>
        <p className="text-3xl font-bold">{displayRoot} {data.scaleName}</p>
      </div>
      <p className="text-2xl font-mono tracking-widest text-primary">
        {sequence.map(d => d.replace(/[b#]/g, '')).join('  ·  ')}
      </p>
      <p className="text-sm text-muted-foreground">{tr.whatDegrees}</p>
    </div>
  );
}

function StandardBack({ item, mode, sequence, semitoneOffset }: {
  item: StandardItem;
  mode: PracticeMode;
  sequence: string[];
  semitoneOffset: number;
}) {
  if (mode === 'full-chord' && item.kind === 'chord') {
    const displayRoot = semitoneOffset ? (transposeNote(item.root, semitoneOffset) as Root) : item.root;
    const tones = getChordTones(displayRoot, item.chordQuality);
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          {getChordSymbol(displayRoot, item.chordQuality)}
        </p>
        <NoteRow notes={tones} degrees={['1', '3', '5', '7']} />
      </div>
    );
  }

  if (item.kind === 'chord') return null;
  const data = getScaleData(item.root, item.scaleType);
  const def = getScaleDefinition(item.scaleType);
  const notes = semitoneOffset ? transposeNotes(data.concertNotes, semitoneOffset) : data.concertNotes;
  const chordTones = getChordTones((semitoneOffset ? transposeNote(item.root, semitoneOffset) : item.root) as Root, def.chordQuality);

  if (mode === 'full-scale') {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          {data.scaleName} — {getChordSymbol((semitoneOffset ? transposeNote(item.root, semitoneOffset) : item.root) as Root, def.chordQuality)}
        </p>
        <NoteRow notes={notes} degrees={data.scaleDegrees} />
      </div>
    );
  }

  if (mode === 'full-chord') {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          {getChordSymbol((semitoneOffset ? transposeNote(item.root, semitoneOffset) : item.root) as Root, def.chordQuality)}
        </p>
        <NoteRow notes={chordTones} degrees={data.chordDegrees} />
      </div>
    );
  }

  // sequence — map selected degrees back to note names
  const degreeToNote = Object.fromEntries(
    data.scaleDegrees.map((deg, i) => [deg, notes[i] ?? '?'])
  );
  const sequenceNotes = sequence.map(deg => degreeToNote[deg] ?? '?');

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-muted-foreground">{data.scaleName}</p>
      <NoteRow notes={sequenceNotes} degrees={sequence} />
    </div>
  );
}

function TwoFiveOneFront({ item, semitoneOffset, tr }: { item: TwoFiveOneItem; semitoneOffset: number; tr: Tr }) {
  const iiData = getScaleData(item.combo.ii.root, item.combo.ii.scaleType);
  const vData = getScaleData(item.combo.V.root, item.combo.V.scaleType);
  const iData = getScaleData(item.combo.I.root, item.combo.I.scaleType);

  const iiSymbol =
    semitoneOffset === 0 ? iiData.concertChordSymbol :
    semitoneOffset === BB_OFFSET ? iiData.trumpetChordSymbol :
    getChordSymbol(transposeNote(item.combo.ii.root, semitoneOffset), getScaleDefinition(item.combo.ii.scaleType).chordQuality);
  const vSymbol =
    semitoneOffset === 0 ? vData.concertChordSymbol :
    semitoneOffset === BB_OFFSET ? vData.trumpetChordSymbol :
    getChordSymbol(transposeNote(item.combo.V.root, semitoneOffset), getScaleDefinition(item.combo.V.scaleType).chordQuality);
  const iSymbol =
    semitoneOffset === 0 ? iData.concertChordSymbol :
    semitoneOffset === BB_OFFSET ? iData.trumpetChordSymbol :
    getChordSymbol(transposeNote(item.combo.I.root, semitoneOffset), getScaleDefinition(item.combo.I.scaleType).chordQuality);

  const displayKey =
    semitoneOffset === 0 ? item.key :
    semitoneOffset === BB_OFFSET ? iiData.trumpetNotes[0] :
    transposeNote(item.key, semitoneOffset);

  return (
    <div className="text-center space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">{tr.label251}</p>
        <p className="text-3xl font-bold">{formatNoteWithEnharmonicHint(displayKey ?? item.key)} {item.tonality === 'major' ? 'Major' : 'Minor'}</p>
      </div>
      <div className="flex items-center justify-center gap-4 text-2xl font-mono">
        <span className="text-muted-foreground">{iiSymbol}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-muted-foreground">{vSymbol}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-semibold">{iSymbol}</span>
      </div>
      <p className="text-sm text-muted-foreground">{tr.nameChordTones}</p>
    </div>
  );
}

function TwoFiveOneBack({ item, semitoneOffset }: { item: TwoFiveOneItem; semitoneOffset: number }) {
  const chords = [
    { label: 'ii', data: getScaleData(item.combo.ii.root, item.combo.ii.scaleType) },
    { label: 'V',  data: getScaleData(item.combo.V.root, item.combo.V.scaleType) },
    { label: 'I',  data: getScaleData(item.combo.I.root, item.combo.I.scaleType) },
  ];

  return (
    <div className="space-y-6">
      {chords.map(({ label, data }, idx) => {
        const root = (idx === 0 ? item.combo.ii.root : idx === 1 ? item.combo.V.root : item.combo.I.root);
        const scaleType = (idx === 0 ? item.combo.ii.scaleType : idx === 1 ? item.combo.V.scaleType : item.combo.I.scaleType);
        const def = getScaleDefinition(scaleType);
        const symbol =
          semitoneOffset === 0 ? data.concertChordSymbol :
          semitoneOffset === BB_OFFSET ? data.trumpetChordSymbol :
          getChordSymbol(transposeNote(root, semitoneOffset), def.chordQuality);
        const tones =
          semitoneOffset === 0 ? data.concertChordTones :
          semitoneOffset === BB_OFFSET ? data.trumpetChordTones :
          getChordTones(transposeNote(root, semitoneOffset), def.chordQuality);
        return (
          <div key={label} className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-lg font-semibold">{symbol} <span className="text-sm font-normal text-muted-foreground">({data.scaleName})</span></p>
            <NoteRow notes={tones} degrees={data.chordDegrees} />
          </div>
        );
      })}
    </div>
  );
}

function IntervalFront({ item, semitoneOffset, tr }: { item: IntervalItem; semitoneOffset: number; tr: Tr }) {
  const displayRoot = semitoneOffset ? transposeNote(item.root, semitoneOffset) : item.root;
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-muted-foreground uppercase tracking-widest">{tr.labelInterval}</p>
      <div className="space-y-1">
        <p className="text-5xl font-bold">{displayRoot}</p>
        <p className="text-2xl text-muted-foreground">{item.intervalName}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {item.direction === 'up' ? '↑ up' : '↓ down'} &nbsp;·&nbsp; {item.semitones} semitone{item.semitones !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function IntervalBack({ item, semitoneOffset }: { item: IntervalItem; semitoneOffset: number }) {
  const displayRoot = semitoneOffset ? transposeNote(item.root, semitoneOffset) : item.root;
  const displayAnswer = semitoneOffset ? transposeNote(item.answer, semitoneOffset) : item.answer;
  return (
    <div className="text-center space-y-3">
      <p className="text-sm text-muted-foreground">
        {displayRoot} {item.direction === 'up' ? '+' : '−'} {item.intervalName}
      </p>
      <p className="text-5xl font-bold tracking-tight">{displayAnswer}</p>
    </div>
  );
}

// ─── Answer review ────────────────────────────────────────────────────────────

function AnswerReview({ userAnswer, score, tr }: { userAnswer: string; score: AnswerScore | null; tr: Tr }) {
  if (!userAnswer.trim()) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{tr.yourAnswer}</p>
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground/50">
          {tr.noAnswer}
        </p>
      </div>
    );
  }

  if (!score) return null;

  const { correct, missing, wrong, total } = score;
  const allCorrect = correct.size === total && wrong.length === 0;
  const tokens = parseNotes(userAnswer);

  const scoreBadgeClass = allCorrect
    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
    : wrong.length > 0 || missing.length > 0
      ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400'
      : 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{tr.yourAnswer}</p>
        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', scoreBadgeClass)}>
          {allCorrect ? '✓ Perfect' : `${correct.size} / ${total} correct`}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/20 px-4 py-3">
        {tokens.length === 0 ? (
          <span className="text-sm text-muted-foreground/50">—</span>
        ) : tokens.map((token, i) => {
          const canon = canonicalNote(token);
          const isCorrect = correct.has(canon);
          return (
            <span
              key={i}
              className={cn(
                'rounded-md px-2 py-0.5 text-sm font-mono font-medium',
                isCorrect
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 line-through',
              )}
            >
              {token}
            </span>
          );
        })}
      </div>

      {missing.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Missing:{' '}
          <span className="font-mono text-rose-500">{formatNotesWithEnharmonicHints(missing).join('  ')}</span>
        </p>
      )}
    </div>
  );
}

// ─── Grade buttons ────────────────────────────────────────────────────────────

function GradeButtons({ onGrade, loading, suggested, tr }: {
  onGrade: (g: Grade) => void;
  loading: boolean;
  suggested?: Grade | undefined;
  tr: Tr;
}) {
  const gradeLabels: Record<Grade, { label: string; description: string }> = {
    1: { label: tr.grade1Label, description: tr.grade1Desc },
    2: { label: tr.grade2Label, description: tr.grade2Desc },
    3: { label: tr.grade3Label, description: tr.grade3Desc },
    4: { label: tr.grade4Label, description: tr.grade4Desc },
  };
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {([1, 2, 3, 4] as Grade[]).map((g) => {
        const { label, description } = gradeLabels[g];
        return (
          <button
            key={g}
            disabled={loading}
            onClick={() => onGrade(g)}
            className={cn(
              'group flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-3 transition-all disabled:pointer-events-none disabled:opacity-50',
              GRADE_CLASSES[g],
              suggested === g && 'ring-2 ring-offset-2 ring-offset-background opacity-100 scale-[1.03]',
            )}
          >
            <span className="text-xs font-medium opacity-50">{g}</span>
            <span className="text-sm font-semibold leading-tight">{label}</span>
            <span className="text-xs opacity-60">{description}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PracticeModePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode } = useParams() as { mode: string };
  const practiceMode = mode as PracticeMode;
  const resumeId = searchParams.get('resume');

  const [authed, setAuthed] = useState(false);
  const [ensured, setEnsured] = useState(false);
  const [ensureError, setEnsureError] = useState<string | null>(null);

  // Config — always starts null; all modes show the config screen first
  const [config, setConfig] = useState<PracticeConfig | null>(null);

  // Practice state
  const [deck, setDeck] = useState<DeckItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [done, setDone] = useState(false);
  const [isCram, setIsCram] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const [userAnswerTokens, setUserAnswerTokens] = useState<string[]>([]);
  const [score, setScore] = useState<AnswerScore | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [chordPlayMode, setChordPlayModeState] = useState<ChordPlayMode>(() => getChordPlayMode());
  const [playing, setPlaying] = useState(false);
  const [expectedNotes, setExpectedNotes] = useState<string[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [lastEarnedXp, setLastEarnedXp] = useState<number | null>(null);
  const clearLastXpTimerRef = useRef<number | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);
  const skipDeckBuildRef = useRef(false);

  const { pitch, cycle: cyclePitch } = usePitch();
  const semitoneOffset = pitch === 'bb' ? BB_OFFSET : pitch === 'eb' ? EB_OFFSET : 0;
  const { lang } = useLanguage();
  const tr = t(lang);
  const dbMode = SLUG_TO_DB_MODE[practiceMode] ?? practiceMode;
  const gameSlug = (
    dbMode === 'full_scale' ? 'full_scale' :
    dbMode === 'full_chord' ? 'full_chord' :
    dbMode === 'sequence' ? 'sequence' :
    dbMode === '251' ? 'progression_251' :
    dbMode === 'interval' ? 'interval' :
    'full_scale'
  );
  const shouldUseWeights = dbMode === 'full_scale' || dbMode === 'full_chord' || dbMode === 'sequence';
  const { data: adaptiveWeights, isLoading: loadingWeights } = useAdaptiveWeights(gameSlug);
  const { data: dueItems, isLoading: loadingDue } = useDueGameItems(gameSlug);
  const { data: allItems, isLoading: loadingAll } = useAllGameItems(gameSlug);
  const invalidate = useInvalidateGameItems();
  const sessionIdRef = useRef<string | null>(null);
  const reviewedCountRef = useRef(0);
  const correctCountRef = useRef(0);
  const lastActivityAtRef = useRef<number>(Date.now());
  /** Only rebuild deck + reset index when mode/config change — not when dueCards/allCards refetch after invalidate(). */
  const deckBuildKeyRef = useRef<string | null>(null);
  const sessionSeedRef = useRef<string>('seed');

  // Auth gate
  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  // Ensure games/items/state exist (once per session)
  useEffect(() => {
    if (!authed || ensured) return;
    getSessionDeduped().then(async ({ data: { session } }) => {
      if (!session) return;
      setEnsureError(null);
      const headers = { Authorization: `Bearer ${session.access_token}` };

      async function mustPost(url: string) {
        const res = await fetch(url, { method: 'POST', headers });
        if (res.ok) return;
        const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new Error(body.detail ?? body.error ?? `${url} failed (${res.status})`);
      }

      try {
        await mustPost('/api/games/ensure');
        await mustPost('/api/game-items/ensure');
        await mustPost('/api/user-game-item-state/ensure');
      } catch (e) {
        setEnsureError(e instanceof Error ? e.message : 'Failed to set up practice items');
        return;
      }
      setEnsured(true);
      invalidate(gameSlug);
    });
  }, [authed, ensured, invalidate, gameSlug]);

  // Resume an active session from ?resume= (deck + index from server config)
  useEffect(() => {
    if (!resumeId) {
      setResumeError(null);
      return;
    }
    if (!ensured || loadingAll || !allItems?.length) return;

    let cancelled = false;
    (async () => {
      setResumeError(null);
      const { data: row, error } = await supabase
        .from('practice_sessions')
        .select('id, status, config, is_cram, items_completed, correct_count, games!inner(slug)')
        .eq('id', resumeId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !row) {
        setResumeError(t(lang).resumeSessionFailed);
        return;
      }
      const slugFromSession = (row as { games?: { slug?: string } }).games?.slug;
      if (!slugFromSession || GAME_SLUG_TO_PATH[slugFromSession] !== mode) {
        setResumeError(t(lang).resumeSessionFailed);
        return;
      }
      if ((row as { status?: string }).status !== 'active') {
        setResumeError(t(lang).resumeSessionFailed);
        return;
      }

      const rawConfig = ((row as { config?: Record<string, unknown> }).config ?? {}) as Record<string, unknown>;
      const parsed = parseSessionConfig(rawConfig);
      if (!parsed) {
        setResumeError(t(lang).resumeSessionFailed);
        return;
      }

      const ids = Array.isArray(rawConfig.deck_game_item_ids)
        ? (rawConfig.deck_game_item_ids as string[])
        : [];
      const curIdxRaw = rawConfig.current_index;
      const curIdx =
        typeof curIdxRaw === 'number'
          ? curIdxRaw
          : typeof curIdxRaw === 'string'
            ? Number.parseInt(curIdxRaw, 10)
            : 0;
      const seed =
        typeof rawConfig.session_seed === 'string' && rawConfig.session_seed.length > 0
          ? rawConfig.session_seed
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const byId = new Map(allItems.map((it) => [it.id, it]));
      const built = buildDeckFromGameItemIds(practiceMode, ids, byId);
      if (built.length === 0) {
        setResumeError(t(lang).resumeSessionFailed);
        return;
      }

      skipDeckBuildRef.current = true;
      deckBuildKeyRef.current = `resume:${resumeId}`;
      sessionSeedRef.current = seed;
      sessionIdRef.current = (row as { id: string }).id;
      reviewedCountRef.current = Number((row as { items_completed?: number }).items_completed ?? 0);
      correctCountRef.current = Number((row as { correct_count?: number }).correct_count ?? 0);
      setIsCram(Boolean((row as { is_cram?: boolean }).is_cram));
      setSessionXp(0);
      setLastEarnedXp(null);
      if (clearLastXpTimerRef.current) {
        window.clearTimeout(clearLastXpTimerRef.current);
        clearLastXpTimerRef.current = null;
      }
      setSessionExpired(false);
      setDeck(built);
      setConfig(parsed);
      if (curIdx >= built.length) {
        setDone(true);
        setIndex(Math.max(0, built.length - 1));
      } else {
        setDone(false);
        setIndex(Math.max(0, curIdx));
      }
      setFlipped(false);
      setUserAnswerTokens([]);
      setScore(null);
      setGradeError(null);
      router.replace(`/practice/${mode}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeId, ensured, loadingAll, allItems, practiceMode, mode, router, lang]);

  // Build deck once game items + config are ready (new session only — not on query refetch after grading)
  useEffect(() => {
    if (skipDeckBuildRef.current) return;
    if (!ensured || loadingDue || loadingAll || (shouldUseWeights && loadingWeights) || !dueItems || !allItems) return;
    if (!config) {
      deckBuildKeyRef.current = null;
      return;
    }
    const buildKey = `${practiceMode}:${JSON.stringify(config)}:${shouldUseWeights ? Object.keys(adaptiveWeights ?? {}).length : 'no-weights'}`;
    if (deckBuildKeyRef.current === buildKey) return;

    deckBuildKeyRef.current = buildKey;
    sessionSeedRef.current = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { deck: built, isCram: cram } = buildDeck(practiceMode, dueItems, allItems, config, shouldUseWeights ? (adaptiveWeights ?? null) : null);
    setDeck(built);
    setIsCram(cram);
    setIndex(0);
    setFlipped(false);
    setDone(false);
    setUserAnswerTokens([]);
    setScore(null);
    reviewedCountRef.current = 0;
    correctCountRef.current = 0;
    setSessionXp(0);
    setLastEarnedXp(null);
    if (clearLastXpTimerRef.current) {
      window.clearTimeout(clearLastXpTimerRef.current);
      clearLastXpTimerRef.current = null;
    }
    setSessionExpired(false);
  }, [ensured, loadingDue, loadingAll, loadingWeights, shouldUseWeights, dueItems, allItems, practiceMode, config, adaptiveWeights]);

  // Create practice session when deck is ready
  useEffect(() => {
    if (deck.length === 0 || sessionIdRef.current || !config) return;
    const dbMode = SLUG_TO_DB_MODE[practiceMode] ?? practiceMode;
    const postGameSlug = DB_MODE_TO_GAME_SLUG[dbMode] ?? 'full_scale';
    const deckSnapshot = deck;
    getSessionDeduped().then(async ({ data: { session } }) => {
      if (!session) return;
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          game_slug: postGameSlug,
          is_cram: isCram,
          config: {
            mode: dbMode,
            root_mode: config.type,
            roots: config.type === 'root-selected' ? config.roots : null,
            sequence_count: practiceMode === 'sequence' ? config.sequenceCount : null,
            scale_direction: config.scaleDirection,
            chord_inversions: config.chordInversions,
          },
        }),
      });
      if (res.ok) {
        const body = await res.json() as { session: { id: string } };
        sessionIdRef.current = body.session.id;
        lastActivityAtRef.current = Date.now();
        setSessionExpired(false);
        const deckIds = deckSnapshot.map((d) => d.gameItemId);
        await fetch(`/api/sessions/${body.session.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            config: buildSessionConfigPayload(practiceMode, config, {
              deck_game_item_ids: deckIds,
              current_index: 0,
              session_seed: sessionSeedRef.current,
            }),
          }),
        });
      }
    });
  }, [deck, practiceMode, isCram, config]);

  // Close session when done — write final score counts
  useEffect(() => {
    if (!done || !sessionIdRef.current) return;
    const sid = sessionIdRef.current;
    getSessionDeduped().then(async ({ data: { session } }) => {
      if (!session) return;
      await fetch(`/api/sessions/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          ended_at: new Date().toISOString(),
          items_completed: reviewedCountRef.current,
          correct_count: correctCountRef.current,
          status: 'completed',
        }),
      });
    });
  }, [done]);

  // Track interaction timestamps while a session is active.
  useEffect(() => {
    if (!sessionIdRef.current || done || sessionExpired) return;

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'focus'];
    events.forEach((name) => window.addEventListener(name, markActivity, { passive: true }));

    return () => {
      events.forEach((name) => window.removeEventListener(name, markActivity));
    };
  }, [done, sessionExpired, deck.length]);

  // Generate sequence for current card
  useEffect(() => {
    if (practiceMode !== 'sequence' || deck.length === 0) return;
    const item = deck[index];
    if (!item) return;
    if (item.type === 'standard') {
      if (item.kind !== 'chord') setSequence(generateSequence(item.scaleType, config?.sequenceCount ?? 5));
    }
  }, [index, deck, practiceMode, config]);

  // Resolve expected notes for current card (includes scale direction / chord inversions)
  useEffect(() => {
    const item = deck[index];
    if (!item || !config) {
      setExpectedNotes([]);
      return;
    }
    const seed =
      item.type === 'standard'
        ? `${sessionSeedRef.current}:${item.canonicalKey}`
        : item.type === 'interval'
          ? `${sessionSeedRef.current}:${item.canonicalKey}`
          : `${sessionSeedRef.current}:${item.canonicalKey}`;
    const resolved = resolveExpectedNotesWithVariants({
      item,
      mode: practiceMode,
      sequence,
      semitoneOffset,
      scaleDirection: config.scaleDirection,
      chordInversions: config.chordInversions,
      seed,
    });
    setExpectedNotes(resolved.expected);
    setUserAnswerTokens((prev) => Array.from({ length: resolved.expected.length }, (_, i) => prev[i] ?? ''));
  }, [deck, index, practiceMode, sequence, semitoneOffset, config]);

  // Keyboard shortcuts
  const handleGradeRef = useRef<((g: Grade) => void) | null>(null);
  const handleNextRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!flipped && !done) setFlipped(true);
      }
      if (flipped && !grading && !done) {
        if (e.key === '1') handleGradeRef.current?.(1);
        if (e.key === '2') handleGradeRef.current?.(2);
        if (e.key === '3') handleGradeRef.current?.(3);
        if (e.key === '4') handleGradeRef.current?.(4);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [flipped, grading, done, practiceMode]);

  const advanceCard = useCallback((next: number) => {
    if (next >= deck.length) {
      setDone(true);
    } else {
      setIndex(next);
      setFlipped(false);
      setUserAnswerTokens([]);
      setScore(null);
      if (practiceMode === 'sequence') {
        const nextItem = deck[next];
        if (nextItem?.type === 'standard') {
          if (nextItem.kind !== 'chord') setSequence(generateSequence(nextItem.scaleType));
        }
      }
    }
  }, [deck, practiceMode]);

  const handleNext = useCallback(() => {
    advanceCard(index + 1);
  }, [advanceCard, index]);

  const handleBack = useCallback(() => {
    if (index === 0) return;
    setIndex(index - 1);
    setFlipped(false);
    setUserAnswerTokens([]);
    setScore(null);
    setGradeError(null);
  }, [index]);

  const handleNewSession = useCallback(() => {
    skipDeckBuildRef.current = false;
    deckBuildKeyRef.current = null;
    setDeck([]);
    setIndex(0);
    setFlipped(false);
    setDone(false);
    setUserAnswerTokens([]);
    setScore(null);
    setGradeError(null);
    sessionIdRef.current = null;
    reviewedCountRef.current = 0;
    correctCountRef.current = 0;
    setSessionXp(0);
    setLastEarnedXp(null);
    if (clearLastXpTimerRef.current) {
      window.clearTimeout(clearLastXpTimerRef.current);
      clearLastXpTimerRef.current = null;
    }
    lastActivityAtRef.current = Date.now();
    setSessionExpired(false);
    setResumeError(null);
    if (searchParams.get('resume')) {
      router.replace(`/practice/${mode}`);
    }
    setConfig(null); // always return to config screen
  }, [router, searchParams, mode]);

  const handleGrade = useCallback(async (grade: Grade) => {
    if (grading) return;
    const item = deck[index];
    if (!item) return;
    setGrading(true);
    setGradeError(null);
    lastActivityAtRef.current = Date.now();
    try {
      const sid = sessionIdRef.current ?? undefined;
      const dbMode = SLUG_TO_DB_MODE[practiceMode] ?? practiceMode;
      if (item.type === 'standard') {
        await gradeCard(item.gameItemId, grade, sid, dbMode, isCram, { canonical_key: item.canonicalKey });
      } else if (item.type === '251') {
        const meta = { progression: '251', key: item.key, tonality: item.tonality, canonical_key: item.canonicalKey };
        await gradeCard(item.gameItemId, grade, sid, dbMode, isCram, meta);
      } else if (item.type === 'interval') {
        const meta = { root: item.root, interval_id: item.intervalId, direction: item.direction, canonical_key: item.canonicalKey };
        await gradeCard(item.gameItemId, grade, sid, dbMode, isCram, meta);
      }
      const earned = getEventXp({ grade, is_correct: grade >= 3 });
      setSessionXp((prev) => prev + earned);
      setLastEarnedXp(earned);
      if (clearLastXpTimerRef.current) window.clearTimeout(clearLastXpTimerRef.current);
      clearLastXpTimerRef.current = window.setTimeout(() => setLastEarnedXp(null), 1200);
      reviewedCountRef.current += 1;
      if (grade >= 3) correctCountRef.current += 1;
      const nextIdx = index + 1;
      const sidPersist = sessionIdRef.current;
      if (sidPersist && config) {
        const { data: { session: authSession } } = await getSessionDeduped();
        if (authSession) {
          await fetch(`/api/sessions/${sidPersist}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
            body: JSON.stringify({
              items_completed: reviewedCountRef.current,
              correct_count: correctCountRef.current,
              config: buildSessionConfigPayload(practiceMode, config, {
                deck_game_item_ids: deck.map((d) => d.gameItemId),
                current_index: nextIdx,
                session_seed: sessionSeedRef.current,
              }),
            }),
          });
        }
      }
      invalidate(gameSlug);
      advanceCard(nextIdx);
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Grade failed');
    } finally {
      setGrading(false);
    }
  }, [grading, deck, index, invalidate, advanceCard, practiceMode, isCram, gameSlug, config]);

  // Auto-grade using scoreAnswer's suggestedGrade, then advance.
  // Blank answer → grade 1 (Blackout). Used by the nav Next button.
  const handleAutoNext = useCallback(async () => {
    const item = deck[index];
    if (!item) return;
    const userAnswer = userAnswerTokens.join(' ').trim();
    const s = userAnswer ? scoreAnswer(userAnswer, expectedNotes) : null;
    await handleGrade(s?.suggestedGrade ?? 1);
  }, [deck, index, userAnswerTokens, handleGrade, expectedNotes]);

  const handleChordPlayModeChange = useCallback((m: ChordPlayMode) => {
    setChordPlayModeState(m);
    setChordPlayMode(m);
  }, []);

  const handlePlay = useCallback(async () => {
    const item = deck[index];
    if (!item) return;
    setPlaying(true);
    try {
      await playPracticeItem(item, practiceMode, sequence, chordPlayMode);
    } catch (e) {
      console.error(e);
    } finally {
      setPlaying(false);
    }
  }, [deck, index, practiceMode, sequence, chordPlayMode]);

  // Keep refs in sync for keyboard handler
  handleGradeRef.current = handleGrade;
  handleNextRef.current = handleNext;

  const itemsLoading = !authed || !ensured || loadingDue || loadingAll || (shouldUseWeights && loadingWeights);
  const resumeBlocking = Boolean(resumeId) && !config && !resumeError;
  // Config screen: new session, or resume failed (user can start fresh)
  const showConfig = authed && ensured && !config && (!resumeId || Boolean(resumeError));
  const loading = (itemsLoading || resumeBlocking) && !showConfig;

  // ─── Render ───────────────────────────────────────────────────────────────

  const modeLabelText = modeLabel(practiceMode, tr);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-0">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/practice">{tr.navPractice}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{modeLabelText}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={cyclePitch}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                pitch !== 'concert'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
              title={pitch === 'bb' ? tr.pitchTooltipBb : pitch === 'eb' ? tr.pitchTooltipEb : tr.pitchTooltipConcert}
            >
              {pitch === 'bb' ? tr.pitchBb : pitch === 'eb' ? tr.pitchEb : tr.pitchConcert}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSession}
              disabled={!deck.length && !done}
            >
              {tr.newSession}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuitOpen(true)}
            >
              {tr.practiceQuit}
            </Button>
          </div>
        </header>

        {quitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-lg">
              <h3 className="text-lg font-semibold">{tr.practiceQuitTitle}</h3>
              <p className="text-sm text-muted-foreground">{tr.practiceQuitBody}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setQuitOpen(false)}>
                  {tr.practiceQuitCancel}
                </Button>
                <Button
                  onClick={() => {
                    setQuitOpen(false);
                    router.push('/dashboard');
                  }}
                >
                  {tr.practiceQuitConfirm}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-4 overflow-y-auto p-4 sm:justify-center sm:gap-6 sm:p-6">
          {loading ? (
            <LoadingSkeleton tr={tr} />
          ) : ensureError ? (
            <div className="w-full max-w-lg space-y-3 rounded-xl border bg-card p-6 text-center shadow-sm">
              <p className="text-lg font-semibold">Setup failed</p>
              <p className="text-sm text-muted-foreground">{ensureError}</p>
              <Button variant="outline" onClick={() => { setEnsured(false); setEnsureError(null); }}>
                Retry
              </Button>
            </div>
          ) : showConfig ? (
            <div className="w-full max-w-lg space-y-4">
              {resumeError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-600 dark:text-rose-400">
                  {resumeError}
                </div>
              )}
              <ConfigScreen mode={practiceMode} onSelect={setConfig} tr={tr} />
            </div>
          ) : done ? (
            <DoneScreen total={deck.length} isCram={isCram} config={config} expired={sessionExpired} onNewSession={handleNewSession} tr={tr} />
          ) : deck.length === 0 ? (
            <EmptyDeck />
          ) : (
            <PracticeCard
              item={deck[index]!}
              mode={practiceMode}
              sequence={sequence}
              semitoneOffset={semitoneOffset}
              flipped={flipped}
              grading={grading}
              current={index + 1}
              total={deck.length}
              isCram={isCram}
              sessionXp={sessionXp}
              lastEarnedXp={lastEarnedXp}
              config={config}
              userAnswerTokens={userAnswerTokens}
              expectedNotes={expectedNotes}
              score={score}
              gradeError={gradeError}
              onAnswerChange={setUserAnswerTokens}
              onFlip={() => {
                const userAnswer = userAnswerTokens.join(' ').trim();
                setScore(userAnswer ? scoreAnswer(userAnswer, expectedNotes) : null);
                setFlipped(true);
              }}
              onGrade={handleGrade}
              onBack={handleBack}
              onSkip={handleAutoNext}
              chordPlayMode={chordPlayMode}
              onChordPlayModeChange={handleChordPlayModeChange}
              onPlay={handlePlay}
              playing={playing}
              tr={tr}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PracticeCard({
  item,
  mode,
  sequence,
  semitoneOffset,
  flipped,
  grading,
  current,
  total,
  isCram,
  sessionXp,
  lastEarnedXp,
  config,
  userAnswerTokens,
  expectedNotes,
  score,
  gradeError,
  onAnswerChange,
  onFlip,
  onGrade,
  onBack,
  onSkip,
  chordPlayMode,
  onChordPlayModeChange,
  onPlay,
  playing,
  tr,
}: {
  item: DeckItem;
  mode: PracticeMode;
  sequence: string[];
  semitoneOffset: number;
  flipped: boolean;
  grading: boolean;
  current: number;
  total: number;
  isCram: boolean;
  sessionXp: number;
  lastEarnedXp: number | null;
  config: PracticeConfig | null;
  userAnswerTokens: string[];
  expectedNotes: string[];
  score: AnswerScore | null;
  gradeError: string | null;
  onAnswerChange: (v: string[]) => void;
  onFlip: () => void;
  onGrade: (g: Grade) => void;
  onBack: () => void;
  onSkip: () => void;
  chordPlayMode: ChordPlayMode;
  onChordPlayModeChange: (m: ChordPlayMode) => void;
  onPlay: () => void;
  playing: boolean;
  tr: Tr;
}) {
  const isInterval = item.type === 'interval';
  const showChordPlayback = mode === 'full-chord' || mode === '251';
  const isRootSelected = config?.type === 'root-selected';
  const expectedCount = expectedNotes.length;
  const rootsBadge =
    config?.type === 'root-selected'
      ? (config.roots.length <= 3
          ? config.roots.join(' ')
          : `${config.roots[0]} +${config.roots.length - 1}`)
      : null;
  return (
    <div className="w-full max-w-2xl space-y-4 px-1 sm:px-0">
      {/* Progress bar + badges */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-mono">{current} / {total}</span>
          {isRootSelected && config?.type === 'root-selected' && (
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {rootsBadge}
            </span>
          )}
          {isCram && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{tr.cramBadge}</span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs tabular-nums">
            XP {sessionXp}
          </span>
          {lastEarnedXp != null && (
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
              +{lastEarnedXp} XP
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!flipped && (
            <span className="text-xs opacity-60">
              {isInterval ? tr.hintInterval : tr.hintReveal}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-9 gap-1.5"
          onClick={onPlay}
          disabled={playing || grading}
        >
          <Volume2 className="size-4 shrink-0" aria-hidden />
          {tr.playAudio}
        </Button>
        {showChordPlayback && (
          <div className="flex rounded-md border border-border p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onChordPlayModeChange('block')}
              className={cn(
                'rounded px-2.5 py-1.5 transition-colors',
                chordPlayMode === 'block'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tr.chordPlaybackBlock}
            </button>
            <button
              type="button"
              onClick={() => onChordPlayModeChange('arpeggio')}
              className={cn(
                'rounded px-2.5 py-1.5 transition-colors',
                chordPlayMode === 'arpeggio'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tr.chordPlaybackArpeggio}
            </button>
          </div>
        )}
      </div>

      {/* Prompt card */}
      <div className="min-h-52 rounded-xl border bg-card p-8 shadow-sm flex items-center justify-center">
        {item.type === 'standard' ? (
          <StandardFront item={item} mode={mode} sequence={sequence} semitoneOffset={semitoneOffset} tr={tr} />
        ) : item.type === 'interval' ? (
          <IntervalFront item={item} semitoneOffset={semitoneOffset} tr={tr} />
        ) : (
          <TwoFiveOneFront item={item} semitoneOffset={semitoneOffset} tr={tr} />
        )}
      </div>

      {/* Answer input — editable before reveal, scored display after */}
      {!flipped ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            {tr.yourAnswer}
          </label>
          <NoteBoxesInput
            count={expectedCount}
            values={userAnswerTokens}
            onChange={onAnswerChange}
          />
        </div>
      ) : (
        <AnswerReview userAnswer={userAnswerTokens.join(' ')} score={score} tr={tr} />
      )}

      {/* Correct answer — only shown after reveal */}
      {flipped && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 sm:p-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
            {tr.correctAnswer}
          </p>
          {item.type === 'standard' ? (
            <StandardBack item={item} mode={mode} sequence={sequence} semitoneOffset={semitoneOffset} />
          ) : item.type === 'interval' ? (
            <IntervalBack item={item} semitoneOffset={semitoneOffset} />
          ) : (
            <TwoFiveOneBack item={item} semitoneOffset={semitoneOffset} />
          )}
        </div>
      )}

      {/* Reveal / grade / next controls */}
      {flipped ? (
        <>
          {gradeError && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-600 dark:text-rose-400">
              {gradeError}
            </p>
          )}
          <GradeButtons onGrade={onGrade} loading={grading} suggested={score?.suggestedGrade} tr={tr} />
        </>
      ) : (
        <Button size="lg" onClick={onFlip} className="w-full min-h-11">
          {tr.revealAnswer}
        </Button>
      )}

      {/* Prev / Skip navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          disabled={current === 1}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          {tr.prevCard}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={grading}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          {current === total ? tr.finishPractice : tr.nextCard}
        </button>
      </div>
    </div>
  );
}

function NoteBoxesInput({
  count,
  values,
  onChange,
}: {
  count: number;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [invalidIdx, setInvalidIdx] = useState<number | null>(null);

  // Normalize length to exactly count (preserve existing tokens)
  useEffect(() => {
    const next = Array.from({ length: count }, (_, i) => values[i] ?? '');
    const same =
      next.length === values.length &&
      next.every((v, i) => v === values[i]);
    if (!same) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const focusIdx = useCallback((i: number) => {
    const el = inputRefs.current[i];
    el?.focus();
    el?.select();
  }, []);

  const setAt = useCallback((idx: number, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      setInvalidIdx(null);
      const next = [...values];
      next[idx] = '';
      onChange(next);
      return;
    }

    const canon = canonicalizeNoteInput(trimmed);
    const parsed = NOTE_INPUT_SCHEMA.safeParse(canon);
    if (!parsed.success) {
      setInvalidIdx(idx);
      return;
    }
    setInvalidIdx(null);
    const next = [...values];
    next[idx] = parsed.data;
    onChange(next);
  }, [onChange, values]);

  const onPaste = useCallback((idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const tokens = parseNotes(text);
    if (tokens.length <= 1) return;
    e.preventDefault();
    const next = [...Array.from({ length: count }, (_, i) => values[i] ?? '')];
    for (let i = 0; i < tokens.length && (idx + i) < count; i++) {
      const canon = canonicalizeNoteInput(tokens[i] ?? '');
      if (NOTE_INPUT_SCHEMA.safeParse(canon).success) next[idx + i] = canon;
    }
    onChange(next);
    focusIdx(Math.min(idx + tokens.length, count - 1));
  }, [count, focusIdx, onChange, values]);

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background px-3 py-3 hover:border-ring/50 focus-within:ring-2 focus-within:ring-ring/50">
      {Array.from({ length: count }, (_, i) => {
        const v = values[i] ?? '';
        const isInvalid = invalidIdx === i;
        return (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            value={v}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onPaste={(e) => onPaste(i, e)}
            onChange={(e) => {
              const nextRaw = e.target.value;
              // allow user to type, but keep it short and note-shaped
              const cleaned = nextRaw.replace(/\s+/g, '').slice(0, 2);
              setAt(i, cleaned);
              const canon = canonicalizeNoteInput(cleaned);
              const isValid = NOTE_INPUT_SCHEMA.safeParse(canon).success;
              // Auto-advance only once the note is "complete":
              // - two-character notes like Bb/F# should advance after 2 chars
              // - single-letter notes (C, D, E, ...) should NOT auto-advance (so user can still type b/#)
              if (isValid && canon.length === 2 && i < count - 1) focusIdx(i + 1);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                focusIdx(Math.max(0, i - 1));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                focusIdx(Math.min(count - 1, i + 1));
              } else if (e.key === 'Backspace') {
                const cur = (values[i] ?? '').trim();
                if (cur === '' && i > 0) {
                  e.preventDefault();
                  focusIdx(i - 1);
                }
              } else if (e.key === ' ' || e.key === 'Enter') {
                // treat as "next box"
                e.preventDefault();
                focusIdx(Math.min(count - 1, i + 1));
              }
            }}
            className={cn(
              'h-11 w-17 rounded-md border bg-background px-3 text-center font-mono text-base tabular-nums outline-none transition-colors md:text-sm',
              isInvalid ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-border focus:border-ring',
            )}
            aria-invalid={isInvalid}
          />
        );
      })}
    </div>
  );
}

function ConfigScreen({ mode, onSelect, tr }: { mode: PracticeMode; onSelect: (c: PracticeConfig) => void; tr: Tr }) {
  const [sequenceCount, setSequenceCount] = useState(5);
  const [scaleDirection, setScaleDirection] = useState<'up' | 'down' | 'mixed'>('up');
  const [chordInversions, setChordInversions] = useState<'root' | '1' | '2' | '3' | 'random'>('root');
  const [selectedRoots, setSelectedRoots] = useState<Root[]>([]);
  const rootLabelMap: Record<PracticeMode, string> = {
    'full-scale': tr.rootLabelScale,
    'full-chord': tr.rootLabelChord,
    'sequence':   tr.rootLabelSeq,
    '251':        tr.rootLabel251,
    'interval':   tr.rootLabelInterval,
  };
  const rootLabel = rootLabelMap[mode];

  function toggleRoot(root: Root) {
    setSelectedRoots((prev) => (
      prev.includes(root) ? prev.filter((r) => r !== root) : [...prev, root]
    ));
  }

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">{modeLabel(mode, tr)}</p>
        <h2 className="text-2xl font-semibold">{tr.configTitle}</h2>
      </div>

      {/* Sequence count picker */}
      {mode === 'sequence' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
            {tr.configNoteCount}
          </p>
          <div className="flex justify-center gap-2">
            {[3, 4, 5, 6, 7].map(n => (
              <button
                key={n}
                onClick={() => setSequenceCount(n)}
                className={cn(
                  'h-10 w-10 rounded-lg border text-sm font-semibold transition-all',
                  sequenceCount === n
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-ring/50 hover:bg-accent',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scale direction */}
      {mode === 'full-scale' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
            {tr.configDirection}
          </p>
          <div className="flex justify-center gap-2">
            {([
              { id: 'up' as const, label: tr.dirUp },
              { id: 'down' as const, label: tr.dirDown },
              { id: 'mixed' as const, label: tr.dirMixed },
            ]).map(opt => (
              <button
                key={opt.id}
                onClick={() => setScaleDirection(opt.id)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm font-semibold transition-all',
                  scaleDirection === opt.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-ring/50 hover:bg-accent',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chord inversions */}
      {mode === 'full-chord' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
            {tr.configInversions}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {([
              { id: 'root' as const, label: tr.invRootOnly },
              { id: '1' as const, label: tr.inv1 },
              { id: '2' as const, label: tr.inv2 },
              { id: '3' as const, label: tr.inv3 },
              { id: 'random' as const, label: tr.invRandom },
            ]).map(opt => (
              <button
                key={opt.id}
                onClick={() => setChordInversions(opt.id)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm font-semibold transition-all',
                  chordInversions === opt.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-ring/50 hover:bg-accent',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Root Free */}
      <button
        onClick={() => onSelect({ type: 'root-free', sequenceCount, scaleDirection, chordInversions })}
        className="w-full rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:border-ring/50 hover:shadow-md"
      >
        <p className="font-semibold text-base">{tr.configRootFree}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{tr.configRootFreeDesc}</p>
      </button>

      {/* Root Selected */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
          {tr.configPickRoot} — {rootLabel}
        </p>
        <div className="grid grid-cols-6 gap-2">
          {ROOTS.map((root) => (
            <button
              key={root}
              onClick={() => toggleRoot(root)}
              className={cn(
                'rounded-lg border bg-card py-3 text-sm font-semibold transition-all hover:border-ring/50 hover:bg-accent hover:text-accent-foreground',
                selectedRoots.includes(root) && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {root}
            </button>
          ))}
        </div>
        <Button
          size="lg"
          className="w-full min-h-11"
          disabled={selectedRoots.length === 0}
          onClick={() => onSelect({ type: 'root-selected', roots: selectedRoots, sequenceCount, scaleDirection, chordInversions })}
        >
          {tr.modeStart}
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton({ tr }: { tr: Tr }) {
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span>{tr.loadingPracticeContent}</span>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="flex justify-center">
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
    </div>
  );
}

function DoneScreen({
  total,
  isCram,
  config,
  expired,
  onNewSession,
  tr,
}: {
  total: number;
  isCram: boolean;
  config: PracticeConfig | null;
  expired?: boolean;
  onNewSession: () => void;
  tr: Tr;
}) {
  const subtitle = expired
    ? tr.sessionExpiredMessage
    : config?.type === 'root-selected'
    ? (config.roots.length === 1
        ? tr.doneRootSelected(total, config.roots[0] ?? '')
        : tr.doneRootsSelected(total, config.roots.join(' ')))
    : isCram
      ? tr.doneCram(total)
      : tr.doneFree(total);

  return (
    <div className="text-center space-y-6 w-full max-w-sm">
      <div className="space-y-2">
        <p className="text-4xl">{tr.doneTitle}</p>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={onNewSession} className="w-full">{tr.newSession}</Button>
        <Link href="/practice" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
          {tr.backToModes}
        </Link>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
          {tr.navDashboard}
        </Link>
      </div>
    </div>
  );
}

function EmptyDeck() {
  return (
    <div className="text-center space-y-4">
      <p className="text-2xl">No practice items found</p>
      <p className="text-muted-foreground text-sm">
        Practice items are still being set up. Try again in a moment.
      </p>
      <Link href="/practice" className={buttonVariants({ variant: 'outline' })}>Go back</Link>
    </div>
  );
}
