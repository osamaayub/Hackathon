# Rationale: hackathon platform frontend and backend completion

## Context

The repository is a NestJS 11 backend for a hackathon platform. The Prisma schema already models `User`, `Hackathon`, `Team`, and `TeamMember`, with a `Role` enum (`PARTICIPANT` / `ADMIN`) on `User`. Only authentication (`better-auth`: sign up, sign in, sign out, session, sessions, accounts) is wired end to end; `src/hackathon/hackathon.module.ts` and `src/user/user.module.ts` are empty stub modules with no controller or service. There is no frontend anywhere in the repository.

The forces at play: this is a small, time boxed project (a hackathon platform, likely built under hackathon time pressure itself), so the stack needs to be fast to build with, not maximally scalable. The backend already made its foundational choices (NestJS, Prisma, Postgres, `better-auth`, Arcjet); the frontend decision should build on those, not introduce a parallel set of conventions. The biggest open risk is the backend gap: three core entities have no API, so any frontend plan has to either wait for that API, guess at it, or build both in lockstep.

Not deciding means the frontend either never gets built, or gets built against assumptions about endpoints that do not exist yet, which is the more expensive failure mode (rework once the real contract appears).

## Options considered

### Option 1: Separate Next.js repository, build backend API first (chosen)

A new, independent Next.js (App Router) application in its own repository, calling this NestJS API over HTTPS with cross origin cookies. The missing Hackathon/Team/User endpoints are built first, then the frontend is built against them.

**Pros**:
- The frontend is built against a real, finished contract; no throwaway mocks, no rework when the guessed shape turns out wrong.
- Independent deploys and release cadence for each app (Vercel for the frontend, Railway for the backend).
- Keeps the backend repository focused on the API; no frontend build tooling mixed into it.

**Cons**:
- Two repositories and two CI/deploy setups instead of one.
- No shared TypeScript types between frontend and backend without extra tooling (codegen or a shared package).

### Option 2: Monorepo folder in this same repository (e.g. `/web`)

Add the frontend as a new top level folder in this repository, sharing one git history and PR flow.

**Pros**:
- TypeScript types (the `Role` enum, DTOs) can be imported directly between `/web` and `/src` with no duplication.
- One PR, one CI run, one place to look for the whole feature.

**Cons**:
- Couples two different build tool chains (Nest's and Next's) into one repository's CI, which slows every pipeline run down for both apps.
- Not what the engineer chose; recorded here for completeness.

### Option 3: Build the UI now against mocked data, backend later

Build the frontend immediately against hand written mock responses shaped like the Prisma schema, and wire in the real API afterward.

**Pros**:
- Visible progress fastest, useful for an early demo.

**Cons**:
- High risk of rework: the mocked shape is a guess, and guesses about pagination, error codes, and role scoped visibility are exactly the things that tend to be wrong on the first try.
- Not what the engineer chose for this reason.

## Rationale

The engineer chose Option 1 directly when asked how to handle the backend gap ("build the missing endpoints first, then the UI") and when asked where the new frontend should live ("separate repo"). Both choices align with the backend's own constraint: `better-auth` already issues cookie based sessions, and a cookie based session survives a cross origin split cleanly as long as `trustedOrigins`, CORS, and `SameSite=None; Secure` are configured (see `index.md`'s cross origin session contract), so the operational cost of Option 1 over Option 2 is mostly "two deploys to manage," not a hard technical blocker. Given the project is small (a hackathon platform, not yet at a scale needing a shared types package or monorepo tooling), two simple, independently deployed apps is the boring, provable choice over investing in monorepo tooling this project does not yet need.

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md`, the NestJS-first and infrastructure-module conventions, and the Agent Skills session continuity pointers
- `prisma/schema.prisma`, the existing `User`/`Hackathon`/`Team`/`TeamMember`/`Role` models
- `src/auth/auth.controller.ts` and `src/lib/auth/`, the existing `better-auth` integration this decision builds on

**Practices & standards**:
- Monolith/simple-stack-first over premature tooling investment for a small, time boxed project
- Boring, proven technology over novelty absent a specific constraint it solves

**Links** (web verified during this design's stack walk):
- shadcn/ui on React 19: https://ui.shadcn.com/docs/react-19
- TanStack Query v5 docs: https://tanstack.com/query/v5/docs
- shadcn/ui's react-hook-form integration: https://ui.shadcn.com/docs/forms/react-hook-form
- better-auth client concepts (`createAuthClient`, `baseURL`): https://www.better-auth.com/docs/concepts/client
- better-auth reference options (`trustedOrigins`, `advanced.defaultCookieAttributes`, `crossSubDomainCookies`): https://www.better-auth.com/docs/reference/options
- Tailwind CSS v4 + shadcn/ui as a current pairing, and common Vercel+Railway hosting pairing: verified during the stack landscape check but sourced from third party blog aggregators rather than official docs; cited here by practice, no link, since their authority is lower than the above.
