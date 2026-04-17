# Duolingo for Jazz — Long-Term Plan

**Canonical location:** `docs/DUOLINGO_FOR_JAZZ_PLAN.md` (update this file when the roadmap or architecture assumptions change).

This document captures product vision and **architectural direction** for evolving The Shed from a spaced-repetition flashcard app into a **progress-driven, gamified jazz practice platform** with **tutor–student relationships**, future **lightweight games** (e.g. one lick per day), and **region-aware identity**. It is intentionally **non-code**: implementation details live in [`../README.md`](../README.md), [`../supabase/tables/`](../supabase/tables/), and `packages/` as the product matures.

---

## 0. Baseline (what already exists)

This plan is written *from the current codebase*, not from a blank slate. As of 2026-04-17, the following are already working:

- **Practice modes (games)**: `full_scale`, `full_chord`, `sequence`, `251`, `interval`
- **Grading & scheduling**: game-item grading route (`/api/game-items/[id]/grade`) + per-user due state in `user_game_item_state`
- **Telemetry**: `practice_sessions` and **append-only** `game_events` logged on every grade (`practice_events` remains as legacy history)
- **Session lifecycle**: inactive sessions auto-close (client + server-side cleanup); `practice_sessions.status` is authoritative (`completed`/`abandoned`)
- **Progress visibility (dashboard)**:
  - streak, due count, mastered count
  - **recent sessions** (real data from `practice_sessions`)
  - **7-day trend** (sessions/items/accuracy)
  - **XP** (derived from `game_events.grade`, shown on dashboard + inside practice)
