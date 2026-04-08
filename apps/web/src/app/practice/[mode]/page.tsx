'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getScaleData,
  get251,
  SCALE_MAP,
  ROOTS,
  transposeNote,
  type Card,
  type Grade,
  type Root,
  type TwoFiveOne,
} from '@the-shed/shared';
import { supabase } from '@/lib/supabase/client';
import { useAllCards, useDueCards, useInvalidateCards } from '@/hooks/use-cards';
import { useBb } from '@/hooks/use-bb';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
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

type Tr = ReturnType<typeof t>;

// ─── Constants ───────────────────────────────────────────────────────────────

const SLUG_TO_DB_MODE: Record<string, string> = {
  'full-scale': 'full_scale',
  'full-chord': 'full_chord',
  'sequence': 'sequence',
  '251': '251',
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

type PracticeMode = 'full-scale' | 'full-chord' | 'sequence' | '251' | 'interval';

type PracticeConfig =
  | { type: 'root-free';      sequenceCount: number }
  | { type: 'root-selected';  roots: Root[]; sequenceCount: number };

interface StandardItem {
  type: 'standard';
  card: Card;
}

interface TwoFiveOneItem {
  type: '251';
  key: Root;
  tonality: 'major' | 'minor';
  combo: TwoFiveOne;
  cards: { ii: Card; V: Card; I: Card };
}

interface IntervalItem {
  type: 'interval';
  root: Root;
  intervalId: string;
  intervalName: string;
  semitones: number;
  direction: 'up' | 'down';
  answer: string;
}

type DeckItem = StandardItem | TwoFiveOneItem | IntervalItem;

const MODE_LABELS: Record<PracticeMode, string> = {
  'full-scale': 'Full Scale',
  'full-chord': 'Full Chord',
  'sequence': 'Sequence',
  '251': '2-5-1',
  'interval': 'Intervals',
};

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

function buildDeck(
  mode: PracticeMode,
  dueCards: Card[],
  allCards: Card[],
  config: PracticeConfig | null,
): { deck: DeckItem[]; isCram: boolean } {
  if (mode === 'interval') {
    const roots = config?.type === 'root-selected' ? config.roots : [...ROOTS];
    const items: IntervalItem[] = [];
    for (const root of roots) {
      for (const interval of INTERVALS) {
        const direction = Math.random() < 0.5 ? 'up' : 'down';
        const semitones = direction === 'up' ? interval.semitones : -interval.semitones;
        const answer = transposeNote(root, semitones);
        items.push({ type: 'interval', root, intervalId: interval.id, intervalName: interval.name, semitones: interval.semitones, direction, answer });
      }
    }
    const result: DeckItem[] = [];
    while (result.length < SESSION_SIZE) result.push(...shuffled(items));
    return { deck: result.slice(0, SESSION_SIZE), isCram: false };
  }

  if (mode === '251') {
    const keys = config?.type === 'root-selected' ? config.roots : [...ROOTS];
    const items: TwoFiveOneItem[] = [];
    for (const key of keys) {
      for (const tonality of ['major', 'minor'] as const) {
        const combo = get251(key, tonality);
        const iiCard = allCards.find(c => c.root === combo.ii.root && c.scale_type === combo.ii.scaleType);
        const vCard = allCards.find(c => c.root === combo.V.root && c.scale_type === combo.V.scaleType);
        const iCard = allCards.find(c => c.root === combo.I.root && c.scale_type === combo.I.scaleType);
        if (iiCard && vCard && iCard) {
          items.push({ type: '251', key, tonality, combo, cards: { ii: iiCard, V: vCard, I: iCard } });
        }
      }
    }
    const result: DeckItem[] = [];
    while (result.length < SESSION_SIZE) result.push(...shuffled(items));
    return { deck: result.slice(0, SESSION_SIZE), isCram: false };
  }

  // Scale modes (full-scale, full-chord, sequence)
  if (config?.type === 'root-selected') {
    const rootsSet = new Set(config.roots);
    const rootCards = allCards.filter(c => rootsSet.has(c.root as Root));
    const result: DeckItem[] = [];
    while (result.length < SESSION_SIZE) {
      result.push(...shuffled(rootCards.map(card => ({ type: 'standard' as const, card }))));
    }
    return { deck: result.slice(0, SESSION_SIZE), isCram: false };
  }

  // root-free: due queue capped at SESSION_SIZE
  const source = dueCards.length > 0 ? dueCards : allCards;
  const isCram = dueCards.length === 0;
  return {
    deck: shuffled(source.map(card => ({ type: 'standard' as const, card }))).slice(0, SESSION_SIZE),
    isCram,
  };
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

function getAnswerPlaceholder(mode: PracticeMode, tr: Tr): string {
  switch (mode) {
    case 'full-scale':  return tr.modeFullScaleDesc;
    case 'full-chord':  return tr.modeFullChordDesc;
    case 'sequence':    return tr.whatDegrees;
    case '251':         return tr.nameChordTones;
    case 'interval':    return tr.nameTarget;
  }
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

function getExpectedNotes(
  item: DeckItem,
  mode: PracticeMode,
  sequence: string[],
  isBb: boolean,
): string[] {
  if (item.type === 'interval') {
    const answer = isBb ? transposeNote(item.answer, 2) : item.answer;
    return [answer];
  }

  if (item.type === 'standard') {
    const data = getScaleData(item.card.root as Root, item.card.scale_type);
    const notes = isBb ? data.trumpetNotes : data.concertNotes;
    if (mode === 'full-scale') return [...notes];
    if (mode === 'full-chord') return [...(isBb ? data.trumpetChordTones : data.concertChordTones)];
    // sequence — map selected degrees to notes
    const degreeToNote = Object.fromEntries(data.scaleDegrees.map((d, i) => [d, notes[i] ?? '?']));
    return sequence.map(d => degreeToNote[d] ?? '?');
  }
  // 251 — union of chord tones across ii, V, I
  const seen = new Set<string>();
  const all: string[] = [];
  for (const { root, scaleType } of [item.combo.ii, item.combo.V, item.combo.I]) {
    const data = getScaleData(root, scaleType);
    const tones = isBb ? data.trumpetChordTones : data.concertChordTones;
    tones.forEach(t => { if (!seen.has(t)) { seen.add(t); all.push(t); } });
  }
  return all;
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
  cardId: string,
  grade: Grade,
  sessionId?: string,
  practiceMode?: string,
  isCram?: boolean,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`/api/cards/${cardId}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({
      grade,
      ...(isCram ? { is_cram: true } : {}),
      ...(sessionId ? { session_id: sessionId, practice_mode: practiceMode } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
    throw new Error(body.detail ?? body.error ?? `Grade failed (${res.status})`);
  }
}

async function gradeInterval(
  grade: Grade,
  sessionId?: string,
  root?: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/interval/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({
      grade,
      ...(sessionId ? { session_id: sessionId } : {}),
      ...(root ? { root } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
    throw new Error(body.detail ?? body.error ?? `Interval grade failed (${res.status})`);
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
              <td key={i} className="text-xl font-semibold tabular-nums">{note}</td>
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

function StandardFront({ item, mode, sequence, isBb, tr }: {
  item: StandardItem;
  mode: PracticeMode;
  sequence: string[];
  isBb: boolean;
  tr: Tr;
}) {
  const data = getScaleData(item.card.root as Root, item.card.scale_type);
  const displayRoot = isBb ? data.trumpetNotes[0] : item.card.root;
  const chordSymbol = isBb ? data.trumpetChordSymbol : data.concertChordSymbol;

  if (mode === 'full-scale') {
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

function StandardBack({ item, mode, sequence, isBb }: {
  item: StandardItem;
  mode: PracticeMode;
  sequence: string[];
  isBb: boolean;
}) {
  const data = getScaleData(item.card.root as Root, item.card.scale_type);
  const notes = isBb ? data.trumpetNotes : data.concertNotes;
  const chordTones = isBb ? data.trumpetChordTones : data.concertChordTones;

  if (mode === 'full-scale') {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">{data.scaleName} — {isBb ? data.trumpetChordSymbol : data.concertChordSymbol}</p>
        <NoteRow notes={notes} degrees={data.scaleDegrees} />
      </div>
    );
  }

  if (mode === 'full-chord') {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">{isBb ? data.trumpetChordSymbol : data.concertChordSymbol}</p>
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

function TwoFiveOneFront({ item, isBb, tr }: { item: TwoFiveOneItem; isBb: boolean; tr: Tr }) {
  const iiData = getScaleData(item.combo.ii.root, item.combo.ii.scaleType);
  const vData  = getScaleData(item.combo.V.root, item.combo.V.scaleType);
  const iData  = getScaleData(item.combo.I.root, item.combo.I.scaleType);

  const iiSymbol = isBb ? iiData.trumpetChordSymbol : iiData.concertChordSymbol;
  const vSymbol  = isBb ? vData.trumpetChordSymbol  : vData.concertChordSymbol;
  const iSymbol  = isBb ? iData.trumpetChordSymbol  : iData.concertChordSymbol;

  const displayKey = isBb ? iiData.trumpetNotes[0] : item.key;

  return (
    <div className="text-center space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">{tr.label251}</p>
        <p className="text-3xl font-bold">{displayKey} {item.tonality === 'major' ? 'Major' : 'Minor'}</p>
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

function TwoFiveOneBack({ item, isBb }: { item: TwoFiveOneItem; isBb: boolean }) {
  const chords = [
    { label: 'ii', data: getScaleData(item.combo.ii.root, item.combo.ii.scaleType) },
    { label: 'V',  data: getScaleData(item.combo.V.root, item.combo.V.scaleType) },
    { label: 'I',  data: getScaleData(item.combo.I.root, item.combo.I.scaleType) },
  ];

  return (
    <div className="space-y-6">
      {chords.map(({ label, data }) => {
        const symbol = isBb ? data.trumpetChordSymbol : data.concertChordSymbol;
        const tones  = isBb ? data.trumpetChordTones  : data.concertChordTones;
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

function IntervalFront({ item, isBb, tr }: { item: IntervalItem; isBb: boolean; tr: Tr }) {
  const displayRoot = isBb ? transposeNote(item.root, 2) : item.root;
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

function IntervalBack({ item, isBb }: { item: IntervalItem; isBb: boolean }) {
  const displayRoot = isBb ? transposeNote(item.root, 2) : item.root;
  const displayAnswer = isBb ? transposeNote(item.answer, 2) : item.answer;
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
          Missing: <span className="font-mono text-rose-500">{missing.join('  ')}</span>
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
            <span className="text-xs opacity-60">
              {suggested === g ? tr.suggested : description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PracticeModePage() {
  const router = useRouter();
  const { mode } = useParams() as { mode: string };
  const practiceMode = mode as PracticeMode;

  const [authed, setAuthed] = useState(false);
  const [ensured, setEnsured] = useState(false);

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
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState<AnswerScore | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);

  const { isBb, toggle: toggleBb } = useBb();
  const { lang } = useLanguage();
  const tr = t(lang);
  const { data: dueCards, isLoading: loadingDue } = useDueCards();
  const { data: allCards, isLoading: loadingAll } = useAllCards();
  const invalidate = useInvalidateCards();
  const sessionIdRef = useRef<string | null>(null);
  const reviewedCountRef = useRef(0);
  const correctCountRef = useRef(0);
  /** Only rebuild deck + reset index when mode/config change — not when dueCards/allCards refetch after invalidate(). */
  const deckBuildKeyRef = useRef<string | null>(null);

  // Auth gate
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthed(true);
    });
  }, [router]);

  // Ensure 204 cards exist (once per session)
  useEffect(() => {
    if (!authed || ensured) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      await fetch('/api/cards/ensure', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setEnsured(true);
      invalidate();
    });
  }, [authed, ensured, invalidate]);

  // Build deck once cards + config are ready (new session only — not on query refetch after grading)
  useEffect(() => {
    if (!ensured || loadingDue || loadingAll || !dueCards || !allCards) return;
    if (!config) {
      deckBuildKeyRef.current = null;
      return;
    }
    const buildKey = `${practiceMode}:${JSON.stringify(config)}`;
    if (deckBuildKeyRef.current === buildKey) return;

    deckBuildKeyRef.current = buildKey;
    const { deck: built, isCram: cram } = buildDeck(practiceMode, dueCards, allCards, config);
    setDeck(built);
    setIsCram(cram);
    setIndex(0);
    setFlipped(false);
    setDone(false);
    setUserAnswer('');
    setScore(null);
    reviewedCountRef.current = 0;
    correctCountRef.current = 0;
  }, [ensured, loadingDue, loadingAll, dueCards, allCards, practiceMode, config]);

  // Create practice session when deck is ready
  useEffect(() => {
    if (deck.length === 0 || sessionIdRef.current || !config) return;
    const dbMode = SLUG_TO_DB_MODE[practiceMode] ?? practiceMode;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          practice_mode: dbMode,
          is_cram: isCram,
          root: config.type === 'root-selected' && config.roots.length === 1 ? config.roots[0] : null,
          sequence_count: practiceMode === 'sequence' ? config.sequenceCount : null,
        }),
      });
      if (res.ok) {
        const body = await res.json() as { session: { id: string } };
        sessionIdRef.current = body.session.id;
      }
    });
  }, [deck.length, practiceMode, isCram, config]);

  // Close session when done — write final score counts
  useEffect(() => {
    if (!done || !sessionIdRef.current) return;
    const sid = sessionIdRef.current;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      await fetch(`/api/sessions/${sid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          ended_at: new Date().toISOString(),
          cards_reviewed: reviewedCountRef.current,
          correct_count: correctCountRef.current,
        }),
      });
    });
  }, [done]);

  // Generate sequence for current card
  useEffect(() => {
    if (practiceMode !== 'sequence' || deck.length === 0) return;
    const item = deck[index];
    if (!item) return;
    if (item.type === 'standard') {
      setSequence(generateSequence(item.card.scale_type, config?.sequenceCount ?? 5));
    }
  }, [index, deck, practiceMode, config]);

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
      setUserAnswer('');
      setScore(null);
      if (practiceMode === 'sequence') {
        const nextItem = deck[next];
        if (nextItem?.type === 'standard') {
          setSequence(generateSequence(nextItem.card.scale_type));
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
    setUserAnswer('');
    setScore(null);
    setGradeError(null);
  }, [index]);

  const handleNewSession = useCallback(() => {
    setDeck([]);
    setIndex(0);
    setFlipped(false);
    setDone(false);
    setUserAnswer('');
    setScore(null);
    setGradeError(null);
    sessionIdRef.current = null;
    reviewedCountRef.current = 0;
    correctCountRef.current = 0;
    setConfig(null); // always return to config screen
  }, []);

  const handleGrade = useCallback(async (grade: Grade) => {
    if (grading) return;
    const item = deck[index];
    if (!item) return;
    setGrading(true);
    setGradeError(null);
    try {
      const sid = sessionIdRef.current ?? undefined;
      const dbMode = SLUG_TO_DB_MODE[practiceMode] ?? practiceMode;
      if (item.type === 'standard') {
        await gradeCard(item.card.id, grade, sid, dbMode, isCram);
      } else if (item.type === '251') {
        await Promise.all([
          gradeCard(item.cards.ii.id, grade, sid, dbMode, isCram),
          gradeCard(item.cards.V.id, grade, sid, dbMode, isCram),
          gradeCard(item.cards.I.id, grade, sid, dbMode, isCram),
        ]);
      } else if (item.type === 'interval') {
        await gradeInterval(grade, sid, item.root);
      }
      reviewedCountRef.current += 1;
      if (grade >= 3) correctCountRef.current += 1;
      invalidate();
      advanceCard(index + 1);
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : 'Grade failed');
    } finally {
      setGrading(false);
    }
  }, [grading, deck, index, invalidate, advanceCard, practiceMode, isCram]);

  // Auto-grade using scoreAnswer's suggestedGrade, then advance.
  // Blank answer → grade 1 (Blackout). Used by the nav Next button.
  const handleAutoNext = useCallback(async () => {
    const item = deck[index];
    if (!item) return;
    const expected = getExpectedNotes(item, practiceMode, sequence, isBb);
    const s = userAnswer.trim() ? scoreAnswer(userAnswer, expected) : null;
    await handleGrade(s?.suggestedGrade ?? 1);
  }, [deck, index, practiceMode, sequence, isBb, userAnswer, handleGrade]);

  // Keep refs in sync for keyboard handler
  handleGradeRef.current = handleGrade;
  handleNextRef.current = handleNext;

  const cardsLoading = !authed || !ensured || loadingDue || loadingAll;
  // Config screen shows for all modes while no config selected (cards load in background)
  const showConfig = authed && ensured && !config;
  const loading = cardsLoading && !showConfig;

  // ─── Render ───────────────────────────────────────────────────────────────

  const modeLabel = MODE_LABELS[practiceMode] ?? practiceMode;

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
                <BreadcrumbLink href="/practice">Practice</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{modeLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleBb}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                isBb
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
              title={isBb ? 'Showing Bb transposition — click for concert pitch' : 'Showing concert pitch — click for Bb'}
            >
              {isBb ? 'Bb' : 'Concert'}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSession}
              disabled={!deck.length && !done}
            >
              New Session
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:gap-6 sm:p-6">
          {loading ? (
            <LoadingSkeleton />
          ) : showConfig ? (
            <ConfigScreen mode={practiceMode} onSelect={setConfig} tr={tr} />
          ) : done ? (
            <DoneScreen total={deck.length} isCram={isCram} config={config} onNewSession={handleNewSession} tr={tr} />
          ) : deck.length === 0 ? (
            <EmptyDeck />
          ) : (
            <PracticeCard
              item={deck[index]!}
              mode={practiceMode}
              sequence={sequence}
              isBb={isBb}
              flipped={flipped}
              grading={grading}
              current={index + 1}
              total={deck.length}
              isCram={isCram}
              config={config}
              userAnswer={userAnswer}
              score={score}
              gradeError={gradeError}
              onAnswerChange={setUserAnswer}
              onFlip={() => {
                const item = deck[index]!;
                const expected = getExpectedNotes(item, practiceMode, sequence, isBb);
                setScore(userAnswer.trim() ? scoreAnswer(userAnswer, expected) : null);
                setFlipped(true);
              }}
              onGrade={handleGrade}
              onBack={handleBack}
              onSkip={handleAutoNext}
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
  isBb,
  flipped,
  grading,
  current,
  total,
  isCram,
  config,
  userAnswer,
  score,
  gradeError,
  onAnswerChange,
  onFlip,
  onGrade,
  onBack,
  onSkip,
  tr,
}: {
  item: DeckItem;
  mode: PracticeMode;
  sequence: string[];
  isBb: boolean;
  flipped: boolean;
  grading: boolean;
  current: number;
  total: number;
  isCram: boolean;
  config: PracticeConfig | null;
  userAnswer: string;
  score: AnswerScore | null;
  gradeError: string | null;
  onAnswerChange: (v: string) => void;
  onFlip: () => void;
  onGrade: (g: Grade) => void;
  onBack: () => void;
  onSkip: () => void;
  tr: Tr;
}) {
  const isInterval = item.type === 'interval';
  const isRootSelected = config?.type === 'root-selected';
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
        </div>
        {!flipped && (
          <span className="text-xs opacity-60">
            {isInterval ? tr.hintInterval : tr.hintReveal}
          </span>
        )}
      </div>

      {/* Prompt card */}
      <div className="min-h-52 rounded-xl border bg-card p-8 shadow-sm flex items-center justify-center">
        {item.type === 'standard' ? (
          <StandardFront item={item} mode={mode} sequence={sequence} isBb={isBb} tr={tr} />
        ) : item.type === 'interval' ? (
          <IntervalFront item={item} isBb={isBb} tr={tr} />
        ) : (
          <TwoFiveOneFront item={item} isBb={isBb} tr={tr} />
        )}
      </div>

      {/* Answer input — editable before reveal, scored display after */}
      {!flipped ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            {tr.yourAnswer}
          </label>
          <textarea
            value={userAnswer}
            onChange={e => onAnswerChange(e.target.value)}
            rows={isInterval ? 1 : 3}
            placeholder={getAnswerPlaceholder(mode, tr)}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 hover:border-ring/50 focus:ring-2 focus:ring-ring/50"
          />
        </div>
      ) : (
        <AnswerReview userAnswer={userAnswer} score={score} tr={tr} />
      )}

      {/* Correct answer — only shown after reveal */}
      {flipped && (
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 sm:p-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
            {tr.correctAnswer}
          </p>
          {item.type === 'standard' ? (
            <StandardBack item={item} mode={mode} sequence={sequence} isBb={isBb} />
          ) : item.type === 'interval' ? (
            <IntervalBack item={item} isBb={isBb} />
          ) : (
            <TwoFiveOneBack item={item} isBb={isBb} />
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
          onClick={onSkip}
          disabled={current === total}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          {tr.nextCard}
        </button>
      </div>
    </div>
  );
}

function ConfigScreen({ mode, onSelect, tr }: { mode: PracticeMode; onSelect: (c: PracticeConfig) => void; tr: Tr }) {
  const [sequenceCount, setSequenceCount] = useState(5);
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
        <p className="text-sm text-muted-foreground uppercase tracking-widest">{MODE_LABELS[mode]}</p>
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

      {/* Root Free */}
      <button
        onClick={() => onSelect({ type: 'root-free', sequenceCount })}
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
          onClick={() => onSelect({ type: 'root-selected', roots: selectedRoots, sequenceCount })}
        >
          {tr.modeStart}
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-6">
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
  onNewSession,
  tr,
}: {
  total: number;
  isCram: boolean;
  config: PracticeConfig | null;
  onNewSession: () => void;
  tr: Tr;
}) {
  const subtitle = config?.type === 'root-selected'
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
      <p className="text-2xl">No cards found</p>
      <p className="text-muted-foreground text-sm">
        Cards are still being set up. Try again in a moment.
      </p>
      <Link href="/practice" className={buttonVariants({ variant: 'outline' })}>Go back</Link>
    </div>
  );
}
