import { describe, expect, it } from 'vitest';
import { ROOTS, SCALE_DEFINITIONS, buildGameSeedSpecs, CHORD_QUALITIES } from '../src/index';

describe('game catalog seed specs', () => {
  it('includes dim7 in chord qualities', () => {
    expect(CHORD_QUALITIES).toContain('dim7');
  });

  it('matches expected per-slug counts', () => {
    const specs = buildGameSeedSpecs();
    const bySlug = new Map(specs.map((s) => [s.slug, s.items.length]));

    const roots = ROOTS.length;
    const scaleTypes = SCALE_DEFINITIONS.length;
    const chordQualities = CHORD_QUALITIES.length;

    expect(bySlug.get('full_scale')).toBe(scaleTypes * roots);
    expect(bySlug.get('sequence')).toBe(scaleTypes * roots);
    expect(bySlug.get('full_chord')).toBe(chordQualities * roots);
    expect(bySlug.get('progression_251')).toBe(roots * 2);
    expect(bySlug.get('interval')).toBe(11 * roots * 2);
  });
});

