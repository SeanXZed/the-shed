'use client';

import { useState } from 'react';

export function useBb() {
  const [isBb, setIsBb] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('bb-mode') === 'true';
  });

  function toggle() {
    const next = !isBb;
    setIsBb(next);
    localStorage.setItem('bb-mode', String(next));
  }

  return { isBb, toggle };
}
