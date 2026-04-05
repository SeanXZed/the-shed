# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

The Shed is a jazz improvisation flashcard web app with SM-2 spaced repetition. Musicians practice 17 scale types across 12 roots (204 cards per user) in four modes: Full Scale, Full Chord, Sequence, and 251.

## Monorepo Structure

Turborepo + pnpm workspaces. Three packages:

- `apps/web` — React + Vite frontend
- `apps/api` — Node.js + Express/Fastify backend
- `packages/shared` — zero-dependency theory logic and types consumed by both apps

## Commands

```bash
# From repo root
pnpm install              # install all workspaces
pnpm build                # build all packages (turbo)
pnpm typecheck            # typecheck all packages (turbo)
pnpm test                 # run all tests (turbo)
pnpm lint                 # lint all packages (turbo)

# Target a single workspace
pnpm --filter @the-shed/shared test
pnpm --filter @the-shed/shared test -- --run TheoryMapper  # single test file
pnpm --filter web dev
pnpm --filter api dev
```

## UI: shadcn/ui + Tailwind CSS

The frontend uses **shadcn/ui** for components and **Tailwind CSS** for styling.

- Add shadcn components via `pnpm dlx shadcn@latest add <component>` from `apps/web`
- Components are installed into `apps/web/src/components/ui/` — do not edit these generated files directly; compose them instead
- Use Tailwind utility classes for all layout and custom styling; no separate CSS files unless strictly necessary
- The `cn()` utility (from `lib/utils.ts`) merges Tailwind classes — always use it when conditionally applying classes

## Key Architecture Decisions

### `packages/shared` is the source of truth for all music theory

- `src/constants/scaleDefinitions.ts` — the 17 scales as semitone offset arrays with `degreeLabels` and `chordQuality`. Never derive note names anywhere else.
- `src/theory/TheoryMapper.ts` — `getScaleData(root, scaleId): ScaleData` is the single entry point for all card display logic (concert notes, Bb notes, chord tones, degree labels).
- `src/theory/sm2.ts` — `nextSM2State(card, grade): CardSM2State` is a pure function. The API calls it; nothing else does.
- `src/theory/chordTones.ts` — chord tone intervals and degree labels keyed by `ChordQuality`.

The frontend and API import from `@the-shed/shared` only via the barrel `src/index.ts`. Never import internal paths.

### Note spelling and roots

Canonical chromatic scale: `C Db D Eb E F F# G Ab A Bb B` (flats preferred; `F#` and `C#` are exceptions).

Canonical roots in circle-of-fifths order: `C G D A E B F# Db Ab Eb Bb F`.

These exact strings are stored in `cards.root` and enforced by a DB check constraint. Never store `Gb`, `C#`, `D#`, `G#`, or `A#`.

### Bb transposition is display-only

Concert pitch is always stored. Bb display = concert + 2 semitones applied at render time via `transposeNotes` / `transposeRoot`. No DB column for instrument.

### 251 mode uses no separate DB rows

A "C Major 251" is composed from three existing cards: `(dorian, D)`, `(mixolydian, G)`, `(major, C)`. The `get251(key, tonality)` helper in shared computes which cards to show. Grading fires three `POST /cards/:id/grade` calls in parallel.

### API is write-only; reads go direct to Supabase

The frontend queries Supabase directly (via TanStack Query + anon key + user JWT) for card reads. The API handles: `POST /cards/:id/grade`, `POST /sessions`, `PATCH /sessions/:id`, `POST /cards/ensure`.

API auth: JWT from the client session verified via `supabaseAdmin.auth.getUser(token)`. Service role is not used per-request so RLS remains the safety net.

### SM-2 formula

Grade mapping: 1 (Blackout) → q=0, 2 (Struggled) → q=2, 3 (Solid) → q=4, 4 (Perfect) → q=5.

```
new_ef = old_ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
ef_floor = 1.3

if q < 3: repetitions = 0, interval = 1
else:
  if repetitions == 0: interval = 1
  elif repetitions == 1: interval = 6
  else: interval = round(prev_interval * ef)
  repetitions += 1
```

Cram mode never writes SM-2 state.

## Database

`supabase/schema.sql` is the single source of truth — apply it to a fresh Supabase project via the SQL editor. It includes tables, RLS policies, indexes, check constraints, and the `ensure_user_cards()` trigger that seeds 204 cards on user sign-up.

Card `scale_type` values are snake_case IDs matching `scaleDefinitions.ts` (e.g. `bebop_dominant`, not `Bebop Dominant`).

## Critical Music Theory Note

**Bebop Major ≠ Bebop Dominant.** The two scales are distinct:
- Bebop Major: `[0,2,4,5,7,8,9,11]` → C D E F G G# A B (passing tone at semitone 8)
- Bebop Dominant: `[0,2,4,5,7,9,10,11]` → C D E F G A Bb B

Any confusion between these two in `scaleDefinitions.ts` will cascade into every test and every card display.
