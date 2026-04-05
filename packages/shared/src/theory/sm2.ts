export interface CardSM2State {
  ease_factor: number;   // >= 1.3
  interval_days: number; // >= 1
  repetitions: number;   // >= 0
  next_review: Date;
  last_reviewed_at: Date;
}

// Maps app grades (1–4) to SM-2 quality values (0–5).
const GRADE_TO_QUALITY: Record<1 | 2 | 3 | 4, number> = {
  1: 0, // Blackout
  2: 2, // Struggled
  3: 4, // Solid
  4: 5, // Perfect
};

const EF_FLOOR = 1.3;

export function nextSM2State(
  current: CardSM2State,
  grade: 1 | 2 | 3 | 4,
): CardSM2State {
  const q = GRADE_TO_QUALITY[grade];

  // SM-2 ease factor update formula
  const newEF = Math.max(
    EF_FLOOR,
    current.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  let newInterval: number;
  let newRepetitions: number;

  if (q < 3) {
    // Failed recall: reset streak
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall: advance interval
    if (current.repetitions === 0) {
      newInterval = 1;
    } else if (current.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(current.interval_days * newEF);
    }
    newRepetitions = current.repetitions + 1;
  }

  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    ease_factor: newEF,
    interval_days: newInterval,
    repetitions: newRepetitions,
    next_review: nextReview,
    last_reviewed_at: now,
  };
}
