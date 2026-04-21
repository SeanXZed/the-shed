'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type ProfileRow = {
  user_id: string;
  full_name: string | null;
  nickname: string | null;
  is_superadmin: boolean;
  is_tutor: boolean;
};

export function useProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const uid = session.user.id;
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle();
    if (error) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(data as ProfileRow | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    startTransition(() => {
      void refresh();
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      startTransition(() => {
        void refresh();
      });
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return { profile, loading, refresh };
}
