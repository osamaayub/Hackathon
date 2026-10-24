# 0002. Hackathon workspace: tasks, submissions, and schedule

**Date**: 2026-10-24
**Status**: Proposed

## Summary

This adds a lablab.ai style workspace to each hackathon: a project submission every team turns in (a link plus an optional description), an admin defined checklist of tasks teams check off during the event, and a simple schedule of timed agenda items. A countdown on the hackathon page counts down to the hackathon's existing end date, which also doubles as the submission deadline, so no new deadline field is needed.

## Context

The platform already lets participants browse hackathons, form or join a team, and lets admins manage hackathons and teams (spec 0001). What it does not yet give participants is anything to *do* once they are in a team: no way to turn in a project, no sense of what tasks the event expects of them, and no shared schedule. This is the gap a lablab.ai style event actually needs filled; without it, a team's hackathon experience ends at "join a team" with nothing to work toward.

The forces at play: this is still a small, fast moving project, so the new entities should reuse the existing Hackathon/Team scoping rather than introduce a parallel permissions system, and the three pieces (submission, tasks, schedule) are cohesive enough to ship as one feature rather than three.

## Requirements

**User stories**:
- As a team member, I want to submit my project's link so judges and other teams can see what we built.
- As a team member, I want to see and check off the event's task checklist so I know what is expected of us.
- As a participant, I want to see the schedule and a countdown to the deadline so I know how much time is left.
- As an admin, I want to define the task checklist and schedule for a hackathon.

**Acceptance criteria**:
- **AC-1**: Any member of a team can create or update (upsert) that team's submission (a `link`, required, plus an optional `description`) any time before the hackathon's `endDate`.
- **AC-2**: Once the hackathon's `endDate` has passed, creating or updating a submission is rejected.
- **AC-3**: Any authenticated user who can see a hackathon can view every team's submission for it (submissions are public within the hackathon, not judge only).
- **AC-4**: An ADMIN can create, edit, delete, and reorder tasks for a hackathon.
- **AC-5**: Any member of a team can check off or uncheck a task on behalf of their team; the completion records who did it and is visible to the whole team.
- **AC-6**: A participant who is not in any team for that hackathon cannot submit a project or complete a task.
- **AC-7**: An ADMIN can create, edit, and delete schedule items for a hackathon; any authenticated viewer of the hackathon sees them sorted chronologically by time.
- **AC-8**: The hackathon page shows a countdown to the hackathon's `endDate` (computed client side from the already returned field; no new backend field).
- **AC-9**: Every new list endpoint paginates, and every new write endpoint is covered by the existing `ArcjetGuard`.

## Options considered

### Option 1: New entities scoped to Hackathon/Team, reusing existing auth (chosen)

`Submission`, `Task`, `TaskCompletion`, and `ScheduleItem` as new Prisma models, each scoped to `Hackathon` (and `Submission`/`TaskCompletion` also to `Team`), reusing the existing `AuthGuard` and team membership checks already built for spec 0001.

**Pros**: No new permission system to design; the "am I on this team" check already exists and is proven; small, focused migration.
**Cons**: Four new tables for what is conceptually one feature; a judging/scoring system, if ever added, would need its own spec on top of this.

### Option 2: A single generic "event content" JSON blob on Hackathon

Store tasks, schedule, and submission data as JSON columns on `Hackathon`/`Team` instead of normalized tables.

