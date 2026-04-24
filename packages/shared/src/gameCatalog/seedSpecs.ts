import { ROOTS } from '../constants/roots';
import { SCALE_DEFINITIONS } from '../constants/scaleDefinitions';
import type { ChordQuality } from '../constants/scaleDefinitions';

export type GameSlug = 'full_scale' | 'full_chord' | 'sequence' | 'progression_251' | 'interval';

export type GameSeedSpec = {
  slug: GameSlug;
  items: Array<{ canonical_key: string; data: Record<string, unknown> }>;
};

// Keep in sync with the practice UI interval list.
const INTERVAL_IDS = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'] as const;

// IMPORTANT: chord game seeding must not depend on SCALE_DEFINITIONS coverage.
export const CHORD_QUALITIES: readonly ChordQuality[] = ['maj7', 'min7', 'dom7', 'min7b5', 'minmaj7', 'dim7'];

export function buildGameSeedSpecs(): GameSeedSpec[] {
  const scaleTypes = SCALE_DEFINITIONS.map((d) => d.id);

  const scaleLikeItems = scaleTypes.flatMap((scaleType) =>
    ROOTS.map((root) => ({
      canonical_key: `${scaleType}::${root}`,
      data: { scale_type: scaleType, root },
    })),
  );

  const chordItems = CHORD_QUALITIES.flatMap((chordQuality) =>
    ROOTS.map((root) => ({
      canonical_key: `${chordQuality}::${root}`,
      data: { chord_quality: chordQuality, root },
    })),
  );

  const twoFiveOneItems = ROOTS.flatMap((key) =>
    (['major', 'minor'] as const).map((tonality) => ({
      canonical_key: `251::${key}::${tonality}`,
      data: { progression: '251', key, tonality },
    })),
  );

  const intervalItems = ROOTS.flatMap((root) =>
    INTERVAL_IDS.flatMap((interval_id) =>
      (['up', 'down'] as const).map((direction) => ({
        canonical_key: `${interval_id}::${root}::${direction}`,
        data: { root, interval_id, direction },
      })),
    ),
  );

  return [
    { slug: 'full_scale', items: scaleLikeItems },
    { slug: 'sequence', items: scaleLikeItems },
    { slug: 'full_chord', items: chordItems },
    { slug: 'progression_251', items: twoFiveOneItems },
    { slug: 'interval', items: intervalItems },
  ];
}

