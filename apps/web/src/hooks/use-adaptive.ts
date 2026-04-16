'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export type AdaptiveWeights = Record<string, number>; // canonical_key -> weight

/**
 * Adaptive weights from game-based append-only `game_events`.
 * This makes Scale / Chord / Sequence independent because they map to different games/items.
 *
 * Weight intuition:
 * - more wrong answers => higher weight
 * - recent wrong streak => higher weight
 * - no history => weight ~ 1
 */
export function useAdaptiveWeights(gameSlug: string) {
  return useQuery({
    queryKey: ['adaptive-weights', 'game', gameSlug],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_events')
        .select('is_correct,occurred_at,game_items!inner(canonical_key,games!inner(slug))')
        .eq('game_items.games.slug', gameSlug)
        .order('occurred_at', { ascending: false })
        .limit(600);

      if (error) throw error;

      const stats = new Map<string, { attempts: number; wrong: number; recent: boolean[] }>();

      for (const row of data ?? []) {
        const k = (row as unknown as { game_items?: { canonical_key?: string } }).game_items?.canonical_key ?? null;
        if (!k) continue;
        const s = stats.get(k) ?? { attempts: 0, wrong: 0, recent: [] };
        s.attempts += 1;
        if (!row.is_correct) s.wrong += 1;
        if (s.recent.length < 6) s.recent.push(Boolean(row.is_correct)); // newest -> oldest
        stats.set(k, s);
      }

      const weights: AdaptiveWeights = {};
      for (const [k, s] of stats.entries()) {
        const wrongRate = s.attempts ? (s.wrong / s.attempts) : 0;
        let streakWrong = 0;
        for (const ok of s.recent) {
          if (ok) break;
          streakWrong += 1;
        }

        // Base 1.0, then boost.
        const w = 1 + wrongRate * 3 + streakWrong * 0.6;
        weights[k] = Math.max(0.25, Math.min(6, w));
      }

      return weights;
    },
  });
}

