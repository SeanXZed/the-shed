import type { Root } from '../constants/roots';
import { isRoot } from '../constants/roots';
import { transposeRoot } from './diatonicSpelling';

export interface TwoFiveOneChord {
  scaleType: string;
  root: Root;
}

export interface TwoFiveOne {
  key: Root;
  tonality: 'major' | 'minor';
  ii: TwoFiveOneChord;
  V: TwoFiveOneChord;
  I: TwoFiveOneChord;
}

// Default scale choices per chord function.
// V chord can be swapped in the UI (mixolydian ↔ lydian_dominant ↔ altered).
const MAJOR_SCALE_TYPES = {
  ii: 'dorian',
  V: 'mixolydian',
  I: 'major',
} as const;

const MINOR_SCALE_TYPES = {
  ii: 'locrian',
  V: 'altered',
  I: 'natural_minor',
} as const;

function computeRoot(key: Root, semitones: number): Root {
  const note = transposeRoot(key, semitones);
  if (!isRoot(note)) {
    throw new Error(`Computed root "${note}" is not in ROOTS. Check enharmonic spelling for key "${key}".`);
  }
  return note;
}

export function get251(key: Root, tonality: 'major' | 'minor'): TwoFiveOne {
  const scaleTypes = tonality === 'major' ? MAJOR_SCALE_TYPES : MINOR_SCALE_TYPES;

  return {
    key,
    tonality,
    ii: { scaleType: scaleTypes.ii, root: computeRoot(key, 2) },
    V:  { scaleType: scaleTypes.V,  root: computeRoot(key, 7) },
    I:  { scaleType: scaleTypes.I,  root: key },
  };
}
