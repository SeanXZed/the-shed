// 12 canonical root names in circle-of-fifths ascending order.
// These are the canonical root strings used across legacy and game-based practice tables.
export const ROOTS = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F',
] as const;

export type Root = typeof ROOTS[number];

export function isRoot(value: string): value is Root {
  return (ROOTS as readonly string[]).includes(value);
}
