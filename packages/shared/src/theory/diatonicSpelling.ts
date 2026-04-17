import type { Root } from '../constants/roots';
import type { ChordQuality } from '../constants/scaleDefinitions';
import { ROOTS } from '../constants/roots';
import { noteToSemitone } from '../constants/chromatic';
import { getScaleDefinition } from '../constants/scaleDefinitions';

/** Letter indices 0–6 for C D E F G A B */
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** Natural pitch classes (no accidentals) for each letter index. */
const NATURAL_PC: readonly number[] = [0, 2, 4, 5, 7, 9, 11];

/** Sharp and flat pitch-class spellings (same order as semitone index 0–11). */
const PC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const PC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/** Major scale intervals from root (Ionian). */
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;
const NATURAL_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10] as const;
const MELODIC_MINOR_INTERVALS = [0, 2, 3, 5, 7, 9, 11] as const;
const MIXOLYDIAN_INTERVALS = [0, 2, 4, 5, 7, 9, 10] as const;
/** Altered (super locrian): 1 b2 b3 3 #11 #5 b7 — letters repeat at b3 / 3 (#9 / 3). */
const ALTERED_INTERVALS = [0, 1, 3, 4, 6, 8, 10] as const;
/** Letter steps from root; #5 uses A (Ab) not G (G#) for common chart spelling. */
const ALTERED_LETTER_STEPS = [0, 1, 2, 2, 3, 5, 6] as const;
/** Bebop minor: 1 2 b3 3 4 5 6 b7 — chromatic approach b3→3 reuses letter E (C root). */
const BEBOP_MINOR_INTERVALS = [0, 2, 3, 4, 5, 7, 9, 10] as const;
const BEBOP_MINOR_LETTER_STEPS = [0, 1, 2, 2, 3, 4, 5, 6] as const;

/** Circle-of-fifths: these roots use sharp-leaning enharmonics when ambiguous. */
const SHARP_ROOTS: ReadonlySet<Root> = new Set(['C', 'G', 'D', 'A', 'E', 'B', 'F#']);

export function rootPrefersSharps(root: Root): boolean {
  return SHARP_ROOTS.has(root);
}

/** Map pitch class to a name using sharp or flat gamut (for non-diatonic spellings). */
export function pitchClassToPreferredName(pc: number, preferSharps: boolean): string {
  const i = ((pc % 12) + 12) % 12;
  return preferSharps ? PC_SHARP[i]! : PC_FLAT[i]!;
}

/** Letter index 0–6 of the diatonic letter name of this root (F# → F, Bb → B). */
export function rootLetterIndex(root: string): number {
  const m = /^([A-G])/.exec(root);
  if (!m?.[1]) throw new Error(`Invalid root: "${root}"`);
  return LETTERS.indexOf(m[1] as (typeof LETTERS)[number]);
}

/**
 * Spell one letter name to match a target pitch class (12-TET).
 * Prefers single accidentals; supports ## and bb when needed (e.g. E# in F# major).
 */
export function spellLetterToPitchClass(letterIdx: number, targetPc: number): string {
  const letter = LETTERS[letterIdx] ?? 'C';
  const natural = NATURAL_PC[letterIdx] ?? 0;
  const target = ((targetPc % 12) + 12) % 12;
  let d = target - natural;
  d = ((d + 12) % 12);
  if (d > 6) d -= 12;

  if (d === 0) return letter;
  if (d === 1) return `${letter}#`;
  if (d === 2) return `${letter}##`;
  if (d === -1) return `${letter}b`;
  if (d === -2) return `${letter}bb`;
  if (d === 3) return `${letter}###`;
  if (d === -3) return `${letter}bbb`;
  throw new Error(`Cannot spell ${letter} to pc ${targetPc} (delta ${d})`);
}

/** Seven consecutive letter names starting from the root’s letter (diatonic modes). */
export function spellSevenNoteScale(root: Root, intervals: readonly number[]): string[] {
  const rootPc = noteToSemitone(root);
  const startLetter = rootLetterIndex(root);
  return intervals.map((offset, i) => {
    const letterIdx = (startLetter + i) % 7;
    const targetPc = (rootPc + offset + 120) % 12;
    return spellLetterToPitchClass(letterIdx, targetPc);
  });
}

export function spellMinorBlues(root: Root): string[] {
  const nm = spellSevenNoteScale(root, NATURAL_MINOR_INTERVALS);
  const fourthLetterIdx = (rootLetterIndex(root) + 3) % 7;
  const fourthPc = noteToSemitone(nm[3]!);
  const sharp4Pc = (fourthPc + 1) % 12;
  const sharp4 = spellLetterToPitchClass(fourthLetterIdx, sharp4Pc);
  return [nm[0]!, nm[2]!, nm[3]!, sharp4, nm[4]!, nm[6]!];
}

export function spellBebopMajor(root: Root): string[] {
  const m = spellSevenNoteScale(root, MAJOR_INTERVALS);
  const sixthLetterIdx = (rootLetterIndex(root) + 5) % 7;
  const sixthPc = noteToSemitone(m[5]!);
  const passingPc = (sixthPc - 1 + 12) % 12;
  const passing = spellLetterToPitchClass(sixthLetterIdx, passingPc);
  return [...m.slice(0, 5), passing, ...m.slice(5)];
}

