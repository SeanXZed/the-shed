import type { ChordQuality } from '../constants/scaleDefinitions';
import type { Root } from '../constants/roots';
import { getChordTonesSpelled } from './diatonicSpelling';

// Semitone offsets from root for each chord quality.
export const CHORD_TONE_INTERVALS: Record<ChordQuality, readonly number[]> = {
  maj7:    [0, 4, 7, 11],
  min7:    [0, 3, 7, 10],
  dom7:    [0, 4, 7, 10],
  min7b5:  [0, 3, 6, 10],
  minmaj7: [0, 3, 7, 11],
  dim7:    [0, 3, 6, 9],
};

export const CHORD_TONE_DEGREES: Record<ChordQuality, readonly string[]> = {
  maj7:    ['1', '3', '5', '7'],
  min7:    ['1', 'b3', '5', 'b7'],
  dom7:    ['1', '3', '5', 'b7'],
  min7b5:  ['1', 'b3', 'b5', 'b7'],
  minmaj7: ['1', 'b3', '5', '7'],
  dim7:    ['1', 'b3', 'b5', 'bb7'],
};

// Chord symbol suffix appended to the root name.
export const CHORD_SUFFIX: Record<ChordQuality, string> = {
  maj7:    '∆7',
  min7:    '-7',
  dom7:    '7',
  min7b5:  '-7b5',
  minmaj7: '-7(∆)',
  dim7:    '°7',
};

export function getChordTones(root: string, quality: ChordQuality): string[] {
  return getChordTonesSpelled(root as Root, quality);
}

export function getChordSymbol(root: string, quality: ChordQuality): string {
  return `${root}${CHORD_SUFFIX[quality]}`;
}
