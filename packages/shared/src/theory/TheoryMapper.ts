import type { Root } from '../constants/roots';
import { noteToSemitone, semitoneToNote } from '../constants/chromatic';
import { getScaleDefinition } from '../constants/scaleDefinitions';
import { transposeNotes, BB_OFFSET } from './transpose';
import {
  getChordTones,
  getChordSymbol,
  CHORD_TONE_DEGREES,
} from './chordTones';

export interface ScaleData {
  scaleId: string;
  scaleName: string;
  root: Root;

  // Concert pitch
  concertNotes: readonly string[];
  concertChordTones: readonly string[];
  concertChordSymbol: string;

  // Bb transposition (display only)
  trumpetNotes: readonly string[];
  trumpetChordTones: readonly string[];
  trumpetChordSymbol: string;

  // Shared across concert/Bb
  scaleDegrees: readonly string[];
  chordDegrees: readonly string[];
}

// Apply semitone intervals to a root to produce note names.
export function applyIntervals(root: Root, intervals: readonly number[]): string[] {
  const rootSemitone = noteToSemitone(root);
  return intervals.map((offset) => semitoneToNote(rootSemitone + offset));
}

export function getScaleData(root: Root, scaleId: string): ScaleData {
  const def = getScaleDefinition(scaleId);

  const concertNotes = applyIntervals(root, def.intervals);
  const concertChordTones = getChordTones(root, def.chordQuality);
  const concertChordSymbol = getChordSymbol(root, def.chordQuality);

  const trumpetNotes = transposeNotes(concertNotes, BB_OFFSET);
  const trumpetRoot = semitoneToNote(noteToSemitone(root) + BB_OFFSET);
  const trumpetChordTones = getChordTones(trumpetRoot, def.chordQuality);
  const trumpetChordSymbol = getChordSymbol(trumpetRoot, def.chordQuality);

  return {
    scaleId: def.id,
    scaleName: def.name,
    root,
    concertNotes,
    concertChordTones,
    concertChordSymbol,
    trumpetNotes,
    trumpetChordTones,
    trumpetChordSymbol,
    scaleDegrees: def.degreeLabels,
    chordDegrees: CHORD_TONE_DEGREES[def.chordQuality],
  };
}
