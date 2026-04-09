'use client';

import Link from 'next/link';
import { Music } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { t } from '@/lib/translations';
import { cn } from '@/lib/utils';

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  const { lang, toggle } = useLanguage();
  const tr = t(lang);

  return (
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Music className="size-4" />
          </div>
          <span className="grid min-w-0 leading-tight">
            <span className="truncate">The Shed</span>
            <span className="truncate text-xs text-muted-foreground">{tr.appSubtitle}</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center rounded-lg border border-border bg-muted/50 p-0.5">
          {(['en', 'zh'] as const).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => l !== lang && toggle()}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                lang === l
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l === 'en' ? 'EN' : '中文'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">{children}</div>
      </div>
    </div>
  );
}

export function AuthHeroImage() {
  const { lang } = useLanguage();
  const tr = t(lang);

  return (
    <div className="relative hidden bg-muted lg:block">
      <img
        src="/login-image.jpg"
        alt={tr.authImageAlt}
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  );
}
