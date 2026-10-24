# Scope: Hackathon platform

A platform for running hackathons: admins create and publish hackathons, participants form or join teams and take part.

**Build approach:** Backend-first (complete the API surface for a feature before building the UI that calls it, since the cost of a guessed contract is higher than the cost of waiting for a real one).
**Workflow:** Beta (`/check verify`, then `/test`, after `/develop`). `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Auth (sign up, sign in, sessions) | Foundation | existing |
| 1 | Hackathon platform frontend & backend completion | Foundation | in-progress |
| 2 | Hackathon workspace: tasks, submissions, schedule | Slice 1 | in-progress |

## Foundations

### A. Auth · existing
Pre-workflow: sign up, sign in, sign out, session/accounts management, all via `better-auth`. code in `src/auth/`, `src/lib/auth/`

### 1. Hackathon platform frontend & backend completion · in-progress
Finishes the Hackathon/Team/User API (currently empty stub modules) and builds the Next.js frontend that calls it: hackathon browsing, team creation/membership, profile, and an admin section for managing hackathons/teams/users.
**Done when:** a participant can sign up, verify their email, browse a published hackathon, create or join a team, and manage their team; an admin can create/publish/close hackathons and manage teams and user roles; all from the deployed frontend against the real API.
- [x] Design it (spec): `/architect hackathon platform frontend`
- [ ] Build it: `/develop hackathon platform frontend & backend completion`
   - [x] Backend data layer: migration (hackathon status, team size cap, team role enum, denormalized membership), mail module, auth config changes (AC-1, AC-3, AC-4, AC-8, AC-10)
   - [x] Backend endpoints: Hackathon/Team/User CRUD, membership, role management, Arcjet coverage, tests (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-10, AC-11)
   - [ ] Frontend scaffold: Next.js app, stack install, auth pages, session/role middleware (AC-1, AC-6) — note: a `frontend/` Next.js app already exists (pre-dates this spec); this step is now "bring it up to the full spec," not "create from scratch"
   - [ ] Frontend participant pages: browse/detail hackathons, create/join team, team dashboard, profile (AC-2, AC-3, AC-4, AC-5)
   - [ ] Frontend admin pages + polish: hackathon/team/user management, pagination, loading/empty/error states, component tests (AC-7, AC-8, AC-9)
- [ ] Verify it: `/check verify hackathon platform frontend & backend completion`
- [ ] Test it: `/test hackathon platform frontend & backend completion`
Spec [0001](../specs/0001-hackathon-platform-frontend/index.md) · code in `src/hackathon/`, `src/team/`, `src/user/`, `src/lib/mail/`, `src/lib/auth/` (backend done); `frontend/` (frontend pending)

## Slice 1: Hackathon workspace

### 2. Hackathon workspace: tasks, submissions, schedule · in-progress
A lablab.ai style workspace per hackathon: teams submit a project (link + description) before the hackathon ends, check off an admin defined task checklist, see a schedule, and watch a countdown to the deadline.
**Done when:** a team can submit and update their project before the deadline, check off tasks together, and see the schedule; an admin can manage the tasks and schedule for a hackathon; submissions are visible to everyone in the hackathon.
- [x] Design it (spec): `/architect hackathon workspace tasks submissions`
- [ ] Build it: `/develop hackathon workspace tasks submissions`
   - [ ] Backend data layer: migration for Submission, Task, TaskCompletion, ScheduleItem (AC-1, AC-4, AC-5, AC-7)
   - [ ] Backend endpoints: submission/task/schedule modules, deadline + membership checks, pagination, Arcjet coverage, tests (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9)
   - [ ] Frontend workspace: countdown, submission form/display, task checklist, schedule list on the hackathon page (AC-1, AC-2, AC-3, AC-5, AC-6, AC-8)
   - [ ] Frontend admin: manage tasks and schedule items for a hackathon (AC-4, AC-7)
- [ ] Verify it: `/check verify hackathon workspace tasks submissions`
- [ ] Test it: `/test hackathon workspace tasks submissions`
Spec [0002](../specs/0002-hackathon-workspace-tasks-submissions.md) · code (filled by /develop)

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`.

**Feature lifecycle**: `planned` → `in-progress` (designed → building → verified) → `done`, plus `existing` (pre-workflow) and `dropped`.
- **Next step** = the first unticked box.
- **Atomic build tasks live in the spec's `## Build plan`**, not here; the scope carries only the milestone rollup above.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
