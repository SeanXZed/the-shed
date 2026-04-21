'use client';

import { supabase } from '@/lib/supabase/client';

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');
  return fetch(input, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
}
