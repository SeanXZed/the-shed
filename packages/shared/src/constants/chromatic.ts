// Canonical 12-pitch chromatic scale.
// Flats preferred everywhere except F# and C# (jazz convention).
export const CHROMATIC = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
] as const;

// Enharmonic normalisation: maps any note name to its semitone index in CHROMATIC.
const ENHARMONICS: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
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
