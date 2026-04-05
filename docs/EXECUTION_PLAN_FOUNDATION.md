# Execution Plan: The Foundation (Flashcards)

This plan covers the initial build of The Shed’s core logic: generating, displaying, and tracking memorisation of parallel scales and chords via a flashcard system with SM-2 spaced repetition.

---

## 0. Prerequisites & Discovery

### 0.1 Scale table (source of truth)

The **canonical list of 17 parallel scales** is defined below (13 modal/alteration scales + 4 bebop scales). This table is the single source of truth for `scaleDefinitions` in `packages/shared`; TheoryMapper and tests both consume it.

| Scale Name | Degrees | Notes (root C) | Chords |
|------------|---------|----------------|--------|
| Major (Ionian) | 1 2 3 4 5 6 7 | C D E F G A B | C∆7: C E G B |
| Natural Minor (Aeolian) | 1 2 b3 4 5 b6 b7 | C D Eb F G Ab Bb | C-7: C Eb G Bb |
| Melodic Minor | 1 2 b3 4 5 6 7 | C D Eb F G A B | C-7(∆): C Eb G B |
| Harmonic Minor | 1 2 b3 4 5 b6 7 | C D Eb F G Ab B | C-7(∆): C Eb G B |
| Dorian | 1 2 b3 4 5 6 b7 | C D Eb F G A Bb | C-7: C Eb G Bb |
| Phrygian | 1 b2 b3 4 5 b6 b7 | C Db Eb F G Ab Bb | C-7: C Eb G Bb |
| Lydian | 1 2 3 #4 5 6 7 | C D E F# G A B | C∆7: C E G B |
| Mixolydian | 1 2 3 4 5 6 b7 | C D E F G A Bb | C7: C E G Bb |
| Locrian | 1 b2 b3 4 b5 b6 b7 | C Db Eb F Gb Ab Bb | C-7b5: C Eb Gb Bb |
| Minor Blues | 1 b3 4 #4 5 b7 | C Eb F F# G Bb | C-7: C Eb G Bb |
| Mixolydian b9 b13 | 1 b2 3 4 5 b6 b7 | C Db E F G Ab Bb | C7: C E G Bb |
| Lydian Dominant | 1 2 3 #4 5 6 b7 | C D E F# G A Bb | C7: C E G Bb |
| Altered Scale | 1 b9 #9 3 b5 #5 b7 | C Db D# E Gb G# Bb | C7: C E G Bb |
| Bebop Major | 1 2 3 4 5 6 b7 7 | C D E F G A Bb B | C∆7: C E G B |
| Bebop Minor | 1 2 b3 3 4 5 6 b7 | C D Eb E F G A Bb | C-7: C Eb G Bb |
| Bebop Dominant | 1 2 3 4 5 6 b7 7 | C D E F G A Bb B | C7: C E G Bb |
| Bebop Diminished | 1 b2 b3 3 b5 5 6 b7 | C Db Eb E Gb G A Bb | C7: C E G Bb |

- **Deliverable:** Encode this table in `packages/shared` (e.g. `scaleDefinitions.ts`): scale id, name, degree list, chord suffix (or full chord template). Notes column defines expected concert output for root C; use for unit tests.

### 0.2 Roots and instrument-agnostic design

