# 0001. Hackathon platform frontend and backend completion

**Date**: 2026-10-24
**Status**: Accepted

## Summary

This decision adds a web frontend for the hackathon platform and finishes the backend API it needs to talk to. Today only sign up and sign in work end to end; the Hackathon, Team, and User features exist only as data models with no API. The frontend will be a separate Next.js app (its own repository) talking to this NestJS API over HTTPS, using the existing `better-auth` session cookie across the two origins. Building happens backend first, then frontend, so the UI is built against a real contract instead of guesses.

## Structure

This is an umbrella decision covering three related parts. `index.md` (this file) is the frontend tech stack decision and the contract shared by both child specs. Each child is a self sufficient build spec:

- [0001-backend-api-completion.md](0001-backend-api-completion.md): the missing NestJS endpoints (Hackathon, Team, User, roles) plus the small schema changes and email verification they need. Builds first.
- [0001-frontend-pages-and-routes.md](0001-frontend-pages-and-routes.md): the Next.js app's pages, routes, and role gating. Builds second, against the finished API.

Full reasoning, options considered, and references: [rationale.md](rationale.md).

## Decision

**Chosen option**: a separate Next.js (App Router) repository, calling this NestJS API cross origin over cookie based sessions, built after the API gap is closed.

**Implementation skills**: `better-auth-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-best-practices/`) · `email-and-password-best-practices` (`better-auth/skills`, `.agents/skills/email-and-password-best-practices/`) · `resend` (`resend/resend-skills`, `.agents/skills/resend/`) · `use-railway` (`railwayapp/railway-skills`, `.agents/skills/use-railway/`)

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Already the backend's language; one language across the whole stack. |
| Frontend framework | Next.js 15 (App Router) + React 19 | File based route groups map directly onto the PARTICIPANT vs ADMIN split; large ecosystem; simple hosting story. |
| Styling / components | Tailwind CSS v4 + shadcn/ui | CSS first configuration, accessible components you own and edit, current default pairing for a new React app (basis: shadcn/ui React 19 docs). |
| Server state | TanStack Query v5 | Handles caching, loading, error, and retry for every call into the REST API instead of hand rolling it per page (basis: TanStack Query v5 docs). |
| Forms / validation | react-hook-form + zod | Minimal re renders, schema based validation that mirrors the API's expected shape (basis: shadcn/ui's own form integration docs). |
| Auth client | `better-auth/react` (`createAuthClient`) | Same library already running the backend; the official client manages session state and cookie based calls (basis: better-auth client docs). |
| API client | A thin hand written fetch wrapper (base URL, `credentials: 'include'`, typed responses) | The API surface is small enough that generated codegen is not worth the extra build step yet. |
| Frontend hosting | Vercel | The standard Next.js host; zero config git based deploys. |
| Backend hosting | Railway | A persistent container for the NestJS app (no cold starts), with a managed Postgres add on. |
| Testing | Vitest + React Testing Library | Mirrors the backend's existing Vitest setup. |
| Observability | Backend's existing `LoggingInterceptor`; Vercel and Railway's built in logs | Reuse what already exists before adding a new tool. |

## Cross origin session contract (shared by both children)

The frontend (a Vercel domain) and backend (a Railway domain) are **different domains**, not just different ports, so the session cookie needs explicit cross site configuration on both sides:

- **Backend** (`src/lib/auth/auth.config.ts`): set `trustedOrigins: [FRONTEND_URL]`, and `advanced.defaultCookieAttributes: { sameSite: 'none', secure: true }` so the session cookie is sent on cross site requests (basis: better-auth reference docs, `trustedOrigins` and `advanced.defaultCookieAttributes`).
- **Backend** (`src/main.ts`): `app.enableCors({ origin: FRONTEND_URL, credentials: true })` for every route, not just `/auth/*` (better-auth handles its own CORS for its routes via `trustedOrigins`; the new Hackathon/Team/User routes need Nest's own CORS).
- **Frontend**: every fetch call sets `credentials: 'include'`; the `better-auth/react` client is created with `baseURL` pointing at the Railway backend URL.
- **New env vars**: `FRONTEND_URL` (backend, for `trustedOrigins` and CORS), `NEXT_PUBLIC_API_URL` (frontend, the backend base URL, also used as `NEXT_PUBLIC_AUTH_URL`'s value since `better-auth`'s routes are mounted on the same backend).

This contract is referenced by both children rather than repeated in full.

## Consequences

**Positive**:
- The frontend is built against a real, finished API contract, not a guess that needs rework later.
- Both apps deploy independently (Vercel / Railway), each on the host best suited to it.
- Reusing `better-auth`, Arcjet, and the existing Vitest setup means no new auth or testing paradigm to learn.

**Negative / tradeoffs**:
- Two repositories and two deploy pipelines to keep in sync, instead of one.
- Cross site cookies (`SameSite=None; Secure`) only work over HTTPS everywhere, including local development, which adds a small amount of local dev friction (a tunnel or a shared `.env` pointing both apps at deployed/staging URLs is the usual workaround).
- No shared TypeScript types between the two repos; a backend DTO change will not be caught by the frontend's compiler, only at runtime or in the hand written types.

**Neutral**:
- TypeScript types for the API are hand written and kept in sync manually; revisit with OpenAPI codegen if the surface grows much larger.

## Follow-up

- [ ] This decision chose a separate frontend repository; in reality a `frontend/` Next.js app already exists as a subfolder of this same repo (built before this spec, discovered when `/develop` started). It's already fully functional there (`node_modules` installed, builds run). Reconcile this spec to Option 2 (monorepo folder) from `rationale.md`'s Options considered, or move `frontend/` to its own repo later — either way, don't let this text drift further from reality.
- [ ] Install the remaining chosen Agent Skills (`vercel-react-best-practices`, `shadcn`, `tailwind-4-docs`, `tanstack-query-best-practices`, `react-hook-form`, `zod`) into the **new frontend repository** once it is scaffolded; they apply to that repo, not this backend repo, so they were not installed now.
- [ ] `AGENTS.md` does not yet have an `## Agent skills` section; once `better-auth-best-practices`, `email-and-password-best-practices`, `resend`, and `use-railway` are in use, record them there (root level, since they are project wide) so later tasks see them without re-discovering them.
- [ ] `AGENTS.md` says feature modules go in `src/module/<name>/`, but the existing `auth`, `hackathon`, and `user` modules all live directly under `src/<name>/`. The new `team` module (see the backend child spec) follows the existing real pattern (`src/team/`); flag the mismatch in `AGENTS.md` for `/sync` to reconcile.
