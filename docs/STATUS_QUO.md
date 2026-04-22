# The Shed — repository status (high level)

Last updated: **2026-04-22** (approximate snapshot; not a full audit.)

## What this is

A **monorepo** for a web app (“The Shed”) focused on **jazz practice / learning**: guided practice flows, scales/chords, tracks, and **studio-style teaching** (owners, tutors, students) with **Supabase** as the backend.

## Layout

| Area | Role |
|------|------|
| `apps/web` | **Next.js 15** app (`@the-shed/web`): UI, API routes, Supabase client. |
| `packages/shared` | Shared TypeScript package consumed by the web app. |
| `supabase/tables/` | **Source-of-truth SQL** for schema, RLS, triggers, RPCs (numbered for apply order). |
| `supabase/migrations/` | **Ordering / pointers** to the table scripts (many are intentionally empty). |
| `docs/` | Planning and operational notes (e.g. product/rollout plan). |

**Tooling:** `pnpm` workspaces, **Turbo** at the root for `dev` / `build` / `lint` / `typecheck`.

## Application (web)

- **Stack:** React 19, Next.js App Router, Tailwind v4, UI components in a **Shadcn-style** setup (`components/ui`).
- **Backend:** Supabase (**Postgres + Auth + RLS**). Server-only routes use the **service role** where required (e.g. Superadmin user management).
- **i18n:** English and Chinese strings live in `apps/web/src/lib/translations.ts` (plus a small language hook).
- **Notable product areas:** dashboard, practice modes, scales/chords, tracks, user settings; **Studio** (create/join/memberships/join requests); **System settings** for **Superadmin** user/role management.

## Data & access model (conceptual)

- **Platform roles** (in `profiles`): **Superadmin**, **platform tutor** (`is_tutor`), everyone else is effectively a regular user until promoted.
- **Studio roles** (in `studio_memberships`): **owner**, **tutor**, **student** (and **admin** reserved). Studio creation is gated in the database for **Superadmin or platform tutor** only (see current `040_profiles.sql` + related policies).
- **RLS** is used throughout; some policies use **security definer helpers** to avoid recursion (notably around `studio_memberships`).

## Docs to read first

- `docs/DUOLINGO_FOR_JAZZ_PLAN.md` — product/technical plan, **SQL apply order**, and environment notes for Supabase + the web app.

## Deployment

- **Railpack / Railway** builds with `pnpm --filter @the-shed/web build` and starts with `pnpm --filter @the-shed/web start`.
- Set **Supabase URL**, **publishable (anon) key**, and **service/secret key** in the host’s environment (names are documented in the plan doc; `next.config` can map some `SUPABASE_*` vars to `NEXT_PUBLIC_*` at build time).

## Gaps / expectations

- **Supabase SQL** in this repo must be **applied to your project** (SQL editor or your migration process). The app assumes the schema + RLS match the latest `supabase/tables/*.sql` you’ve run.
- This file is **not** a substitute for reading `DUOLINGO_FOR_JAZZ_PLAN.md` when changing schema or permissions.
