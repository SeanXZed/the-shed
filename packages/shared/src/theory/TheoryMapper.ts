import type { Root } from '../constants/roots';
import { noteToSemitone, semitoneToNote } from '../constants/chromatic';
import { getScaleDefinition } from '../constants/scaleDefinitions';
import { BB_OFFSET, EB_OFFSET } from './transpose';
import { spellScaleForRoot, spellSevenNoteScale, transposeRoot } from './diatonicSpelling';
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

  // Eb transposition (display only)
  ebNotes: readonly string[];
  ebChordTones: readonly string[];
  ebChordSymbol: string;

  // Shared across concert/Bb
  scaleDegrees: readonly string[];
  chordDegrees: readonly string[];
}

/** Apply semitone intervals; 7-note scales use diatonic spelling. */
export function applyIntervals(root: Root, intervals: readonly number[]): string[] {
  if (intervals.length === 7) {
    return spellSevenNoteScale(root, intervals);
  }
  const rootSemitone = noteToSemitone(root);
  return intervals.map((offset) => semitoneToNote(rootSemitone + offset));
}

export function getScaleData(root: Root, scaleId: string): ScaleData {
  const def = getScaleDefinition(scaleId);

  const concertNotes = spellScaleForRoot(root, scaleId);
  const concertChordTones = getChordTones(root, def.chordQuality);
  const concertChordSymbol = getChordSymbol(root, def.chordQuality);

  const trumpetRoot = transposeRoot(root, BB_OFFSET);
  const trumpetNotes = spellScaleForRoot(trumpetRoot, scaleId);
  const trumpetChordTones = getChordTones(trumpetRoot, def.chordQuality);
  const trumpetChordSymbol = getChordSymbol(trumpetRoot, def.chordQuality);

  const ebRoot = transposeRoot(root, EB_OFFSET);
  const ebNotes = spellScaleForRoot(ebRoot, scaleId);
  const ebChordTones = getChordTones(ebRoot, def.chordQuality);
  const ebChordSymbol = getChordSymbol(ebRoot, def.chordQuality);

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
    ebNotes,
    ebChordTones,
    ebChordSymbol,
    scaleDegrees: def.degreeLabels,
    chordDegrees: CHORD_TONE_DEGREES[def.chordQuality],
  };
}
