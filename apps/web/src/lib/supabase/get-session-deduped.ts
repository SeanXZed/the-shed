import { supabase } from './client';

type SessionResult = ReturnType<typeof supabase.auth.getSession> extends Promise<infer R> ? R : never;

let inFlight: Promise<SessionResult> | null = null;

/**
 * Deduplicates overlapping {@link supabase.auth.getSession} calls so only one
 * runs at a time. Helps avoid Web Locks contention ("lock … was released because
 * another request stole it") in Next.js + React Strict Mode.
 */
export function getSessionDeduped(): Promise<SessionResult> {
  if (!inFlight) {
    inFlight = supabase.auth.getSession().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
