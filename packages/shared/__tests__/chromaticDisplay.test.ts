import { describe, it, expect } from 'vitest';
import { formatNoteWithEnharmonicHint, formatNotesWithEnharmonicHints } from '../src/constants/chromatic.js';

describe('formatNoteWithEnharmonicHint', () => {
  it('adds parenthetical enharmonics for rare spellings', () => {
    expect(formatNoteWithEnharmonicHint('E#')).toBe('E#(F)');
    expect(formatNoteWithEnharmonicHint('Cb')).toBe('Cb(B)');
    expect(formatNoteWithEnharmonicHint('Fb')).toBe('Fb(E)');
    expect(formatNoteWithEnharmonicHint('B#')).toBe('B#(C)');
  });

  it('leaves common spellings unchanged', () => {
    expect(formatNoteWithEnharmonicHint('F#')).toBe('F#');
    expect(formatNoteWithEnharmonicHint('Bb')).toBe('Bb');
  });

  it('maps arrays', () => {
    expect(formatNotesWithEnharmonicHints(['B#', 'C', 'D'])).toEqual(['B#(C)', 'C', 'D']);
  });
});