- **All roots:** The user can select **any of the 12 roots** (C, C#/Db, D, Eb, E, F, F#/Gb, G, Ab, A, Bb, B). Cards exist for every (scale_type, root) pair: **17 × 12 = 204 cards per user**.
- **Root order:** Roots are presented in **circle-of-fifths order** (e.g. C → G → D → A → E → B → F#/Gb → Db → Ab → Eb → Bb → F, or the reverse). Use one canonical ordering in the app and in seed data so practice and navigation feel consistent.
- **Instrument-agnostic:** Without audio, the app is for any instrument. **Transposition (e.g. Bb, Concert)** is **display only**—so horn players see the same scale in their key. No audio playback in this phase; the “instrument” choice only affects how note names and chord roots are shown (Concert vs Bb, and later Eb if added).

### 0.3 Scale coverage: major, minor, and 251

The 17 scales above are chosen so users can practise **all chord types** found in **major** and **minor** tonalities, including **II–V–I (major)** and **ii–V–i (minor)**:

- **Major key chords:** I (Major/Ionian), ii (Dorian), iii (Phrygian), IV (Lydian), V (Mixolydian), vi (Natural Minor), vii° (Locrian). Plus common alterations: V7 → Lydian Dominant, Mixolydian b9 b13, or Altered when appropriate.
- **Minor key chords:** i (Natural Minor, Dorian, or Melodic/Harmonic Minor), ii (Locrian or -7b5), V (Harmonic Minor, Melodic Minor, or Altered for V7alt), I (Melodic Minor). Minor Blues for blues-inflected minor.
- **251 major:** ii (Dorian) → V (Mixolydian, Lydian Dominant, or Altered) → I (Major).
- **251 minor:** ii (Locrian / -7b5) → V (Harmonic Minor, Melodic Minor, or Altered) → i (Natural Minor, Dorian, Melodic Minor).
- **Bebop:** Bebop Major (I/∆7), Bebop Minor (i/-7), Bebop Dominant (V7), and Bebop Diminished (dominant or º7 contexts) for linear vocabulary and passing-tone fluency.

The app does not need to enforce "which scale over which chord" in this phase—it simply offers all 17 scale types in all 12 keys. Users (or a future "251 mode") can focus on the subset relevant to a given progression.

### 0.4 Monorepo layout

- **Current state:** No `apps/` or `packages/` directories.
- **Action:** Scaffold a TypeScript monorepo (e.g. npm/pnpm workspaces or Turborepo) with:
  - `apps/web` (React)
  - `apps/api` (Node + Express or Fastify)
  - `packages/shared` (types + theory logic, no runtime deps on React/Node)
- **Deliverable:** Root `package.json` with workspaces, build/typecheck scripts, and each app/package buildable and depending on `@the-shed/shared` where needed.

---

## 1. Core engine: TheoryMapper (`packages/shared`)

### 1.1 Responsibilities

- **Input:** Root (e.g. `C`) and Scale Type (e.g. `Altered`).
- **Logic:** Map scale intervals (from the scale table) onto a chromatic scale to get note names in concert pitch, then transpose to Bb (and optionally other keys later).
- **Output:** Object containing:
  - `concertNotes: string[]`
  - `trumpetNotes: string[]` (Bb; for display when user selects Bb instrument)
  - `targetChord: string` (e.g. `C7` / `D7` for Bb display)
  - Chord tones for the target chord (for the "back" of the card)

### 1.2 Design decisions to lock in

| Topic | Decision |
|--------|----------|
| **Note representation** | Use sharp names only, or support both sharps and flats (e.g. Db vs C#)? Recommend one canonical form (e.g. prefer flats for jazz readability) and derive the other if needed. |
| **Chromatic reference** | Define a fixed chromatic scale (e.g. C–B) and use semitone offsets from root. |
| **Interval model** | Represent intervals as semitone offsets from root (e.g. `b2` = 1, `#2` = 3). Map scale degrees to these offsets; use them to index into a chromatic ring. |
| **Chord symbol generation** | Target chord comes from scale definition (e.g. “7alt” for Altered). Root for chord = same as scale root for concert; root + 2 semitones for Bb. |
| **Transposition** | Bb = concert + 2 semitones. Encapsulate in a small `transpose(notes, semitones)` (or per-instrument) so other keys can be added later. |

### 1.3 Suggested module layout (`packages/shared`)

- `src/constants/chromatic.ts` – ordered list of note names and semitone math.
- `src/constants/scaleDefinitions.ts` – the 17 scales: id, name, intervals (as semitone offsets or degree names), chord suffix.
- `src/theory/TheoryMapper.ts` – main function `getScaleData(root, scaleType)` → concert notes, trumpet notes, target chord.
- `src/theory/transpose.ts` – pure transposition helper.
- `src/types/index.ts` – e.g. `ScaleType`, `ScaleData`, `Card`, etc.
- Public API: `packages/shared` exports only from `src/index.ts` (or `src/public.ts`) so apps don’t depend on internal paths.

### 1.4 Dependencies

- **Zero** runtime dependencies for theory and mapping. Only TypeScript and (if you like) a test runner in dev.

---

## 2. Truth layer: unit tests for TheoryMapper

- **Goal:** Any change to intervals or chord rules is validated against the provided scale table; the app never “lies” about note names or chords.
- **Scope:**
  - For each of the 17 scale types, at least one test: given root C, assert exact `concertNotes` and `targetChord` against the scale table (e.g. C Altered → notes per table, chord `C7`).
  - One explicit test: “C Altered” → concert notes per table (e.g. `[C, Db, D#, E, Gb, G#, Bb]`), chord `C7`.
  - Bb transposition: for the same scale, assert `trumpetNotes` and chord (e.g. D7 for C Altered when displayed in Bb).
  - Additional tests for a few other roots (e.g. G, F) to ensure mapping works for all 12 roots.
- **Placement:** `packages/shared/src/theory/TheoryMapper.test.ts` (or under `__tests__`), run via Vitest or Jest.
- **Process:** Implement TheoryMapper to satisfy these tests; treat the tests as the contract for “correct” behaviour.

---

## 3. Flashcard data model & SM-2

### 3.1 Card identity

- A “card” = one scale type (e.g. Altered) at one root (e.g. C). For “17 parallel scales starting on C,” that’s **17 scale types × 12 roots = 204 cards per user.** Users can select any root; the UI presents roots in circle-of-fifths order.
- Store `scale_type` (string or enum) and `root` (string, e.g. `"C"`, `"Gb"`). Unique on `(user_id, scale_type, root)`.

### 3.2 SM-2 metadata (per card per user)

- `ease_factor: number` (default 2.5)
- `interval_days: number` (next interval in days)
- `next_review: timestamptz`
- Optional but useful: `repetitions` (count of successful reviews in a row), `last_reviewed_at`, so you can implement standard SM-2 formulas.

### 3.3 SM-2 behaviour (lightweight)

- **User grades:** 1 = Blackout, 2 = Struggled, 3 = Solid, 4 = Perfect.
- **Rules:**
  - Grade 1 (Blackout): reset interval (e.g. 1 day) and possibly ease factor.
  - Grades 2–4: compute next interval using SM-2 (or simplified) and update `next_review = now + interval_days`, update `ease_factor` and `interval_days` per algorithm.
- **Implementation:** Pure function in `packages/shared`: `nextSM2State(card, grade) → { next_review, interval_days, ease_factor, ... }`. API/Edge Function and tests call this; no business logic in DB.

---

## 4. Supabase schema & access

Supabase is used for **user authentication** (email + password), **flashcard state** (cards, SM-2), and **user usage tracking**. All user data is scoped by `user_id` from Supabase Auth.

### 4.0 Authentication

- **Provider:** Supabase Auth. **Email and password only** (no social or magic-link required for this phase).
- **Flows:** Sign up (email + password), sign in, sign out. Password reset can be added via Supabase’s built-in flow.
- **Session:** The client uses the Supabase JS client; `auth.getSession()` / `auth.onAuthStateChange()` provide the current user. All API and Supabase calls use the session so `auth.uid()` is the `user_id` for RLS and for linking cards and usage.
- **RLS:** Every table that stores user-specific data (e.g. `cards`, usage) has RLS policies that restrict read/write to `auth.uid() = user_id`. Unauthenticated users cannot read or write other users’ data.

### 4.1 Tables

- **`cards`** (or `user_scale_cards`):
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to auth.users or your `profiles` table)
  - `scale_type` (text, e.g. `"altered"`)
  - `root` (text, e.g. `"C"`, `"Gb"`) — one of 12 roots
  - `ease_factor`, `interval_days`, `next_review`, `repetitions`, `last_reviewed_at` as needed for SM-2
  - Unique on `(user_id, scale_type, root)` so one row per card per user.

- **Auth:** `user_id` is the Supabase Auth user id (`auth.uid()`). RLS policies ensure users only read/write their own rows.

### 4.2 Seed data

- When a user is created (or on first login), ensure **204 rows** exist for that user (every combination of 17 scale types × 12 roots). Roots stored in the same canonical order (e.g. circle of fifths). Use an API "ensure my cards exist" endpoint or a Supabase Edge Function called from the client on first load.

### 4.3 User usage tracking

- **Purpose:** Track how users use the app (sessions, modes, cards reviewed) for progress and optional analytics.
- **Storage:** Supabase tables with `user_id` and RLS so each user only sees their own usage.
- **Suggested schema (minimal):**
  - **`practice_sessions`** (or similar): `id`, `user_id`, `started_at`, `ended_at`, `practice_mode` (e.g. full_scale, full_chord, sequence, 251), optional `key`/`root`. One row per “session” (e.g. from “Start practice” until “End” or after N minutes of inactivity).
  - **`practice_events`** (optional, for finer detail): `id`, `user_id`, `session_id` (FK), `occurred_at`, `event_type` (e.g. card_reviewed, card_graded), `mode`, `key`, `scale_type` or `chord_name`, `grade` if applicable. Allows “cards reviewed today”, “time in shed”, etc.
- **Implementation:** Frontend or API writes a row when a session starts and when it ends; optionally log an event per card reviewed/graded. No PII beyond `user_id`; all linkage to identity stays in Supabase Auth.
- **UI:** Usage can drive a simple “practice log” or stats view (e.g. cards due, sessions this week). Exact metrics are an implementation detail; the requirement is that usage is **tracked in Supabase** and keyed by authenticated user.

---

## 5. Backend: API or Edge Function

### 5.1 Role

- **Fetch due cards:** Can be done from the client with Supabase client: `next_review <= now()` (and `user_id = auth.uid()`). No API strictly required for read.
- **Update after grade:** Compute SM-2 in one place (API or Edge Function), then update `cards` in Supabase. Keeps logic out of the client and gives a single place to log/audit.

### 5.2 Suggested endpoints

- `GET /cards/due` – optional; or use Supabase from frontend with TanStack Query.
- `POST /cards/:id/grade` – body `{ grade: 1|2|3|4 }`. Server calls `nextSM2State`, then updates row in Supabase (via service role or authenticated user’s row).

### 5.3 Tech

- **apps/api:** Node + Express or Fastify; TypeScript; imports `@the-shed/shared` for SM-2 and types. Environment: Supabase URL + service key (or anon key if RLS is enough for updates).

---

## 6. Practice modes (flashcard types)

The app supports **four practice modes**. Each mode has a **prompt** (key + context), **user input** (what the user enters), and **answer review** (correct answer shown with numeric where applicable). Bb/Concert toggle applies to all modes for display of key and note names.

### 6.0.1 Full scale

- **Prompt:** Key (root) + scale name (e.g. “F# Altered”, “C Mixolydian b9 b13”).
- **User action:** User **enters the scale notes** (e.g. type or select note names in order). Order can be ascending from root; allow same spelling as in scale table (e.g. Db vs C# per canonical form).
- **Answer review:** Show **correct note names** and **numeric (scale degrees)** together, e.g. `1 C, b2 Db, 3 E, …` or a two-line display (notes / degrees). User can self-grade (Blackout / Struggled / Solid / Perfect) for SM-2.

### 6.0.2 Full chord

- **Prompt:** Key (root) + chord name (e.g. “C7”, “F-7b5”, “Bb∆7”). Chord set can come from scale table (target chord per scale) and/or a separate chord list (e.g. diatonic chords in major/minor, 251 chords).
- **User action:** User **enters the chord tones** (note names) for that chord in that key.
- **Answer review:** Show **correct note names** and **numeric (chord tones / scale degrees)**, e.g. `1 C, 3 E, 5 G, b7 Bb` or “C E G Bb” with degrees below. Self-grade for SM-2.

### 6.0.3 Sequence

- **Prompt:** Key + scale name + **random numeric sequence** of scale degrees (e.g. `1, 5, 3, 7, b2` for a 5-note sequence). Length (e.g. 4–8 notes) can be fixed or user-chosen. Sequence is generated once per card (or per “next”).
- **User action:** User **enters the note names** that correspond to those degrees in the given key and scale.
- **Answer review:** Show the **note names** for the sequence and repeat the **numeric** (degrees) so user can verify, e.g. “C, G, E, Bb, Db” with “1, 5, 3, b7, b2” below. Self-grade for SM-2.

### 6.0.4 251

- **Prompt:** A **251 progression** in a stated key, e.g. “C Major 251” or “A minor 251”. Display the chord symbols (e.g. D-7, G7, C∆7) or only the key and “251” and let the user fill chord names as well—design choice.
- **User action:** User **enters chord names** (e.g. D-7, G7, C∆7) and **their notes** (chord tones for each chord). Can be one text area per chord or a structured form.
- **Answer review:** Show **correct chord names**, **note names** for each chord, and **numeric** (scale degrees or chord tones) for each, e.g. “D-7: D F A C (1 b3 5 b7)” etc. Self-grade for SM-2 (optionally per chord or for the whole 251).

### 6.0.5 Mode selector and data model

- **UI:** User chooses practice mode (Full scale / Full chord / Sequence / 251) before or during a session. Each mode uses the same key/root selector and Bb/Concert toggle.
- **Data / SM-2:** Cards can be scoped by (mode, key, scale_or_chord_id) or similar so SM-2 tracks each combination separately (e.g. “Full scale C Altered” vs “Sequence C Altered”). 251 cards can be key-based (e.g. “C Major 251”, “A minor 251”). Exact schema (one table vs per-mode) is an implementation detail; the four modes are the product behaviour.

---

## 7. Frontend: React app (Practice view + Back)

### 7.1 Data flow

- **Auth gate:** If the user is not signed in (no Supabase session), show sign-in / sign-up (email + password). After sign-in, load the main practice UI. Sign-out option in app header or settings.
- **Due cards:** TanStack Query key e.g. `['cards', 'due']`, query Supabase for `next_review <= now()` (and current user). If empty, show “Cram mode” (all 204 cards, or filter by selected root so e.g. "Cram in C" = 17 scales).
- **Cram mode:** User can optionally restrict by root (e.g. “all 17 scales in C” or “all 204”). Cycle through the chosen set; optionally skip updating `next_review` in Cram.
- **After grading:** Invalidate `['cards', 'due']`, call `POST /cards/:id/grade` (or Supabase RPC), then either show next due card or “no cards due” + Cram.
- **Practice mode:** User selects one of the four modes (Full scale, Full chord, Sequence, 251); cards and prompts are generated or filtered per mode (§6.0).

### 7.2 UI structure

- **Practice mode selector:** User chooses one of the four modes (Full scale, Full chord, Sequence, 251). Layout and input fields follow the chosen mode (§6.0.1–6.0.4).
- **Root selector:** User can select any of the **12 roots**, presented in **circle-of-fifths order** (e.g. C, G, D, A, E, B, F#/Gb, Db, Ab, Eb, Bb, F). Selection drives which cards are shown in Cram and (optionally) filters due cards by root. When reviewing a card, the card's root is fixed; the selector can still be used to jump to “practise in F” etc. for Cram.
- **Practice view (varies by mode):**
  - **Full scale:** Prompt = key + scale name. User enters scale notes; then reveal answer showing note names + numeric (degrees).
  - **Full chord:** Prompt = key + chord name. User enters chord tones; then reveal answer showing note names + numeric.
  - **Sequence:** Prompt = key + scale name + random numeric sequence. User enters note names; then reveal answer showing notes + numeric.
  - **251:** Prompt = key + “251” (e.g. C Major 251). User enters chord names and their notes; then reveal answer showing chord names, notes, and numeric for each.
  - **Bb / Concert** toggle: display-only transposition (concert vs Bb note names and chord root). Instrument-agnostic: no audio.
  - Large “Reveal answer” / “Flip” target (click/tap or spacebar) after user has entered (or skipped) their answer.

- **Answer review (all modes):** Show correct answer with **numeric alongside notes** (scale degrees or chord tones). Four self-grade buttons: Blackout (1), Struggled (2), Solid (3), Perfect (4).

- **Hands-free:** Large tap targets, keyboard (e.g. spacebar = flip, 1–4 = grade). No tiny buttons.

### 7.3 Mobile-responsive design

The web app must be **adaptable to mobile screens** so musicians can practise on a phone or tablet (e.g. on a stand next to the music stand).

- **Viewport & layout:** Use a responsive viewport meta tag; layout and typography scale with screen size (e.g. CSS fluid typography, flexbox/grid, or container queries). No horizontal scroll on small viewports.
- **Touch targets:** Buttons (flip, Bb/Concert toggle, grade 1–4) must meet touch-friendly minimum size (e.g. ~44px height) and adequate spacing so taps are accurate with one hand.
- **Readability:** Scale names, note names, and chord symbols remain legible on narrow screens; consider larger base font size on mobile or a compact-but-clear “answer” layout (e.g. stacked or wrapped note lists).
- **Interaction parity:** All actions available on desktop (flip, grade, toggle) work on touch: tap to flip, tap to grade. Keyboard shortcuts remain for desktop; no mobile-only gestures required for core flow.
- **Testing:** Verify the Practice view (front and back) and Cram mode on at least one small viewport (e.g. 375px width) and one tablet breakpoint; confirm no overflow or clipped content.

### 7.4 Where TheoryMapper is used

- When a card is “shown” (front or back), the app has `scaleType` and `root`. Call `getScaleData(root, scaleType)`. If toggle is Bb, display trumpet notes and trumpet chord; otherwise concert. So: one shared data object per card view, two display modes.

### 7.5 Chord tones

- Brief says “The Chord: Displays the associated chord symbol and its notes (e.g. C, E, G, Bb)”. Either:
  - Extend TheoryMapper (or a helper in shared) to return “chord tones” for the target chord (e.g. 1,3,5,b7 for 7alt), or
  - Add a small chord-to-notes map in shared. Prefer one place (shared) so chord spelling is also testable.

---

## 8. Implementation order (recommended)

1. **Scaffold monorepo** – workspaces, `apps/web`, `apps/api`, `packages/shared`, and shared build.
2. **Define scale table** – Encode the 17 scales from §0.1 in `packages/shared` (names, degrees, chord template). Freeze as source of truth.
3. **Define roots constant** – 12 roots in circle-of-fifths order in shared (e.g. `ROOTS_CIRCLE_OF_FIFTHS`).
4. **Implement TheoryMapper** – chromatic + intervals → concert notes; transpose → Bb; target chord string and chord tones. Works for any root.
5. **Write TheoryMapper tests** – each scale type at root C, plus Bb transposition, plus a couple of other roots (G, F).
6. **Implement SM-2 helper** – `nextSM2State(card, grade)` in shared; unit test with known inputs.
7. **Supabase** – enable Auth (email + password only); create `cards` table, **practice_sessions** (and optionally **practice_events**) for usage tracking, RLS on all tables; seed/ensure logic for **204 cards per user** (17 × 12).
8. **API** – `POST /cards/:id/grade` using SM-2 and Supabase client.
9. **Frontend** – practice mode selector (Full scale, Full chord, Sequence, 251), root selector (circle of fifths), due cards query, mode-specific prompts and **user input** (notes/chord names), reveal answer with **numeric + notes**, four grade buttons, Cram mode (all 204 or by root), and **mobile-responsive layout**.
10. **Integration** – sign up / sign in with email and password, run through cards in multiple roots in spaced mode; confirm `next_review` updates in Supabase and **usage** (sessions and/or events) is recorded per user.

---

## 9. Initial success criteria (checklist)

- [ ] **Authentication:** Users can sign up and sign in with **email and password** via Supabase Auth. Session is used for all Supabase access; RLS restricts data to the signed-in user.
- [ ] **Usage tracking:** Practice sessions (and optionally per-card events) are stored in Supabase keyed by `user_id`; users only see their own usage.
- [ ] You can cycle through all **17 scale types** in **all 12 roots** (204 cards). Root selector uses **circle-of-fifths order**.
- [ ] The **Bb / Concert** toggle correctly changes the displayed note names and chord for every scale (display-only; no audio).
- [ ] **Next review** dates update correctly in the Supabase dashboard after grading a card in a session.
- [ ] TheoryMapper is fully covered by unit tests keyed to your scale table so the “truth” of note and chord spelling is guaranteed.
- [ ] The app is **adaptable to mobile screens**: usable on a narrow viewport (e.g. 375px), with touch-friendly controls and no horizontal scroll or clipped content.
- [ ] **Four practice modes** work: (1) Full scale – key + scale name, user enters notes, answer shows notes + numeric; (2) Full chord – key + chord name, user enters notes, answer shows notes + numeric; (3) Sequence – key + scale + random numeric sequence, user enters notes, answer shows notes + numeric; (4) 251 – key + 251, user enters chord names and notes, answer shows chord names, notes, and numeric.

---

## 10. Out of scope for this phase

- Other transposition keys (e.g. Eb) – only Bb and Concert in UI for now.
- Audio playback, section looper, or session recorder.
- Practice log (time-in-shed tracking) – later feature.
- A dedicated "251 mode" filter (scale set already supports 251; filtering by progression can be added later).

---

## 11. Open questions

1. **Note spelling:** Prefer flats (Db, Eb, Gb, Ab, Bb) or allow sharps (C#, D#, F#, G#, A#) for display? One canonical form simplifies testing and display.
2. **Cram mode and SM-2:** Should grading in Cram mode update `next_review` and intervals, or only “real” review mode?
3. **Circle of fifths direction:** Use C → G → D → … (sharps ascending) or the reverse (F → Bb → Eb → …)? Decide once and use consistently for root selector and seed order.

Once these are decided, implementation can start from Section 7 in order without blocking.
