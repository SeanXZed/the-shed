'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { Lang } from '@/hooks/use-language';
import { JAZZ101_SECTIONS } from '@/lib/jazz101Curriculum';
import { cn } from '@/lib/utils';

const FIRST_LESSON_HREF = '/track/jazz-101/lesson/1';

type Jazz101PathProps = {
  lang: Lang;
  /** Demo: which lesson is active (0-based). Only that node is tappable; others show locked. */
  currentLessonIndex?: number;
  /** Lesson 1 opens the in-app lesson page; later unlocked lessons use this (e.g. Free Practice). */
  startHref: string;
  lockedLabel: string;
  /** Aria hint when the active lesson is not lesson 1 (e.g. Free Practice). */
  startLabel: string;
  /** Aria hint for lesson 1 link. */
  firstLessonAriaLabel: string;
};

export function Jazz101Path({
  lang,
  currentLessonIndex = 0,
  startHref,
  lockedLabel,
  startLabel,
  firstLessonAriaLabel,
}: Jazz101PathProps) {
  let globalIndex = 0;

  return (
    <div className="relative mx-auto w-full max-w-md pb-12">
      {/* Soft path spine (decorative) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-8 bottom-24 -z-10 mx-auto w-3 max-w-[min(100%,18rem)] rounded-full bg-linear-to-b from-primary/25 via-primary/10 to-muted/40"
        aria-hidden
      />

      {JAZZ101_SECTIONS.map((section) => (
        <section key={section.id} className="mb-10 last:mb-0">
          <h2 className="mb-6 text-center text-base font-extrabold uppercase tracking-wide text-foreground sm:text-lg">
            {section.title[lang]}
          </h2>
          <div className="flex flex-col gap-5">
            {section.nodes.map((node) => {
              const index = globalIndex++;
              const isCurrent = index === currentLessonIndex;
              const label = node.title[lang];
              const odd = index % 2 === 1;

              return (
                <div
                  key={node.id}
                  className={cn(
                    'relative flex w-full flex-col items-center gap-2',
                    odd ? 'items-end pr-[8%] sm:pr-[12%]' : 'items-start pl-[8%] sm:pl-[12%]',
                  )}
                >
                  {isCurrent ? (
                    <Link
                      href={index === 0 ? FIRST_LESSON_HREF : startHref}
                      className={cn(
                        'flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-lg font-bold text-primary-foreground',
                        'shadow-md ring-2 ring-primary/30',
                        'transition-all duration-200 ease-out',
                        'hover:scale-[1.12] hover:shadow-xl hover:shadow-primary/35 hover:ring-4 hover:ring-primary/45 hover:brightness-110',
                        'active:scale-105 active:brightness-100',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      )}
                      aria-label={`${label}. ${index === 0 ? firstLessonAriaLabel : startLabel}`}
                    >
                      {index + 1}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex size-16 shrink-0 cursor-not-allowed items-center justify-center rounded-full border-2 border-muted bg-muted text-muted-foreground shadow-sm"
                      aria-label={`${label}. ${lockedLabel}`}
                    >
                      <Lock className="size-6 opacity-70" strokeWidth={2.5} />
                    </button>
                  )}
                  <p
                    className={cn(
                      'max-w-56 text-center text-sm font-medium leading-snug text-foreground',
                      odd ? 'self-end text-right' : 'self-start text-left',
                    )}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
