'use client';

import { useMemo } from 'react';
import { useAllCards } from './use-cards';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeStreak(reviewDates: Set<string>): number {
  const today = new Date();
  // If today has no review yet, start counting from yesterday
  const startOffset = reviewDates.has(toDateStr(today)) ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (reviewDates.has(toDateStr(d))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useDashboardStats() {
  const { data: cards, isLoading } = useAllCards();

  const stats = useMemo(() => {
    if (!cards) return null;

    const now = new Date();
    const dueCount = cards.filter(c => new Date(c.next_review) <= now).length;
    const masteredCount = cards.filter(c => c.repetitions >= 3).length;

    const reviewDates = new Set(
      cards
        .filter(c => c.last_reviewed_at != null)
        .map(c => toDateStr(new Date(c.last_reviewed_at!))),
    );
    const streak = computeStreak(reviewDates);

    return { dueCount, masteredCount, streak };
  }, [cards]);

  return { stats, isLoading };
}
