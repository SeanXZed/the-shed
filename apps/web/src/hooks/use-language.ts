'use client';

import { useState, useEffect } from 'react';

export type Lang = 'en' | 'zh';

export function useLanguage() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem('lang') as Lang) ?? 'en';
  });

  useEffect(() => {
    const handler = () => setLang((localStorage.getItem('lang') as Lang) ?? 'en');
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