export function spellAltered(root: Root): string[] {
  const rootPc = noteToSemitone(root);
  const startLetter = rootLetterIndex(root);
  return ALTERED_INTERVALS.map((offset, i) => {
    const letterIdx = (startLetter + ALTERED_LETTER_STEPS[i]!) % 7;
    const targetPc = (rootPc + offset + 120) % 12;
    return spellLetterToPitchClass(letterIdx, targetPc);
  });
}

export function spellBebopMinor(root: Root): string[] {
  const rootPc = noteToSemitone(root);
  const startLetter = rootLetterIndex(root);
  return BEBOP_MINOR_INTERVALS.map((offset, i) => {
    const letterIdx = (startLetter + BEBOP_MINOR_LETTER_STEPS[i]!) % 7;
    const targetPc = (rootPc + offset + 120) % 12;
    return spellLetterToPitchClass(letterIdx, targetPc);
  });
}

export function spellBebopDominant(root: Root): string[] {
  const mx = spellSevenNoteScale(root, MIXOLYDIAN_INTERVALS);
  const seventhLetterIdx = (rootLetterIndex(root) + 6) % 7;
  const seventhPc = noteToSemitone(mx[6]!);
  const leadPc = (seventhPc + 1) % 12;
  const leading = spellLetterToPitchClass(seventhLetterIdx, leadPc);
  return [...mx.slice(0, 6), mx[6]!, leading];
}

const BEBOP_DIM_INTERVALS = [0, 1, 3, 4, 6, 7, 9, 10] as const;

export function spellBebopDiminished(root: Root): string[] {
  // Half–whole diminished: inverse of root key so C line reads with flats (Gb not F#).
  const r = noteToSemitone(root);
  return BEBOP_DIM_INTERVALS.map((off) => {
    const pc = (r + off + 120) % 12;
    return pitchClassToPreferredName(pc, !rootPrefersSharps(root));
  });
}

/** Scale notes with key-signature-consistent spelling. */
export function spellScaleForRoot(root: Root, scaleId: string): string[] {
  const def = getScaleDefinition(scaleId);
  const { intervals, id } = def;

  if (id === 'altered') {
    return spellAltered(root);
  }
  if (intervals.length === 7) {
    return spellSevenNoteScale(root, intervals);
  }
  switch (id) {
    case 'minor_blues':
      return spellMinorBlues(root);
    case 'bebop_major':
      return spellBebopMajor(root);
    case 'bebop_minor':
      return spellBebopMinor(root);
    case 'bebop_dominant':
      return spellBebopDominant(root);
    case 'bebop_diminished':
      return spellBebopDiminished(root);
    default:
      return spellSevenNoteScale(root, intervals);
  }
}

/** Transpose a written root by semitones, returning the canonical `Root` in ROOTS. */
export function transposeRoot(root: Root, semitones: number): Root {
  const pc = (noteToSemitone(root) + semitones + 120) % 12;
  const found = (ROOTS as readonly string[]).find((r) => noteToSemitone(r as Root) === pc);
  if (!found) throw new Error(`No Root in ROOTS for pitch class ${pc}`);
  return found as Root;
}

const LOCRIAN_INTERVALS = [0, 1, 3, 5, 6, 8, 10] as const;

/**
 * Fully diminished 7th chord: stacked minor 3rds. Root keeps canonical spelling;
 * other tones use the opposite enharmonic preference so C°7 is C–Eb–Gb–A, not C–D#–F#–A#.
 */
export function getDiminishedSeventhChord(root: Root): string[] {
  const r = noteToSemitone(root);
  const preferFlatsForInner = !rootPrefersSharps(root);
  return [0, 3, 6, 9].map((off, i) => {
    const pc = (r + off + 12) % 12;
    if (i === 0) return root;
    return pitchClassToPreferredName(pc, preferFlatsForInner);
  });
}

/** Extract tertian chord tones from a spelled 7-note scale (indices 0,2,4,6). */
function chordTonesFromSpelledScale(spelled: readonly string[]): string[] {
  return [spelled[0]!, spelled[2]!, spelled[4]!, spelled[6]!];
}

/** Chord tones consistent with key spelling (tertian 7th chords). */
export function getChordTonesSpelled(root: Root, quality: ChordQuality): string[] {
  switch (quality) {
    case 'maj7':
      return chordTonesFromSpelledScale(spellSevenNoteScale(root, MAJOR_INTERVALS));
    case 'min7':
      return chordTonesFromSpelledScale(spellSevenNoteScale(root, NATURAL_MINOR_INTERVALS));
    case 'dom7':
      return chordTonesFromSpelledScale(spellSevenNoteScale(root, MIXOLYDIAN_INTERVALS));
    case 'min7b5':
      return chordTonesFromSpelledScale(spellSevenNoteScale(root, LOCRIAN_INTERVALS));
    case 'minmaj7':
      return chordTonesFromSpelledScale(spellSevenNoteScale(root, MELODIC_MINOR_INTERVALS));
    case 'dim7':
      return getDiminishedSeventhChord(root);
  }
}
