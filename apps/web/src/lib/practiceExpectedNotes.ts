/**
 * Shared note resolution for practice + audio playback.
 * Audio always uses concert pitch (offset = 0).
 */
import {
  getScaleData,
  transposeNote,
  transposeNotes,
  getChordTones,
  type ChordQuality,
  type Root,
  type TwoFiveOne,
} from '@the-shed/shared';

export type PracticeMode = 'full-scale' | 'full-chord' | 'sequence' | '251' | 'interval';

export type StandardItem =
  | {
      type: 'standard';
      kind: 'scale' | 'sequence';
      gameItemId: string;
      canonicalKey: string;
      root: Root;
      scaleType: string;
    }
  | {
      type: 'standard';
      kind: 'chord';
      gameItemId: string;
      canonicalKey: string;
      root: Root;
      chordQuality: ChordQuality;
    };

export interface TwoFiveOneItem {
  type: '251';
  gameItemId: string;
  canonicalKey: string;
  key: Root;
  tonality: 'major' | 'minor';
  combo: TwoFiveOne;
}

export interface IntervalItem {
  type: 'interval';
  gameItemId: string;
  canonicalKey: string;
  root: Root;
  intervalId: string;
  intervalName: string;
  semitones: number;
  direction: 'up' | 'down';
  answer: string;
}

export type DeckItem = StandardItem | TwoFiveOneItem | IntervalItem;

export function getExpectedNotes(
  item: DeckItem,
  mode: PracticeMode,
  sequence: string[],
  semitoneOffset: number,
): string[] {
  if (item.type === 'interval') {
    const answer = semitoneOffset ? transposeNote(item.answer, semitoneOffset) : item.answer;
    return [answer];
  }

  if (item.type === 'standard') {
    if (item.kind === 'chord') {
      const root = semitoneOffset ? (transposeNote(item.root, semitoneOffset) as Root) : item.root;
      return [...getChordTones(root, item.chordQuality)];
    }

    const data = getScaleData(item.root, item.scaleType);
    const notes = semitoneOffset ? transposeNotes(data.concertNotes, semitoneOffset) : data.concertNotes;
    if (mode === 'full-scale') return [...notes];
    const degreeToNote = Object.fromEntries(data.scaleDegrees.map((d, i) => [d, notes[i] ?? '?']));
    return sequence.map(d => degreeToNote[d] ?? '?');
  }

  const seen = new Set<string>();
  const all: string[] = [];
  for (const { root, scaleType } of [item.combo.ii, item.combo.V, item.combo.I]) {
    const data = getScaleData(root, scaleType);
    const tones =
      semitoneOffset ? transposeNotes(data.concertChordTones, semitoneOffset) : data.concertChordTones;
    tones.forEach(t => { if (!seen.has(t)) { seen.add(t); all.push(t); } });
  }
  return all;
}

/** Concert pitch only — for Tone.js playback (ignore Bb display toggle). */
export function getConcertExpectedNotes(
  item: DeckItem,
  mode: PracticeMode,
  sequence: string[],
): string[] {
  return getExpectedNotes(item, mode, sequence, 0);
}
