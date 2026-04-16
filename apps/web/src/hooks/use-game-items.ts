'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export type GameItemRow = {
  id: string;
  canonical_key: string;
  data: Record<string, unknown>;
};

function extractGameItem(row: unknown): GameItemRow | null {
  const r = row as Partial<GameItemRow> | null;
  if (!r?.id || !r?.canonical_key) return null;
  return { id: r.id, canonical_key: r.canonical_key, data: (r.data as Record<string, unknown>) ?? {} };
}

export function useAllGameItems(gameSlug: string) {
  return useQuery({
    queryKey: ['game-items', 'all', gameSlug],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_items')
        .select('id,canonical_key,data,games!inner(slug)')
        .eq('games.slug', gameSlug)
        .order('canonical_key', { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .map(extractGameItem)
        .filter((x): x is GameItemRow => Boolean(x));
    },
  });
}

export function useDueGameItems(gameSlug: string) {
  return useQuery({
    queryKey: ['game-items', 'due', gameSlug],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('user_game_item_state')
        .select('next_review,game_items!inner(id,canonical_key,data,games!inner(slug))')
        .eq('game_items.games.slug', gameSlug)
        .lte('next_review', nowIso)
        .order('next_review', { ascending: true })
        .limit(800);
      if (error) throw error;
      return (data ?? [])
        .map((row) => {
          const gi = (row as unknown as { game_items?: unknown }).game_items;
          return extractGameItem(gi);
        })
        .filter((x): x is GameItemRow => Boolean(x));
    },
  });
}

export function useInvalidateGameItems() {
  const qc = useQueryClient();
  return (gameSlug?: string) => {
    if (gameSlug) {
      qc.invalidateQueries({ queryKey: ['game-items', 'all', gameSlug] });
      qc.invalidateQueries({ queryKey: ['game-items', 'due', gameSlug] });
      return;
    }
    qc.invalidateQueries({ queryKey: ['game-items'] });
  };
}

