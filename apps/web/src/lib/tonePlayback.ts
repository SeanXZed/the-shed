import type { PolySynth } from 'tone';
import { noteToSemitone, semitoneToNote } from '@the-shed/shared';
import {
  getConcertExpectedNotes,
  type DeckItem,
  type PracticeMode,
} from '@/lib/practiceExpectedNotes';

export type ChordPlayMode = 'block' | 'arpeggio';

const CHORD_MODE_KEY = 'chord-play-mode';

export function getChordPlayMode(): ChordPlayMode {
  if (typeof window === 'undefined') return 'block';
  const v = window.localStorage.getItem(CHORD_MODE_KEY);
  return v === 'arpeggio' ? 'arpeggio' : 'block';
}

export function setChordPlayMode(mode: ChordPlayMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHORD_MODE_KEY, mode);
}

/** Monotonic ascending MIDI line for ordered pitch-class names (one octave from root, etc.). */
function midiAscendingLine(noteNames: string[]): number[] {
  if (noteNames.length === 0) return [];
  const firstPc = noteToSemitone(noteNames[0]!);
  let prev = (4 + 1) * 12 + firstPc;
  const out: number[] = [prev];
  for (let i = 1; i < noteNames.length; i++) {
    const pc = noteToSemitone(noteNames[i]!);
    const base = Math.floor(prev / 12) * 12;
    let curr = base + pc;
    if (curr <= prev) curr += 12;
    out.push(curr);
    prev = curr;
  }
  return out;
}

/** Unique chord tones sorted by pitch class, then voiced ascending (for ii–V–I union). */
function sortedChordLine(noteNames: string[]): number[] {
  if (noteNames.length === 0) return [];
  const pcs = [...new Set(noteNames.map(n => noteToSemitone(n)))].sort((a, b) => a - b);
  let prev = (4 + 1) * 12 + pcs[0]!;
  const out: number[] = [prev];
  for (let i = 1; i < pcs.length; i++) {
    const pc = pcs[i]!;
    const base = Math.floor(prev / 12) * 12;
    let curr = base + pc;
    if (curr <= prev) curr += 12;
    out.push(curr);
    prev = curr;
  }
  return out;
}

function midiToNoteName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const name = semitoneToNote(pc);
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

let activeSynth: PolySynth | null = null;
let playGeneration = 0;

function disposeActiveSynth(): void {
  if (activeSynth) {
    activeSynth.dispose();
    activeSynth = null;
  }
}

const NOTE_GAP_SEC = 0.2;
const NOTE_LEN_SEC = 0.2;
const INTERVAL_NOTE_LEN_SEC = 0.5;
const INTERVAL_GAP_SEC = 0.25;
const BLOCK_LEN_SEC = 1.4;

function scheduleDisposeAfter(ms: number, gen: number): void {
  window.setTimeout(() => {
    if (gen !== playGeneration) return;
    disposeActiveSynth();
  }, ms);
}

export async function playPracticeItem(
  item: DeckItem,
  mode: PracticeMode,
  sequence: string[],
  chordPlayMode: ChordPlayMode,
): Promise<void> {
  const notes = getConcertExpectedNotes(item, mode, sequence).filter(n => n !== '?');
  if (mode !== 'interval' && notes.length === 0) return;
  if (mode === 'interval' && item.type !== 'interval') return;

  const Tone = await import('tone');
  await Tone.start();
  playGeneration += 1;
  const gen = playGeneration;
  disposeActiveSynth();

  activeSynth = new Tone.PolySynth(Tone.Synth).toDestination();
  activeSynth.volume.value = -10;

  const now = Tone.now();

  if (mode === 'interval' && item.type === 'interval') {
    const delta = item.direction === 'up' ? item.semitones : -item.semitones;
    const rootMidi = (4 + 1) * 12 + noteToSemitone(item.root);
    const answerMidi = rootMidi + delta;
    let t = now;
    activeSynth.triggerAttackRelease(midiToNoteName(rootMidi), INTERVAL_NOTE_LEN_SEC, t);
    t += INTERVAL_GAP_SEC;
    activeSynth.triggerAttackRelease(midiToNoteName(answerMidi), INTERVAL_NOTE_LEN_SEC, t);
    scheduleDisposeAfter((INTERVAL_NOTE_LEN_SEC * 2 + INTERVAL_GAP_SEC + 0.25) * 1000, gen);
    return;
  }

  if (mode === 'full-scale') {
    const up = midiAscendingLine(notes);
    const down = up.length > 1 ? [...up].slice(0, -1).reverse() : [];
    const line = [...up, ...down];
    let t = now;
    for (const midi of line) {
      activeSynth.triggerAttackRelease(midiToNoteName(midi), NOTE_LEN_SEC, t);
      t += NOTE_GAP_SEC;
    }
    scheduleDisposeAfter((line.length * NOTE_GAP_SEC + NOTE_LEN_SEC + 0.15) * 1000, gen);
    return;
  }

  if (mode === 'sequence') {
    const line = midiAscendingLine(notes);
    let t = now;
    for (const midi of line) {
      activeSynth.triggerAttackRelease(midiToNoteName(midi), NOTE_LEN_SEC, t);
      t += NOTE_GAP_SEC;
    }
    scheduleDisposeAfter((line.length * NOTE_GAP_SEC + NOTE_LEN_SEC + 0.15) * 1000, gen);
    return;
  }

  const chordMidis = mode === '251' ? sortedChordLine(notes) : midiAscendingLine(notes);

  if (chordPlayMode === 'block') {
    const names = chordMidis.map(midiToNoteName);
    activeSynth.triggerAttackRelease(names, BLOCK_LEN_SEC, now);
    scheduleDisposeAfter((BLOCK_LEN_SEC + 0.2) * 1000, gen);
    return;
  }

  const up = chordMidis;
  const down = up.length > 1 ? [...up].slice(0, -1).reverse() : [];
  const line = [...up, ...down];
  let t = now;
  for (const midi of line) {
    activeSynth.triggerAttackRelease(midiToNoteName(midi), NOTE_LEN_SEC, t);
    t += NOTE_GAP_SEC;
  }
  scheduleDisposeAfter((line.length * NOTE_GAP_SEC + NOTE_LEN_SEC + 0.15) * 1000, gen);
}

