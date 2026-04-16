'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type PitchMode = 'concert' | 'bb' | 'eb';

const STORAGE_KEY = 'pitch-mode';

export function usePitch() {
  const [pitch, setPitch] = useState<PitchMode>(() => {
    if (typeof window === 'undefined') return 'concert';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'bb' || stored === 'eb' || stored === 'concert') return stored;
    // Back-compat for older localStorage toggle.
    if (localStorage.getItem('bb-mode') === 'true') return 'bb';
    return 'concert';
  });

  // Best-effort: load DB default once. LocalStorage stays as fallback.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('user_settings')
        .select('pitch_mode')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data?.pitch_mode) return;
      const next = data.pitch_mode as PitchMode;
      if (next === 'concert' || next === 'bb' || next === 'eb') {
        setPitch(next);
        localStorage.setItem(STORAGE_KEY, next);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function persist(next: PitchMode) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, pitch_mode: next, updated_at: new Date().toISOString() });
    } catch {
      // ignore; localStorage is the fallback
    }
  }

  function set(next: PitchMode, opts?: { persist?: boolean }) {
    setPitch(next);
    localStorage.setItem(STORAGE_KEY, next);
    if (opts?.persist) void persist(next);
  }

  function cycle() {
    const next: PitchMode = pitch === 'concert' ? 'bb' : pitch === 'bb' ? 'eb' : 'concert';
    set(next);
  }

  return { pitch, setPitch: set, cycle };
}
