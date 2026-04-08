import { noteToSemitone, semitoneToNote } from '../constants/chromatic';

export const BB_OFFSET = 2; // Concert → Bb: written pitch is 2 semitones higher

export function transposeNote(note: string, semitones: number): string {
  return semitoneToNote(noteToSemitone(note) + semitones);
}

export function transposeNotes(notes: readonly string[], semitones: number): string[] {
  return notes.map((n) => transposeNote(n, semitones));
}
