'use client';

import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client — safe to use in Client Components.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