**Pros**: Fewer migrations, fast to ship.
**Cons**: No query ability (can't list "all teams that haven't submitted yet" without scanning and parsing JSON in application code), no foreign key integrity, and task completion attribution (who, when) is awkward to model in a blob. Rejected: the query needs (admin dashboards, "who hasn't submitted") are exactly what a blob makes hard.

## Decision

**Chosen option**: Option 1: new, normalized entities scoped to `Hackathon`/`Team`, reusing the existing auth and team membership checks.

## Rationale

The project already committed to a relational model with real foreign keys and DB level constraints for exactly this kind of query need (one team per hackathon, capacity checks). A JSON blob (Option 2) would be the first place in the codebase to break that pattern, and for no real savings: the migration for four small, focused tables is not meaningfully bigger than one JSON column, while keeping every later admin query (attendance, completion rates, missing submissions) a normal SQL query instead of an application side JSON scan.

## Feature design

**Data model sketch**:

```prisma
model Submission {
  id          String   @id @default(cuid())
  teamId      String   @unique
  link        String
  description String?
  submittedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
}

model Task {
  id          String   @id @default(cuid())
  hackathonId String
  title       String
  description String?
  order       Int
  createdAt   DateTime @default(now())
  hackathon   Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  completions TaskCompletion[]

  @@index([hackathonId])
}

model TaskCompletion {
  id              String   @id @default(cuid())
  taskId          String
  teamId          String
  completedByUserId String
  completedAt     DateTime @default(now())
  task            Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  team            Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([taskId, teamId])
}

model ScheduleItem {
  id          String   @id @default(cuid())
  hackathonId String
  title       String
  time        DateTime
  hackathon   Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  @@index([hackathonId])
}
```

`Team` and `Hackathon` each gain the obvious back relations (`submission`, `tasks`, `scheduleItems`). `ScheduleItem` has no separate `order` field; it is always sorted by `time`, which is already a total order for a schedule.

**State transitions**: none beyond the hackathon's own `DRAFT → PUBLISHED → CLOSED` (spec 0001); submissions and task completion are simply blocked once `now() > hackathon.endDate` (submissions) or the hackathon is not visible to the caller (everything else), not a state machine of their own.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/teams/:id/submission` | GET | `id` | the team's submission, or `null` | any session | 404 (team not found) |
| `/teams/:id/submission` | PUT | `link`, `description?` | upserted submission | a member of that team | 403 (not a member), 409 (deadline passed), 422 |
| `/hackathons/:id/submissions` | GET | `id`, `page`, `pageSize` | paginated, every team's submission (team name + submission) | any session that can see the hackathon | 404 |
| `/hackathons/:id/tasks` | GET | `id`, `page`, `pageSize` | paginated tasks, ordered by `order` | any session that can see the hackathon | 404 |
| `/hackathons/:id/tasks` | POST | `title`, `description?` | created task (`order` = current task count) | ADMIN | 403, 404, 422 |
| `/tasks/:id` | PATCH | `title?`, `description?`, `order?` | updated task | ADMIN | 403, 404 |
| `/tasks/:id` | DELETE | `id` | 204 | ADMIN | 403, 404 |
| `/tasks/:id/complete` | POST | `id` | the completion record | a member of a team in that task's hackathon | 403 (not in a team), 404, 409 (already complete) |
| `/tasks/:id/complete` | DELETE | `id` | 204 | a member of the completing team | 403, 404 |
| `/hackathons/:id/schedule` | GET | `id`, `page`, `pageSize` | paginated schedule items, ordered by `time` | any session that can see the hackathon | 404 |
| `/hackathons/:id/schedule` | POST | `title`, `time` | created schedule item | ADMIN | 403, 404, 422 |
| `/schedule/:id` | PATCH | `title?`, `time?` | updated schedule item | ADMIN | 403, 404 |
| `/schedule/:id` | DELETE | `id` | 204 | ADMIN | 403, 404 |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Upsert submission | whether the deadline has passed | `now()` compared to `team.hackathon.endDate`, fetched via the team's hackathon relation |
| Upsert submission | whether the caller may act | `TeamMember` row for `(teamId, requesterId)` exists (any role, not leader only) |
| Complete a task | which team the completion is attributed to | the caller's `TeamMember` row for that task's `hackathonId` (one team per hackathon, already enforced by spec 0001's unique constraint) |
| Complete a task | who completed it | `requester.id`, stored as `completedByUserId` |
| Create a task | its default `order` | `count(Task WHERE hackathonId = :id)` at creation time |
| Countdown display | time remaining | `hackathon.endDate` (already returned by the existing hackathon endpoints), computed client side; no new backend value |
| List schedule items | display order | `ORDER BY time ASC`, no separate column needed |

**Key invariants**:
- A team has at most one `Submission` (DB enforced via `@@unique` on `teamId`).
- A submission cannot be created or updated once `now() > hackathon.endDate`.
- A `(Task, Team)` pair has at most one `TaskCompletion` (DB enforced via `@@unique([taskId, teamId])`); completing an already completed task is a 409, not a silent no-op, so the UI can distinguish "already done" from a real action.
- Deleting a `Hackathon`, `Team`, or `Task` cascades to its `Submission`/`TaskCompletion`/`ScheduleItem` rows (consistent with the existing cascade pattern on `Team`/`TeamMember`).

**Security model**:
- Submissions are readable by any authenticated user who can see the hackathon (public within the hackathon, per the engineer's choice); writable only by a member of the owning team.
- Tasks and schedule items are readable by any authenticated user who can see the hackathon; writable only by an `ADMIN` (reuses `AuthGuard` + `AdminGuard`).
- Task completion is writable only by a member of the team being credited; there is no cross team completion.
- No payment or regulated data in scope.

**Configuration required**: none; no new env vars or third party services.

**Critical test scenarios**:
- Happy path: a team member submits a project before the deadline, another member updates it, both see the latest version, verifies **AC-1**.
- Failure case: a submission attempt after `hackathon.endDate` has passed is rejected, verifies **AC-2**.
- Auth/permission: a user who belongs to no team in that hackathon attempts to complete a task and is rejected, verifies **AC-6**.

## Build plan

- [ ] Migration: add `Submission`, `Task`, `TaskCompletion`, `ScheduleItem` tables and their relations/constraints, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-7**.
- [ ] `src/submission/` (new module, following the existing `src/<name>/` pattern): `GET`/`PUT /teams/:id/submission`, `GET /hackathons/:id/submissions`, with the deadline check and team membership check, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
- [ ] `src/task/` (new module): CRUD for `/hackathons/:id/tasks` and `/tasks/:id`, plus `/tasks/:id/complete` (POST/DELETE) with the team membership check, satisfies **AC-4**, **AC-5**, **AC-6**.
- [ ] `src/schedule/` (new module): CRUD for `/hackathons/:id/schedule` and `/schedule/:id`, satisfies **AC-7**.
- [ ] Apply the existing `ArcjetGuard` (already global via `APP_GUARD`, confirm it covers these new controllers) and add pagination to every new list endpoint, satisfies **AC-9**.
- [ ] Vitest unit coverage: deadline enforcement, team membership checks, the task completion unique constraint, admin only writes.
- [ ] Frontend: extend the hackathon detail page with a countdown (client computed from `endDate`), a submission form/display, the task checklist, and the schedule list, satisfies **AC-1** through **AC-8** on the UI side.
- [ ] Frontend: admin pages to manage tasks and schedule items for a hackathon.

## Consequences

**Positive**: participants get an actual reason to keep visiting a hackathon's page after joining a team; admins get a lightweight way to run structure without a separate event tool.

**Negative / tradeoffs**: four new tables for one feature area; a future judging/scoring system will likely want to read `Submission` and may need its own spec rather than bolting onto this one.

**Neutral**: the countdown is purely client side (derived from `endDate`), so there is nothing to keep in sync server side; if a "submission deadline distinct from end date" is ever wanted, that is a small additive migration (one nullable field), not a redesign.

## Follow-up

- [ ] Track this feature on the scope (`docs/scope/scope.md`); enrolled immediately after this spec's confirmation.
