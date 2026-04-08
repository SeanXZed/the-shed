export type { Root } from '../constants/roots';
export type { ChordQuality, ScaleDefinition } from '../constants/scaleDefinitions';
export type { ScaleData } from '../theory/TheoryMapper';
export type { CardSM2State } from '../theory/sm2';
export type { TwoFiveOne, TwoFiveOneChord } from '../theory/twoFiveOne';

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
