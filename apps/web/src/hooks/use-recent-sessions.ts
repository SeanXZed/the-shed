'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getTotalXp } from '@/lib/xp';

export type RecentSession = {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'abandoned';
  is_cram: boolean;
  items_completed: number;
  correct_count: number;
  xp: number;
  game_title: string;
  game_slug: string;
  /** True when this row can be opened to continue an in-progress deck. */
  canResume: boolean;
};

export function useRecentSessions(limit = 5) {
  return useQuery({
    queryKey: ['recent-sessions', limit],
    staleTime: 30_000,
    queryFn: async (): Promise<RecentSession[]> => {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('id,started_at,ended_at,status,is_cram,items_completed,correct_count,config,games!inner(title,slug)')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const sessionIds = (data ?? []).map((row) => (row as { id: string }).id);
      const xpBySession = new Map<string, number>();

      if (sessionIds.length > 0) {
        const { data: eventRows, error: eventError } = await supabase
          .from('game_events')
          .select('practice_session_id,grade,is_correct')
          .in('practice_session_id', sessionIds);

        if (eventError) throw eventError;

        const grouped = new Map<string, Array<{ grade: number | null; is_correct: boolean | null }>>();
        for (const row of eventRows ?? []) {
          const sessionId = (row as { practice_session_id: string | null }).practice_session_id;
          if (!sessionId) continue;
          const group = grouped.get(sessionId) ?? [];
          group.push({
            grade: (row as { grade: number | null }).grade,
            is_correct: (row as { is_correct: boolean | null }).is_correct,
          });
          grouped.set(sessionId, group);
        }

        for (const [sessionId, events] of grouped.entries()) {
          xpBySession.set(
            sessionId,
            getTotalXp(events.map((event) => ({ ...event }))),
          );
        }
      }

      return (data ?? []).map((row) => {
        const game = (row as unknown as { games?: { title?: string; slug?: string } }).games ?? {};
        const id = (row as { id: string }).id;
        const cfg = (row as { config?: Record<string, unknown> | null }).config ?? null;
        const deckIds = Array.isArray(cfg?.deck_game_item_ids)
          ? (cfg.deck_game_item_ids as string[])
          : [];
        const curRaw = cfg?.current_index;
        const curIdx =
          typeof curRaw === 'number'
            ? curRaw
            : typeof curRaw === 'string'
              ? Number.parseInt(curRaw, 10)
              : 0;
        const status = ((row as { status?: RecentSession['status'] }).status ?? 'completed');
        const canResume =
          status === 'active' &&
          deckIds.length > 0 &&
          Number.isFinite(curIdx) &&
          curIdx < deckIds.length;
        return {
          id,
          started_at: (row as { started_at: string }).started_at,
          ended_at: (row as { ended_at: string | null }).ended_at,
          status,
          is_cram: Boolean((row as { is_cram?: boolean }).is_cram),
          items_completed: Number((row as { items_completed?: number }).items_completed ?? 0),
          correct_count: Number((row as { correct_count?: number }).correct_count ?? 0),
          xp: xpBySession.get(id) ?? 0,
          game_title: game.title ?? 'Game',
          game_slug: game.slug ?? 'unknown',
          canResume,
        };
      });
    },
  });
}

