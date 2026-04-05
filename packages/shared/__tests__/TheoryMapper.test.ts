import { describe, it, expect } from 'vitest';
import { getScaleData } from '../src/theory/TheoryMapper.js';
import { SCALE_DEFINITIONS } from '../src/constants/scaleDefinitions.js';

// Expected concert notes for each scale at root C.
// Source of truth: the scale table in docs/EXECUTION_PLAN_FOUNDATION.md (with Bebop Major corrected).
const EXPECTED_CONCERT_NOTES: Record<string, string[]> = {
  major:              ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  natural_minor:      ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  melodic_minor:      ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
  harmonic_minor:     ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
  dorian:             ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
  phrygian:           ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  lydian:             ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
  mixolydian:         ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
  locrian:            ['C', 'Db', 'Eb', 'F', 'F#', 'Ab', 'Bb'],
  minor_blues:        ['C', 'Eb', 'F', 'F#', 'G', 'Bb'],
  mixolydian_b9b13:   ['C', 'Db', 'E', 'F', 'G', 'Ab', 'Bb'],
  lydian_dominant:    ['C', 'D', 'E', 'F#', 'G', 'A', 'Bb'],
  altered:            ['C', 'Db', 'Eb', 'E', 'F#', 'Ab', 'Bb'],
  bebop_major:        ['C', 'D', 'E', 'F', 'G', 'Ab', 'A', 'B'],
  bebop_minor:        ['C', 'D', 'Eb', 'E', 'F', 'G', 'A', 'Bb'],
  bebop_dominant:     ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'B'],
  bebop_diminished:   ['C', 'Db', 'Eb', 'E', 'F#', 'G', 'A', 'Bb'],
};

describe('getScaleData — all 17 scales at root C (concert pitch)', () => {
  for (const def of SCALE_DEFINITIONS) {
    it(`${def.name}`, () => {
      const data = getScaleData('C', def.id);
      expect(data.concertNotes).toEqual(EXPECTED_CONCERT_NOTES[def.id]);
    });
  }
});

describe('getScaleData — chord symbols at root C', () => {
  it('major → C∆7', () => expect(getScaleData('C', 'major').concertChordSymbol).toBe('C∆7'));
  it('dorian → C-7', () => expect(getScaleData('C', 'dorian').concertChordSymbol).toBe('C-7'));
  it('mixolydian → C7', () => expect(getScaleData('C', 'mixolydian').concertChordSymbol).toBe('C7'));
  it('locrian → C-7b5', () => expect(getScaleData('C', 'locrian').concertChordSymbol).toBe('C-7b5'));
  it('altered → C7', () => expect(getScaleData('C', 'altered').concertChordSymbol).toBe('C7'));
  it('melodic_minor → C-7(∆)', () => expect(getScaleData('C', 'melodic_minor').concertChordSymbol).toBe('C-7(∆)'));
});

describe('getScaleData — Bb transposition', () => {
  it('C Altered: trumpet notes shift by +2 semitones', () => {
    const data = getScaleData('C', 'altered');
    // Concert: C Db Eb E F# Ab Bb  (F# is canonical for semitone 6)
    // Bb (+2): D Eb F F# Ab Bb C  (F#+2 = Ab)
    expect(data.trumpetNotes).toEqual(['D', 'Eb', 'F', 'F#', 'Ab', 'Bb', 'C']);
  });

  it('C Altered: trumpet chord symbol is D7', () => {
    expect(getScaleData('C', 'altered').trumpetChordSymbol).toBe('D7');
  });

  it('C Major: trumpet notes are D Major', () => {
    const data = getScaleData('C', 'major');
    expect(data.trumpetNotes).toEqual(['D', 'E', 'F#', 'G', 'A', 'B', 'Db']);
  });

  it('C Major: trumpet chord symbol is D∆7', () => {
    expect(getScaleData('C', 'major').trumpetChordSymbol).toBe('D∆7');
  });
});

describe('getScaleData — other roots', () => {
  it('G Major notes', () => {
    const data = getScaleData('G', 'major');
    expect(data.concertNotes).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#']);
  });

  it('F Major notes', () => {
    const data = getScaleData('F', 'major');
    expect(data.concertNotes).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
  });

  it('Bb Dorian notes', () => {
    const data = getScaleData('Bb', 'dorian');
    expect(data.concertNotes).toEqual(['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab']);
  });

  it('F# Lydian Dominant notes', () => {
    const data = getScaleData('F#', 'lydian_dominant');
    expect(data.concertNotes).toEqual(['F#', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'E']);
  });
});

describe('getScaleData — degree labels', () => {
  it('altered scale has correct degree labels', () => {
    const data = getScaleData('C', 'altered');
    expect(data.scaleDegrees).toEqual(['1', 'b9', '#9', '3', '#11', '#5', 'b7']);
  });

  it('bebop major has 8 degree labels', () => {
    const data = getScaleData('C', 'bebop_major');
    expect(data.scaleDegrees).toHaveLength(8);
    expect(data.scaleDegrees).toEqual(['1', '2', '3', '4', '5', '#5', '6', '7']);
  });
});
