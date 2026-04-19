// Canonical 12-pitch chromatic scale.
// Flats preferred everywhere except F# and C# (jazz convention).
export const CHROMATIC = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
] as const;

// Enharmonic normalisation: maps any note name to its semitone index in CHROMATIC.
const ENHARMONICS: Record<string, number> = {
  'C': 0, 'B#': 0,
  'Cbb': 10,
  'C#': 1, 'Db': 1,
  'D': 2,
  'Dbb': 0,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'Ebb': 2,
  'F': 5, 'E#': 5,
  'Fbb': 3,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'Gbb': 5,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'Abb': 7,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
  'Bbb': 9,
};

export function noteToSemitone(note: string): number {
  const semitone = ENHARMONICS[note];
  if (semitone === undefined) throw new Error(`Unknown note name: "${note}"`);
  return semitone;
}

// Returns the canonical note name for a given semitone index (0–11).
export function semitoneToNote(semitone: number): string {
  const note = CHROMATIC[((semitone % 12) + 12) % 12];
  if (note === undefined) throw new Error(`Invalid semitone: ${semitone}`);
  return note;
}

/** Rare diatonic spellings → clearer 12-TET name for UI (display only). */
const ENHARMONIC_DISPLAY_HINTS: Record<string, string> = {
  'E#': 'F',
  Cb: 'B',
  Fb: 'E',
  'B#': 'C',
  Cbb: 'Bb',
  Dbb: 'C',
  Ebb: 'D',
  Fbb: 'Eb',
  Gbb: 'F',
  Abb: 'G',
  Bbb: 'A',
};

/**
 * Display-only: append a common enharmonic in parentheses for rare spellings
 * (E#, Cb, Fb, B#, double flats; no space before `(` so it reads as one label, e.g. `Cb(B)`, `Ebb(D)`).
 * Other spellings are returned unchanged.
 */
export function formatNoteWithEnharmonicHint(note: string): string {
  const hint = ENHARMONIC_DISPLAY_HINTS[note];
  return hint != null ? `${note}(${hint})` : note;
}

export function formatNotesWithEnharmonicHints(notes: readonly string[]): string[] {
  return notes.map(formatNoteWithEnharmonicHint);
}
