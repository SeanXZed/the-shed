# Execution Plan: The Shed

_Last updated 2026-04-07._

---

## Architecture decisions (locked)

| Topic | Decision |
|-------|----------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js (App Router) + shadcn/ui + Tailwind CSS |
| Backend | Next.js API routes (no separate `apps/api`) |
| Auth | Supabase email + password only |
| DB reads | Supabase client direct from browser (TanStack Query) |
| DB writes | Via Next.js API routes with JWT verification |
| Note spelling | Flats canonical (Db Eb Ab Bb), except F# retained. Chromatic: C Db D Eb E F F# G Ab A Bb B |
| Roots order | Circle of fifths ascending: C G D A E B F# Db Ab Eb Bb F |
| Cram mode | Does NOT update SM-2 state |
| 251 mode | No separate DB rows — computed from 3 existing (scale_type, root) cards |
| Bb transposition | Display-only, persisted to localStorage, no DB column |
| Card seeding | SQL trigger `ensure_user_cards()` on auth.users INSERT + idempotent `POST /api/cards/ensure` called on first practice load |

---

## Build status

| Area | Status |
|------|--------|
| Monorepo scaffold (Turborepo + pnpm) | ✅ Done |
| `packages/shared` — theory engine, SM-2, 251, chord tones, transpose | ✅ Done |
| Supabase auth (email + password) | ✅ Done |
| Login / Signup UI + route guard | ✅ Done |
| Dashboard shell (static, stats show "—") | ✅ Done |
| Practice mode selector (`/practice`) | ✅ Done |
| `POST /api/cards/ensure` — seeds 204 cards | ✅ Done |
| `POST /api/cards/[id]/grade` — SM-2 write | ✅ Done |
| TanStack Query provider + card hooks | ✅ Done |
| Bb/Concert toggle (localStorage) | ✅ Done |
| `/practice/[mode]` — all 4 flashcard modes | ✅ Done |
| `supabase/schema.sql` | ✅ Done |
| Dashboard live stats (due today, streak, mastered) | ✅ Done |
| `/scales` browse page (currently 404) | ✅ Done |
| Practice session tracking (streak history) | ✅ Done |
| Bb/Concert toggle (practice, scales, chords) | ✅ Done |
| Polish (cram root filter, mobile, loading states) | ⬜ Phase 5 |

---

## What was built in each phase

### Phase 1 — Flashcard core ✅

**`/practice/[mode]/page.tsx`** — single dynamic route handles all 4 modes:

- **Full Scale** — front: root + scale name; back: all notes with degree labels
- **Full Chord** — front: chord symbol; back: chord tones with degree labels
- **Sequence** — front: scale + 5 random degree labels; back: corresponding note names
- **251** — front: key + tonality + 3 chord symbols; back: all 3 chords with tones + degrees; grading fires 3 parallel `POST /api/cards/[id]/grade` calls

Common behaviour across all modes:
- Calls `POST /api/cards/ensure` once on mount
- Due cards loaded via `useDueCards()`; falls back to all 204 (cram) if none due
- `Space` = reveal, `1–4` = grade
- Bb/Concert toggle in header (display-only)
- After last card: done screen with links back to mode selector and dashboard

**Key files:**
- `src/app/api/cards/[id]/grade/route.ts` — validates grade (Zod), fetches card, calls `nextSM2State`, writes SM-2 fields back
- `src/hooks/use-cards.ts` — `useDueCards`, `useAllCards`, `useInvalidateCards`
- `src/hooks/use-bb.ts` — `useBb()` — Concert/Bb toggle with localStorage
- `src/components/providers.tsx` — `QueryClientProvider` wrapper

---

## Phase 2 — Dashboard live stats

**File:** `apps/web/src/app/dashboard/page.tsx` (update existing)

Add a `useDashboardStats()` hook that queries the cards table once:
- **Due Today:** `count(cards where next_review <= now())`
- **Mastered:** `count(cards where repetitions >= 3)` — document this threshold
- **Streak:** consecutive calendar days with `last_reviewed_at` — compute client-side from the cards array

Replace the "—" placeholders in the 3 stat cards with real values.

---

## Phase 3 — Scales browse page

**File:** `apps/web/src/app/scales/page.tsx` (new — currently 404)

- Table or grid: 17 scales × 12 roots (204 rows)
- Columns: scale name, root, next review date, interval, repetitions
- Filter/search by scale name or root
- Read-only — no grading from this page
- Uses `getScaleData` from shared for note display on row expand (optional detail panel)

---

## Phase 4 — Practice session tracking

Prerequisite for accurate streak on dashboard.

**New API routes:**
- `POST /api/sessions` — body `{ practice_mode, started_at }` → inserts `practice_sessions` row, returns `{ id }`
- `PATCH /api/sessions/[id]` — body `{ ended_at, cards_reviewed }` → closes session

**Frontend changes:**
- On "Start practice" (entering `/practice/[mode]`): call `POST /api/sessions`, store session ID
- On done screen render: call `PATCH /api/sessions/[id]`
- Dashboard streak reads `practice_sessions` grouped by `date(started_at)`

---

## Phase 5 — Polish

- **Cram root filter:** Add a root selector to the done screen / practice header so users can cram a single root (17 cards)
- **Mobile:** Audit practice view at 375px — confirm no overflow, tap targets ≥44px
- **Loading states:** Current skeletons are basic; improve if jank is visible
- **Keyboard:** Consider `←` to go back one card (currently no backtracking)

---

## Success criteria

- [ ] Sign up → 204 cards seeded → practice all 4 modes end-to-end
- [ ] Grading a card updates `next_review` in Supabase
- [ ] SM-2 intervals grow correctly across multiple sessions
- [x] Bb/Concert toggle changes all displayed notes without any DB write
- [ ] 251 grading fires 3 parallel API calls
- [ ] Dashboard shows real due count, mastered count, and streak
- [ ] Practice view usable at 375px with no horizontal scroll
- [ ] Keyboard: Space reveals, 1–4 grades
