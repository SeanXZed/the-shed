export type { Root } from '../constants/roots.js';
export type { ChordQuality, ScaleDefinition } from '../constants/scaleDefinitions.js';
export type { ScaleData } from '../theory/TheoryMapper.js';
export type { CardSM2State } from '../theory/sm2.js';
export type { TwoFiveOne, TwoFiveOneChord } from '../theory/twoFiveOne.js';

export type PracticeMode = 'full_scale' | 'full_chord' | 'sequence' | '251';

export type Grade = 1 | 2 | 3 | 4;

export interface Card {
  id: string;
  user_id: string;
  scale_type: string;
  root: string;
  ease_factor: number;
  interval_days: number;
  next_review: string; // ISO string from DB
  repetitions: number;
  last_reviewed_at: string | null;
}
