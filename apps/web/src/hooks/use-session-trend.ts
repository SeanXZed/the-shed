'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getEventXp } from '@/lib/xp';

type SessionRow = {
  started_at: string;
  items_completed: number | null;
  correct_count: number | null;
};

type EventRow = {
  occurred_at: string;
  grade: number | null;
  is_correct: boolean | null;
  meta: Record<string, unknown> | null;
};

type SessionTrendDay = {
  date: string;
  label: string;
  sessions: number;
  itemsCompleted: number;
  correctCount: number;
  xp: number;
};

/** Calendar date in the user's local timezone (YYYY-MM-DD). */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useSessionTrend(days = 7) {
  const { data, isLoading } = useQuery({
    queryKey: ['session-trend', days],
    staleTime: 30_000,
    queryFn: async (): Promise<{ sessions: SessionRow[]; events: EventRow[] }> => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      const [{ data: sessions, error: sessionsError }, { data: events, error: eventsError }] = await Promise.all([
        supabase
          .from('practice_sessions')
          .select('started_at,items_completed,correct_count')
          .gte('started_at', start.toISOString())
          .order('started_at', { ascending: true }),
        supabase
          .from('game_events')
          .select('occurred_at,grade,is_correct,meta')
          .gte('occurred_at', start.toISOString())
          .order('occurred_at', { ascending: true }),
      ]);

      if (sessionsError) throw sessionsError;
      if (eventsError) throw eventsError;

      return {
        sessions: (sessions ?? []) as SessionRow[],
        events: (events ?? []) as EventRow[],
      };
    },
  });

  const trend = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayMap = new Map<string, SessionTrendDay>();
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = toLocalDateKey(date);
      dayMap.set(key, {
        date: key,
        label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
        sessions: 0,
        itemsCompleted: 0,
        correctCount: 0,
        xp: 0,
      });
    }

    for (const row of data?.sessions ?? []) {
      const key = toLocalDateKey(new Date(row.started_at));
      const day = dayMap.get(key);
      if (!day) continue;
      day.sessions += 1;
      day.itemsCompleted += row.items_completed ?? 0;
      day.correctCount += row.correct_count ?? 0;
    }

    for (const row of data?.events ?? []) {
      const key = toLocalDateKey(new Date(row.occurred_at));
      const day = dayMap.get(key);
      if (!day) continue;
      day.xp += getEventXp({
        grade: row.grade,
        is_correct: row.is_correct,
        is_cram: row.meta?.is_cram === true,
      });
    }

    const daily = Array.from(dayMap.values());
    const totalSessions = daily.reduce((sum, day) => sum + day.sessions, 0);
    const totalItemsCompleted = daily.reduce((sum, day) => sum + day.itemsCompleted, 0);
    const totalCorrect = daily.reduce((sum, day) => sum + day.correctCount, 0);
    const totalXp = daily.reduce((sum, day) => sum + day.xp, 0);
    const averageAccuracy = totalItemsCompleted > 0
      ? Math.round((totalCorrect / totalItemsCompleted) * 100)
      : 0;
    const maxSessions = Math.max(...daily.map((day) => day.sessions), 0);

    return {
      daily,
      totalSessions,
      totalItemsCompleted,
      totalXp,
      averageAccuracy,
      maxSessions,
    };
  }, [data, days]);

  return { trend, isLoading };
}

