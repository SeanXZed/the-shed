'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Card } from '@the-shed/shared';

export function useDueCards() {
  return useQuery({
    queryKey: ['cards', 'due'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .lte('next_review', new Date().toISOString())
        .order('next_review', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Card[];
    },
  });
}

export function useAllCards() {
  return useQuery({
    queryKey: ['cards', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('root');
      if (error) throw error;
      return (data ?? []) as Card[];
    },
  });
}

export function useInvalidateCards() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['cards'] });
  };
}
