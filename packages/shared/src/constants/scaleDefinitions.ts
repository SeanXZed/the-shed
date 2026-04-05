export type ChordQuality = 'maj7' | 'min7' | 'dom7' | 'min7b5' | 'minmaj7';

export interface ScaleDefinition {
  id: string;
  name: string;
  /** Semitone offsets from root, ascending. */
  intervals: readonly number[];
  /** Human-readable degree label for each note (same length as intervals). */
  degreeLabels: readonly string[];
  chordQuality: ChordQuality;
}

// Source of truth for all 17 parallel scales.
// Bebop Major: passing tone at semitone 8 (Ab/G#) between degrees 5 and 6.
// Bebop Major ≠ Bebop Dominant — different intervals, different chord quality.
export const SCALE_DEFINITIONS: readonly ScaleDefinition[] = [
  {
    id: 'major',
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degreeLabels: ['1', '2', '3', '4', '5', '6', '7'],
    chordQuality: 'maj7',
  },
  {
    id: 'natural_minor',
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degreeLabels: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    chordQuality: 'min7',
  },
  {
    id: 'melodic_minor',
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    degreeLabels: ['1', '2', 'b3', '4', '5', '6', '7'],
    chordQuality: 'minmaj7',
  },
  {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degreeLabels: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    chordQuality: 'minmaj7',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degreeLabels: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    chordQuality: 'min7',
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degreeLabels: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    chordQuality: 'min7',
  },
  {
    id: 'lydian',
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degreeLabels: ['1', '2', '3', '#4', '5', '6', '7'],
    chordQuality: 'maj7',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degreeLabels: ['1', '2', '3', '4', '5', '6', 'b7'],
    chordQuality: 'dom7',
  },
  {
    id: 'locrian',
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degreeLabels: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
    chordQuality: 'min7b5',
  },
  {
    id: 'minor_blues',
    name: 'Minor Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    degreeLabels: ['1', 'b3', '4', '#4', '5', 'b7'],
    chordQuality: 'min7',
  },
  {
    id: 'mixolydian_b9b13',
    name: 'Mixolydian b9 b13',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    degreeLabels: ['1', 'b9', '3', '4', '5', 'b13', 'b7'],
    chordQuality: 'dom7',
  },
  {
    id: 'lydian_dominant',
    name: 'Lydian Dominant',
    intervals: [0, 2, 4, 6, 7, 9, 10],
    degreeLabels: ['1', '2', '3', '#4', '5', '6', 'b7'],
    chordQuality: 'dom7',
  },
  {
    id: 'altered',
    name: 'Altered Scale',
    intervals: [0, 1, 3, 4, 6, 8, 10],
    degreeLabels: ['1', 'b9', '#9', '3', '#11', '#5', 'b7'],
    chordQuality: 'dom7',
  },
  {
    id: 'bebop_major',
    name: 'Bebop Major',
    // 8 notes: passing tone at semitone 8 (Ab) between degrees 5 and 6
    // C D E F G Ab A B
    intervals: [0, 2, 4, 5, 7, 8, 9, 11],
    degreeLabels: ['1', '2', '3', '4', '5', '#5', '6', '7'],
    chordQuality: 'maj7',
  },
  {
    id: 'bebop_minor',
    name: 'Bebop Minor',
    // 8 notes: passing tone between b3 and 3
    // C D Eb E F G A Bb
    intervals: [0, 2, 3, 4, 5, 7, 9, 10],
    degreeLabels: ['1', '2', 'b3', '3', '4', '5', '6', 'b7'],
    chordQuality: 'min7',
  },
  {
    id: 'bebop_dominant',
    name: 'Bebop Dominant',
    // 8 notes: passing tone between b7 and 7
    // C D E F G A Bb B
    intervals: [0, 2, 4, 5, 7, 9, 10, 11],
    degreeLabels: ['1', '2', '3', '4', '5', '6', 'b7', '7'],
    chordQuality: 'dom7',
  },
  {
    id: 'bebop_diminished',
    name: 'Bebop Diminished',
    // 8 notes: half-whole diminished with passing tone
    // C Db Eb E Gb G A Bb
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    degreeLabels: ['1', 'b2', 'b3', '3', 'b5', '5', '6', 'b7'],
    chordQuality: 'dom7',
  },
] as const;

export const SCALE_MAP = new Map(SCALE_DEFINITIONS.map((s) => [s.id, s]));

export function getScaleDefinition(id: string): ScaleDefinition {
  const def = SCALE_MAP.get(id);
  if (!def) throw new Error(`Unknown scale id: "${id}"`);
  return def;
}
