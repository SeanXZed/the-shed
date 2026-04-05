import { describe, it, expect, beforeEach } from 'vitest';
import { nextSM2State, type CardSM2State } from '../src/theory/sm2.js';

function makeCard(overrides: Partial<CardSM2State> = {}): CardSM2State {
  return {
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    next_review: new Date(),
    last_reviewed_at: new Date(),
    ...overrides,
  };
}

describe('nextSM2State', () => {
  it('grade 1 (Blackout) resets repetitions and interval', () => {
    const result = nextSM2State(makeCard({ repetitions: 5, interval_days: 30 }), 1);
    expect(result.repetitions).toBe(0);
    expect(result.interval_days).toBe(1);
  });

  it('grade 2 (Struggled) resets repetitions and interval', () => {
    const result = nextSM2State(makeCard({ repetitions: 3, interval_days: 15 }), 2);
    expect(result.repetitions).toBe(0);
    expect(result.interval_days).toBe(1);
  });

  it('grade 4 (Perfect) on fresh card: interval = 1, repetitions = 1', () => {
    const result = nextSM2State(makeCard(), 4);
    expect(result.repetitions).toBe(1);
    expect(result.interval_days).toBe(1);
  });

  it('grade 3 after one success: interval = 6, repetitions = 2', () => {
    const result = nextSM2State(makeCard({ repetitions: 1, interval_days: 1 }), 3);
    expect(result.repetitions).toBe(2);
    expect(result.interval_days).toBe(6);
  });

  it('grade 3 after two successes with EF=2.5: interval = round(6 * 2.5) = 15', () => {
    const result = nextSM2State(makeCard({ repetitions: 2, interval_days: 6, ease_factor: 2.5 }), 3);
    expect(result.repetitions).toBe(3);
    expect(result.interval_days).toBe(15);
  });

  it('grade 1 after a long streak resets to 0 repetitions and 1 day', () => {
    const result = nextSM2State(makeCard({ repetitions: 10, interval_days: 120 }), 1);
    expect(result.repetitions).toBe(0);
    expect(result.interval_days).toBe(1);
  });

  it('ease_factor never drops below 1.3', () => {
    // Repeatedly grading 1 (q=0) reduces EF, should floor at 1.3
    let card = makeCard({ ease_factor: 1.4 });
    card = nextSM2State(card, 1);
    expect(card.ease_factor).toBeGreaterThanOrEqual(1.3);
    card = nextSM2State(card, 1);
    expect(card.ease_factor).toBe(1.3);
  });

  it('grade 4 increases ease_factor by 0.1', () => {
    const result = nextSM2State(makeCard({ ease_factor: 2.5, repetitions: 2, interval_days: 6 }), 4);
    expect(result.ease_factor).toBeCloseTo(2.6, 5);
  });

  it('next_review is in the future', () => {
    const before = new Date();
    const result = nextSM2State(makeCard(), 3);
    expect(result.next_review.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
