'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getTotalXp } from '@/lib/xp';

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
  const { data: rows, isLoading } = useQuery({
    queryKey: ['dashboard-stats', 'user_game_item_state', 'game_events'],
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: stateRows, error: stateError }, { data: eventRows, error: eventError }] = await Promise.all([
        supabase
          .from('user_game_item_state')
          .select('next_review,repetitions,last_played_at,mastery'),
        supabase
          .from('game_events')
          .select('grade,is_correct'),
      ]);

      if (stateError) throw stateError;
      if (eventError) throw eventError;

      return {
        stateRows: stateRows ?? [],
        eventRows: eventRows ?? [],
      };
    },
  });

  const stats = useMemo(() => {
    if (!rows) return null;

    const { stateRows, eventRows } = rows;

    const now = new Date();
    const dueCount = stateRows.filter(r => r.next_review && new Date(r.next_review) <= now).length;
    const masteredCount = stateRows.filter(r => (r.mastery ?? 0) >= 0.8 || (r.repetitions ?? 0) >= 3).length;

    const reviewDates = new Set(
      stateRows
        .filter(r => r.last_played_at != null)
        .map(r => toDateStr(new Date(r.last_played_at!))),
    );
    const streak = computeStreak(reviewDates);
    const totalXp = getTotalXp(eventRows);

    return { dueCount, masteredCount, streak, totalXp };
  }, [rows]);

  return { stats, isLoading };
}
