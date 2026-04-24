// Constants
export {
  CHROMATIC,
  noteToSemitone,
  semitoneToNote,
  formatNoteWithEnharmonicHint,
  formatNotesWithEnharmonicHints,
} from './constants/chromatic';
export { ROOTS, isRoot } from './constants/roots';
export { SCALE_DEFINITIONS, SCALE_MAP, getScaleDefinition } from './constants/scaleDefinitions';

// Theory
export { applyIntervals, getScaleData } from './theory/TheoryMapper';
export {
  spellScaleForRoot,
  spellSevenNoteScale,
  spellAltered,
  transposeRoot,
  rootPrefersSharps,
  pitchClassToPreferredName,
} from './theory/diatonicSpelling';
export { transposeNote, transposeNotes, BB_OFFSET, EB_OFFSET } from './theory/transpose';
export {
  CHORD_TONE_INTERVALS,
  CHORD_TONE_DEGREES,
  CHORD_SUFFIX,
  getChordTones,
  getChordSymbol,
} from './theory/chordTones';
export { nextSM2State } from './theory/sm2';
export { get251 } from './theory/twoFiveOne';

// Game catalog
export { buildGameSeedSpecs, CHORD_QUALITIES } from './gameCatalog/seedSpecs';

// Types
export type {
  Root,
  ChordQuality,
  ScaleDefinition,
  ScaleData,
  CardSM2State,
  TwoFiveOne,
  TwoFiveOneChord,
  PracticeMode,
  Grade,
  Card,
} from './types/index';