- **Foundation**: auth, i18n (EN/ZH), Concert/Bb/**Eb** transposition, audio playback (Tone.js)
- **Shared theory**: `TheoryMapper`, `twoFiveOne`, `sm2`, `scaleDefinitions`, `transpose`
- **Navigation UX**: top-level nav is `Dashboard` + **The Shed** (`/track`; `/learn` redirects here) + **Free Practice** + `Library` (Scales/Chords); **Preferences** lives in user menu
- **Curriculum shell (demo only)**: **`/track/jazz-101`** — sectioned path UI (18 lesson nodes), first lesson opens **`/track/jazz-101/lesson/1`** (placeholder: 12 chromatic notes from `@the-shed/shared`). **No** server-backed `user_node_state`, authoring, or completion gating yet — UI and routing only.

**Implication:** “Game/event foundation” is not a future phase — it’s already present. The roadmap below is a re-baselined plan from this starting point.

### 0.1 Where we are now (MVP checkpoint)

Free practice is **feature-complete enough for an MVP**:

- **Play**: users can start practice sessions per game mode on mobile/desktop
- **Adapt**: selection favors weak items (per-game independence)
- **Track**: every grade logs `game_events` and rolls up into `practice_sessions`
- **See progress**: dashboard shows history + weekly trend + XP; practice shows XP feedback

Next steps should focus on **wiring the curriculum to real games + persistence** (beyond the Jazz 101 shell), then **tutor visibility**, rather than polishing free-practice further.

---

## 1. Vision (what we are building)

- **Core loop**: Practice that feels **guided** (skill tree, clear next steps) and **rewarding** (streaks, levels, visible growth), not only “a flat review deck.”
- **Clarity**: **Scales**, **chords**, **sequences**, **251**, and future content types appear as **distinct tracks or nodes** in a skill tree—not one undifferentiated grid—so users know *what* they are leveling up.
- **Teaching**: **Tutors** can add or link **students**, view **progress and scores**, and (later) assign focus areas aligned to the tree.
- **Long tail**: **Optional games** (daily lick, challenges, timed drills) sit **on top of** the same theory engine and identity; they should not fork the domain model.

**Non-goals (for now)**:

- **Native iOS/Android apps**. The product is **web-first**: responsive browser on phone, tablet, and desktop. Deep links and installable PWA can improve mobile UX without a separate codebase.

---

## 2. Client surfaces over time

| Phase | Surface | Role |
|--------|---------|------|
| **Now / near term** | **Responsive web** | Single Next.js app; TanStack Query; same API + Supabase patterns as today. |
| **Later** | **WeChat Mini Program (微信小程序)** | Reach **Chinese users** inside WeChat; constrained runtime and APIs; likely **not** identical to full browser app—thin client to same backend where possible. |

**Implication**: Long-term architecture should treat **the backend contract** (auth tokens, APIs, stable JSON shapes) as **client-agnostic**. The web app remains the reference client; the mini program consumes a **subset** of capabilities first (onboarding, daily content, progress sync)—expanded over time.

---

## 3. Identity and regions (Google vs WeChat)

**Target state**:

- **Global users**: Familiar social/OAuth flows—**Google** (and possibly others later) via **Supabase Auth** or equivalent.
- **Chinese mainland users**: **WeChat login** as the primary social identity; many users will not use Google for daily sign-in.

**Architectural considerations**:

- **One logical user** in the database should map to **one or more linked identities** (OAuth provider, WeChat Open Platform / mini program identity) so accounts can merge or bind safely when the same person uses web and WeChat.
- **Supabase Auth** is a strong default for email/password and standard OAuth; **WeChat** often requires a **custom token exchange** (Edge Function or API route) that mints a session after validating WeChat’s `code` server-side. Plan for **provider-specific plumbing** without scattering “if WeChat” across business logic—keep it at the **auth adapter** boundary.
- **RLS and `user_id`** remain the spine: regardless of login method, **JWT claims** must resolve to the same `auth.users` / app profile row for authorization.
- **Data residency / compliance**: If you serve Chinese users seriously, revisit hosting, logging, and privacy notices; this document does not prescribe vendors—only that **identity and policy** be first-class in the plan.

### 3.1 Scope warning: WeChat is a large phase

WeChat login / mini program is **not** equivalent effort to Google OAuth. Expect extra surface area:

- WeChat `code` exchange server-side and provider-specific session minting
- Distinct identity model for mini program vs web
- Potential China-region hosting, logging, privacy/compliance requirements
- Separate UI/runtime constraints for the mini program

Treat WeChat as a **late, large-scope item** gated on stable core product mechanics and a stable API contract.

---

## 4. Multi-tenancy, tutors, and progress visibility

**“Multitenant” here means**: logical isolation of **organizations or tutor–student groups**, not necessarily separate databases per tenant.

Recommended conceptual model (names illustrative):

- **Actor roles**: `student`, `tutor`, optionally `org_admin`.
- **Membership**: explicit rows linking users to a **group or studio** (who may see whom).
- **Progress**: students retain **their** card SM-2 state and session history; tutors see **aggregates and views** authorized by RLS (or server-side queries using service role only where unavoidable and audited).

**Read path today**: The browser can read its own practice state directly from Supabase with user JWT. **Tutor dashboards** break the “only ever my `user_id`” pattern. Long term, expect:

- **Stricter RLS policies** for cross-user reads, **or**
- **Server-mediated reads** (Next API routes or RPCs) that return only fields tutors are allowed to see.

Prefer **keep RLS as the safety net** even when using API routes (pass user JWT, no broad bypass).

### 4.1 RBAC schema sketch (Phase 1 deliverable)

Phase 1 is **schema only**: no UI until the tables and RLS shape are agreed. A concrete, minimal starting point:

- **`studios`**: a tenant boundary (a tutor’s studio, a school, or a group).
  - Columns: `id`, `slug`, `name`, `created_at`, `created_by_user_id`
- **`studio_memberships`**: users in a studio with a role.
  - Columns: `studio_id`, `user_id`, `role` (`owner`, `admin`, `tutor`, `student`), `created_at`
  - Constraint: unique `(studio_id, user_id)`
- **`tutor_student_links`** (optional if role is enough): explicit tutor ↔ student relationships inside a studio.
  - Columns: `studio_id`, `tutor_user_id`, `student_user_id`, `created_at`
  - Constraint: unique `(studio_id, tutor_user_id, student_user_id)`

RLS intent (high-level):

- **Students** can read/write their own practice state and events.
- **Tutors** can read (and later assign) only for students they are linked to (or within the same studio with appropriate role).
- **Studio admins/owners** can manage memberships.

This schema must also define how existing per-user rows (e.g. `user_game_item_state`, `practice_sessions`, `game_events`) relate to studios:

- Near term: keep `user_id` as the primary owner on practice tables; tutors access via joins to membership/link tables.
- Later (optional): add `studio_id` to authored curriculum content and assignments (not necessarily to raw attempts).

### 4.2 User preferences (pre-RBAC and per-tenant later)

Even before RBAC/tenancy is shipped, we should support **basic per-user preferences** so the UX doesn’t require repeated toggling.

- **Immediate (single-tenant default)**: store preferences on the user (RLS-protected), e.g. default instrument key/pitch display:
  - `pitch_mode`: `concert` / `bb` / `eb`
  - This is orthogonal to RBAC and can be used by the UI as a default.

- **Later (per-tenant preference)**: once studios/tenants exist, allow a user to keep different defaults per studio (e.g. one studio teaches concert, another teaches Bb):
  - model as `studio_user_settings` keyed by `(studio_id, user_id)` with an override `pitch_mode`
  - fallback order: `studio_user_settings` → `user_settings` → local defaults

Until RBAC is implemented, instrument pitch (Concert / B♭ / E♭) is driven by a **client toggle** with **localStorage**; logged-in users also **best-effort sync** to `user_settings.pitch_mode` when available, so DB-backed defaults are optional, not required for basic use.

---

## 5. Game-based architecture (games → nodes → sections)

**Separate concerns**:

1. **Games** — reusable interaction engines (scale game, chord game, sequence game, 251 game, “one lick per day”, etc.). A game defines: inputs/parameters, what events it emits, and how scoring works.
2. **Nodes (exercises)** — a unit in the curriculum that can run **one or more games** with constraints (e.g. “251 in C major only”) plus pass/advance requirements.
3. **Sections (courses)** — ordered groups of nodes (e.g. “Jazz 101” with ~10 nodes). Sections define the learning journey; nodes define gates; games are the building blocks.
4. **Engagement meta** — XP, streaks, levels, leagues/ranking, daily goals, badges; optional and **additive** so users can progress at their own pace.

### 5.1 Where do SM-2 / “due” dates fit?

They can **co-exist** as an optional mechanism rather than the product backbone.

- **Gamification-first**: users play at their pace; “due” is not required for forward progress.
- **Optional “due/decay” mechanics** (later): if a user doesn’t come back, they might lose multipliers/points, or a node might require a refresh. SM-2 can be one way to drive “what’s due,” but it is not the only way.

Recommended stance for this roadmap:

- **Treat “what to show next” as a policy layer** driven by telemetry + user state.
- If SM-2 is present, it becomes **a feature** (signals, bonus XP for due items, optional review queues), not a hard dependency.

**Principle**: `TheoryMapper` and scale definitions remain the **single source of truth for note content**. Gamification **references** card IDs or canonical `(scale_type, root)` keys—it does not duplicate theory.

**Important reframing**: today’s free-practice modes are best treated as **Free Practice Games** (user-initiated practice) rather than the curriculum itself. Curriculum nodes can re-use the same games with tighter parameters and gating.

### 5.2 Game catalog must map to existing modes

The “game catalog” concept should not create parallel definitions. It must map 1:1 to the existing game slugs already in use:

- `full_scale`
- `full_chord`
- `sequence`
- `251` (as part of **Chord Progression** game family)
- `interval`

Re-assessed game catalog (target state):

- **Scale Game** (`full_scale`)
- **Chord Game** (`full_chord`)
- **Sequence Game** (`sequence`)
- **Chord Progression Game** (`251` for now; expandable to other progressions later)
- **Interval Game** (`interval`)

If/when a `games` table exists, these become stable identifiers (and later “daily lick” etc. are additive).

---

## 6. Future games (“one lick per day,” etc.)

Treat mini-games as **feature plugins** sharing:

- **Identity** and **student progress** tables.
- **Content contracts** from `@the-shed/shared` (keys, roots, degrees).

Design implications:

- **Short sessions**: Daily lick might be a **scheduled content pointer** (which lick, which backing) + **completion record**—not a separate SM-2 universe unless you explicitly want spaced licks later.
- **Job-friendly**: “Daily” content may eventually need **cron** or **queue** workers; if Next.js API routes become a bottleneck, **extract scheduled jobs** to a worker or Supabase Edge cron—not necessarily a full rewrite.
- **Fairness / cheating**: Leaderboards (if any) need server validation; keep validation rules in **shared pure functions** where possible.

---

## 6.1 Practice telemetry + adaptive sequencing (near-term priority)

If curriculum content is still evolving, the most valuable next step is making the **games** feel adaptive and making progress **visible**.

Key idea: use the telemetry layer (now primarily append-only `game_events`, with `practice_events` as legacy history) to compute:

- **What to show next** (adaptive ordering): down-rank items with consistently high performance; up-rank “struggler” items.
- **Historical scores**: per session, per week, per mode, per scale family/root.
- **Brief analysis**: weakest areas, improvement trends, “what to focus on next.”

This telemetry layer is also what enables future features like tutor dashboards and LLM summaries.

---

## 6.2 Data model direction (tables likely to change)

The current model is scale-centric and stores user state in the same row as the “card.” For long-term extensibility (multiple content types, detailed tracking, tutor views), prefer an explicit split:

- **Game catalog** (stable): “what game types exist?” (scale game, chord game, etc.) and versioning.
- **Content catalog(s)** (stable): “what content units exist?” by game family.
  - Scale/Chord/Sequence items
  - Chord Progression items (`251` now)
  - Interval items
- **User-game/content state** (per-user, mutable): “how is this user doing on this game/content key?” (mastery, streak, last_seen, optional SM-2 fields).
- **Attempt/event log** (append-only): “what happened when the user played?” (session_id, game_id, node_id nullable for free practice, shown_at, grade/score, response_time, metadata).
- **Session log** (append-only): boundaries and aggregates of a practice run.
- **Curriculum tables** (stable): sections, nodes, node→games composition, and node requirements (advance rules).

This structure makes it easy to compute adaptive selection, dashboards, and tutor reporting without overloading one table.

### 6.2.1 The highest-risk migration: splitting legacy `cards` into catalog vs per-user state

Historically, the `cards` table served double duty and also coupled several games under one identity key:

- a **content catalog** (seeded per user), and
- the **per-user state** (SM-2 fields, last reviewed timestamps).

To support truly independent games (Scale / Chord / Sequence / Chord Progression / Interval), curriculum nodes, and tutor reporting safely, these responsibilities were split into `games` + `game_items` + `user_game_item_state` + `game_events`. Legacy `cards` / `practice_events` **source** files were removed from `supabase/tables/` after migration (see `migrations/0001_init.sql` historical note). Remaining work is cleanup, parity verification, and any historical backfill still worth keeping.

**Migration order (high-level, with rollback in mind):**

1. **Introduce new game-based tables** in `supabase/tables/` without deleting old ones:
   - `games`
   - `game_items`
   - `user_game_item_state`
   - `game_events`
2. **Backfill game catalog + item mappings** from current modes:
   - scale/chord/sequence from current `(scale_type, root)`
   - chord progression from current `251` logs
   - interval from current interval events
3. **Backfill per-user state** from existing legacy `cards` + `practice_events` into `user_game_item_state` where historical continuity matters.
4. **Dual-write** during transition if needed, but treat it as temporary only.
5. **Cut over** adaptive sequencing, grading, and dashboards to `game_items` / `user_game_item_state` / `game_events`.
6. **Verify parity** by game type (especially sequence vs chord independence, progression 251, and interval behavior).
7. **Delete** old coupled practice paths once the game-based flow is stable.

This migration must enumerate every impacted surface (e.g. seed routes, grading routes, due-item queries, dashboard stats, and any historical views still reading legacy tables).

---

## 6.3 LLM-generated summaries (later, optional)

LLMs are best treated as a **presentation layer** on top of deterministic analytics:

- Input: recent aggregates + highlights from attempt history (not raw theory tables).
- Output: short coaching notes (“Your misses cluster on altered dominant in Eb; try X next.”).
- Guardrails: always show the underlying evidence (“based on last 20 attempts”) and never let the LLM be the source of truth for scoring.

Keep this optional so the core app works without it (cost, privacy, latency).

---

## 7. Backend vs frontend: long-term reassessment

**Current shape**: **Turborepo**, `apps/web` Next.js with API routes, **`packages/shared`**, **Supabase** with direct reads for many card queries.

**This remains valid** for the next several phases if you:

- Grow **shared** with curriculum + gamification **pure functions** and types.
- Add **API routes or Edge Functions** for auth edges (WeChat), tutor aggregates, and anything that must not be expressed safely as raw client queries.
- Keep **RLS** aligned whenever data crosses user boundaries.

**You do not need a separate backend service** to achieve the product vision **unless** you hit concrete triggers such as:

- Heavy **background processing** (nightly analytics, mass notifications, league recomputation).
- **Multiple first-class clients** (web + WeChat mini program + partners) that all need stable versioning and rate limits.
- **Team or scaling split** between API and web teams.

If that day comes, **extract a dedicated API** (or split `apps/api`) **without changing the theory package**—the expensive move is duplicated business logic, not monorepo layout.

**PWA**: Optional progressive web app behaviors (manifest, offline-friendly caching for **read-only** shell) can help mobile web; mini program is a **different** delivery channel with its own auth and UI constraints.

---

## 7.1 Duolingo-style reference patterns (no vendored clone in-repo)

This repo does **not** include a copy of the `nextjs-duolingo-clone` tutorial project. The ideas below are **conceptual** lessons from typical Duolingo-style Next.js examples (courses → units → lessons, path UI, server actions for progress). Use them as design direction, not as code to paste.

### Patterns to borrow

- **Content tables + per-user progress joins**
  - Model: `courses → units → lessons → challenges` + per-user join tables (`challenge_progress`, `user_progress`).
  - For The Shed, map this conceptually to: **sections → nodes → game runs**, with **user_node_state** and **attempts/events** as joins.

- **Next.js App Router split: server-rendered pages + client “runtime”**
  - Server components fetch the graph and render quickly; interactive state lives in a client component (quiz loop).
  - This is a good template for a future “node runtime” that composes games.

- **Progress mutations via server actions + cache invalidation**
  - “Complete challenge, award points, revalidate” is a strong pattern for game scoring and node gating.

- **A simple “path” UI trick**
  - Alternating lesson button positions (indentation) can yield a Duolingo-like path with minimal complexity.

- **Admin tooling pattern**
  - React Admin + thin route handlers is a pragmatic way to manage authored content (sections/nodes/game params) early on.

### Patterns to avoid (don’t copy directly from naive clones)

- **Hardcoded admin allowlists**
  - Many demo apps use a userId allowlist for admin.
  - The Shed should use **Supabase RBAC + RLS** (roles + memberships) instead.

- **No append-only telemetry**
  - Tutorial apps often store “completed” progress but not a detailed attempt/event log. We need attempts/events for adaptive sequencing, analytics, tutor reporting, and LLM summaries.

- **Simplistic gating**
  - “Locked unless current” is fine for a demo but not enough for game-based nodes with explicit requirements.

---

## 8. Execution plan (formal phase order)

This is the **living execution order**. It is intentionally re-baselined from the current codebase and incorporates the audit feedback (notably: adaptive sequencing was possible before the legacy `cards` split was completed).

| # | Phase | Status | Output |
|---|------|--------|--------|
| 1 | **RBAC data model (schema only)** | ✅ Done | SQL tables + RLS design for studios/memberships/roles |
| 2 | **Adaptive sequencing v1** | ✅ Done | Weighted selection policy that favors weak items |
| 3 | **Progress history UI** | ✅ Done | Dashboard recent sessions + 7-day trend |
| 4 | **Gamification basics (XP only)** | ✅ Done | XP derived from `game_events` (dashboard + practice feedback) |
| 5 | **Game-based state split (schema migration)** | ✅ Done | `games`/`game_items`/`user_game_item_state`/`game_events` + legacy cleanup |
| 6 | **Curriculum MVP (tracks → nodes)** | 🟡 In progress | **Shell:** Jazz 101 UI + routes (`/track/jazz-101`, lesson 1 placeholder). **Still to ship:** DB-backed nodes/progress, bind lessons to existing game modes, authoring or seed pipeline |
| 7 | **Content authoring admin** | Pending | Non-hardcoded authoring flow for tracks/nodes/game params |
| 8 | **Tutor v1 (read-only)** | Pending | Roster + read-only student progress views (leverages phases 1/3/4 data) |
| 9 | **Google OAuth / regional auth** | Pending | OAuth login for global users |
| 10+ | **WeChat mini program** | Later | Large scope; gated on Phase 9 + stable API contract |
| 11 | **Daily lick / scheduled games** | Later | Scheduled content + completion; add background jobs when needed |

---

## 9. Pre-implementation checklist (must exist before coding risky phases)

Before implementing phases that change schema or authorization, the following design artifacts must exist:

- **Jazz 101 (and future tracks)**: lesson → `game_slug` / `game_item` mapping, completion rules, and where progress is stored (new tables vs reusing `user_game_item_state` + `game_events` with `node_id` metadata).
- **RBAC SQL schema**: concrete tables for studios/groups, memberships, tutor/student relationships, role enums.
- **Game migration plan**: step-by-step rollout order **with rollback**, including mapping for Scale/Chord/Sequence/Chord Progression(251)/Interval and all impacted routes/hooks/queries.
- **SM-2 decision**: explicitly choose one (and document):
  - **Keep SM-2 as the core** (due-based remains primary), or
  - **Keep SM-2 as an optional signal** (gamification-first; SM-2 informs boosts/review queues), or
  - **Deprecate SM-2** (replace with event-driven mastery/decay).
- **Game catalog mapping**: map existing slugs (`full_scale`, `full_chord`, `sequence`, `251`, `interval`) to canonical `game_id` / identifiers so nothing duplicates.
- **Progression scope decision**: confirm Chord Progression game starts with `251` only, and define how new progression types will be added later.
- **Dashboard rewrite note**: derive streak/mastery from `user_game_item_state` and `game_events`, not `cards`.
- **Content authoring decision**: React Admin vs custom admin vs seed scripts (and where it lives).
- **WeChat scope gate**: explicitly defer until core phases are stable; treat as a large phase with its own checklist.

---

## 10. Principles (checklist for future PRs)

- **Theory in `packages/shared` only**; no duplicate scale definitions in API or clients.
- **Games are the primary building blocks**; nodes compose games; sections organize nodes.
- **Free practice stays supported**: everything should work without being inside a curriculum node.
- **RLS stays authoritative**; avoid service-role reads in the browser.
- **Provider-specific auth** isolated from core grading and SM-2 logic.
- **Web remains reference client**; second clients integrate through **documented APIs** and the same user row.

---

## 11. Document ownership

Update [`DUOLINGO_FOR_JAZZ_PLAN.md`](DUOLINGO_FOR_JAZZ_PLAN.md) when vision shifts (new clients, new roles, or a deliberate move to a standalone API). Keep **implementation details** (commands, file paths, SM-2 formula) in [`../README.md`](../README.md) and [`../supabase/tables/`](../supabase/tables/); keep **phase order and scope** in **section 8** above.
