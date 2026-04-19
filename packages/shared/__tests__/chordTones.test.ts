import { describe, it, expect } from 'vitest';
import { getChordTones, getChordSymbol } from '../src/theory/chordTones.js';

describe('getChordTones', () => {
  it('C maj7: C E G B', () => expect(getChordTones('C', 'maj7')).toEqual(['C', 'E', 'G', 'B']));
  it('C min7: C Eb G Bb', () => expect(getChordTones('C', 'min7')).toEqual(['C', 'Eb', 'G', 'Bb']));
  it('C dom7: C E G Bb', () => expect(getChordTones('C', 'dom7')).toEqual(['C', 'E', 'G', 'Bb']));
  it('C min7b5: C Eb Gb Bb', () => expect(getChordTones('C', 'min7b5')).toEqual(['C', 'Eb', 'Gb', 'Bb']));
  it('Ab min7b5: Ab Cb Ebb Gb (Locrian tertian spelling)', () =>
    expect(getChordTones('Ab', 'min7b5')).toEqual(['Ab', 'Cb', 'Ebb', 'Gb']));
  it('C minmaj7: C Eb G B', () => expect(getChordTones('C', 'minmaj7')).toEqual(['C', 'Eb', 'G', 'B']));
  it('G dom7: G B D F', () => expect(getChordTones('G', 'dom7')).toEqual(['G', 'B', 'D', 'F']));
  it('Bb min7: Bb Db F Ab', () => expect(getChordTones('Bb', 'min7')).toEqual(['Bb', 'Db', 'F', 'Ab']));
});

describe('getChordSymbol', () => {
  it('C maj7 → C∆7', () => expect(getChordSymbol('C', 'maj7')).toBe('C∆7'));
  it('D min7 → D-7', () => expect(getChordSymbol('D', 'min7')).toBe('D-7'));
  it('G dom7 → G7', () => expect(getChordSymbol('G', 'dom7')).toBe('G7'));
  it('B min7b5 → B-7b5', () => expect(getChordSymbol('B', 'min7b5')).toBe('B-7b5'));
});
