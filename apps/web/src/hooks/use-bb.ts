'use client';

import { useState, useEffect } from 'react';

export function useBb() {
  const [isBb, setIsBb] = useState(false);

  useEffect(() => {
    setIsBb(localStorage.getItem('bb-mode') === 'true');
  }, []);

  function toggle() {
    const next = !isBb;
    setIsBb(next);
    localStorage.setItem('bb-mode', String(next));
  }

  return { isBb, toggle };
}
