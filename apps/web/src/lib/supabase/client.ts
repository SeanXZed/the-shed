'use client';

import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client — safe to use in Client Components.
// Values come from NEXT_PUBLIC_* (see next.config.ts env map from SUPABASE_* if you omit the prefix).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (typeof window !== 'undefined' && (!url || !key)) {
  console.error(
    '[Supabase] Missing URL or publishable key. Set SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY ' +
      '(or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in apps/web/.env.local. ' +
      'These are public; keep the service secret in SUPABASE_SECRET_KEY only.',
  );
}

export const supabase = createClient(url, key);
