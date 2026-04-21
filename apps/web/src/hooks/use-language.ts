'use client';

import { startTransition, useState, useEffect } from 'react';

export type Lang = 'en' | 'zh';

function readLangFromStorage(): Lang {
  if (typeof window === 'undefined') return 'en';
  const v = localStorage.getItem('lang') as Lang | null;
  return v === 'zh' || v === 'en' ? v : 'en';
}

/**
 * SSR and the first client render must agree: never read localStorage in useState's
 * initializer, or the server (always 'en') and client (stored lang) will mismatch.
 */
export function useLanguage() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    startTransition(() => {
      setLang(readLangFromStorage());
    });
  }, []);

  useEffect(() => {
    const handler = () => setLang(readLangFromStorage());
    window.addEventListener('language-change', handler);
    return () => window.removeEventListener('language-change', handler);
  }, []);

  function toggle() {
    const next: Lang = lang === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', next);
    setLang(next);
    window.dispatchEvent(new Event('language-change'));
  }

  return { lang, toggle };
}
