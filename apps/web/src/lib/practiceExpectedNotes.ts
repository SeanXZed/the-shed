/**
 * Shared note resolution for practice + audio playback.
 * Audio always uses concert pitch (isBb = false).
 */
import {
  getScaleData,
  transposeNote,
  type Card,
  type Root,
  type TwoFiveOne,
} from '@the-shed/shared';

export type PracticeMode = 'full-scale' | 'full-chord' | 'sequence' | '251' | 'interval';

export interface StandardItem {
  type: 'standard';
  card: Card;
}

export interface TwoFiveOneItem {
  type: '251';
  key: Root;
  tonality: 'major' | 'minor';
  combo: TwoFiveOne;
  cards: { ii: Card; V: Card; I: Card };
}

export interface IntervalItem {
  type: 'interval';
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
    const degreeToNote = Object.fromEntries(data.scaleDegrees.map((d, i) => [d, notes[i] ?? '?']));
    return sequence.map(d => degreeToNote[d] ?? '?');
  }

  const seen = new Set<string>();
  const all: string[] = [];
  for (const { root, scaleType } of [item.combo.ii, item.combo.V, item.combo.I]) {
    const data = getScaleData(root, scaleType);
    const tones = isBb ? data.trumpetChordTones : data.concertChordTones;
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
  return getExpectedNotes(item, mode, sequence, false);
}
