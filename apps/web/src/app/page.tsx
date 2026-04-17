'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionDeduped } from '@/lib/supabase/get-session-deduped';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getSessionDeduped().then(({ data: { session } }) => {
      router.replace(session ? '/dashboard' : '/login');
    });
  }, [router]);

  return null;
}
