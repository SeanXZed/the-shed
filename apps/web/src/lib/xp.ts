'use client';

export type XpEvent = {
  grade: number | null;
  is_correct?: boolean | null;
  is_cram?: boolean | null;
};

export function getEventXp(event: XpEvent): number {
  return (
    event.grade === 4 ? 10 :
    event.grade === 3 ? 7 :
    event.grade === 2 ? 2 :
    event.grade === 1 ? 0 :
    event.is_correct ? 5 : 0
  );
}

export function getTotalXp(events: XpEvent[]): number {
  return events.reduce((sum, event) => sum + getEventXp(event), 0);
}

