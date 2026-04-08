'use client';

import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client — safe to use in Client Components.
// Empty-string fallbacks prevent build-time throws; the app won't
// work at runtime without the env vars set.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
);
