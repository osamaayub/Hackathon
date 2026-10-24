# Backend API completion: Hackathon, Team, User, email verification

Part of [0001-hackathon-platform-frontend](index.md). Builds first; the frontend child spec depends on this.

## Summary

This fills in the NestJS API that the frontend will call: full CRUD for hackathons, team creation and membership (join, leave, leader management), user profile and role management, and email verification on sign up. It also makes three small, already agreed schema changes: a hackathon `status`, a configurable team size cap, and a proper `TeamRole` enum.

## Requirements

**User stories**:
- As an ADMIN, I want to create, publish, and close hackathons so participants only see ones that are open.
- As a PARTICIPANT, I want to create or join one team per hackathon so I can take part.
- As a team LEADER, I want to manage my team's info and members so I can keep my team organized.
- As a new user, I want to verify my email so my account is confirmed before I can use the platform.
- As an ADMIN, I want to manage users and their roles so I can promote trusted participants.

**Acceptance criteria**:
- **AC-1**: An ADMIN can create, edit, and delete a hackathon (title, description, dates, location, `maxTeams`, `maxTeamSize`, `status`).
- **AC-2**: A PARTICIPANT's hackathon list and detail views only ever show `PUBLISHED` or `CLOSED` hackathons; `DRAFT` hackathons are visible only to ADMINs.
- **AC-3**: A PARTICIPANT can create a team in a `PUBLISHED` hackathon they are not already in, becoming its `LEADER`.
- **AC-4**: A PARTICIPANT can join an existing team in a hackathon they are not already in, as long as the team has not reached its effective `maxTeamSize`.
- **AC-5**: A team's `LEADER` can edit the team's info and remove a member; a `MEMBER` can only leave; if the `LEADER` leaves or is removed while others remain, leadership auto-transfers to the longest tenured remaining member.
- **AC-6**: When a team's last member leaves or is removed, the team is deleted.
- **AC-7**: An ADMIN can view and delete any team, and promote or demote any user between `PARTICIPANT` and `ADMIN`, except demoting the last remaining `ADMIN`.
- **AC-8**: A new user receives a verification email after sign up and cannot sign in until it is verified; they can request the email again via `better-auth`'s own resend endpoint.
- **AC-9**: All new write endpoints (create/update/delete/join/leave) are covered by the existing Arcjet rate limiting guard.
- **AC-10**: Creating or joining a second team within the same hackathon is rejected with a 409.
- **AC-11**: Two participants racing for the last open slot in a team never both succeed; the loser gets a 409.

## Feature design

**Data model sketch** (changes to `prisma/schema.prisma`; everything else unchanged):

```prisma
enum HackathonStatus {
  DRAFT
  PUBLISHED
  CLOSED
}

enum TeamRole {
  LEADER
  MEMBER
}

model Hackathon {
  // ...existing fields...
  status      HackathonStatus @default(DRAFT)
  maxTeamSize Int?            // null = use the application default (4)
}

model TeamMember {
  // ...existing fields...
  hackathonId String         // denormalized from team.hackathonId, set on creation
  role        TeamRole       @default(MEMBER)

  @@unique([hackathonId, userId]) // enforces one team per hackathon per user at the DB level
}
```

The `TeamMember.hackathonId` denormalized column (copied from the parent `Team` when a membership row is created) is what makes "one team per hackathon per user" a real database constraint instead of an application-only check that a race condition could slip past.

**State transitions** (`Hackathon.status`):
`DRAFT → PUBLISHED` (admin publishes; allowed any time) · `PUBLISHED → DRAFT` (admin un-publishes; **blocked once the hackathon has any team**, since un-publishing a hackathon participants already joined would hide their own team from them) · `PUBLISHED → CLOSED` (admin closes; one way, blocks new teams and joins, existing teams remain visible) · `DRAFT → CLOSED` and `CLOSED → anything` are invalid transitions (409).

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/hackathons` | GET | `page` (default 1), `pageSize` (default 20, max 100), `status` (ADMIN only; ignored for non-ADMIN, never a 403) | paginated hackathons, sorted by `createdAt desc` | any session | 401 |
| `/hackathons/:id` | GET | `id` | hackathon detail | any session; `DRAFT` → 404 for non-ADMIN | 404 |
| `/hackathons` | POST | `title`, `description`, `startDate`, `endDate`, `location?`, `maxTeams?`, `maxTeamSize?` | created hackathon (`status: DRAFT`) | ADMIN | 422, 403 |
| `/hackathons/:id` | PATCH | any of the above, `status?` | updated hackathon | ADMIN | 404, 403, 409 (invalid status transition) |
| `/hackathons/:id` | DELETE | `id` | 204 | ADMIN | 404, 403, 409 (hackathon already has teams; close it instead) |
| `/hackathons/:id/teams` | GET | `id`, `page`, `pageSize` (default 20, max 100) | paginated teams, sorted by `createdAt asc` | any session | 404 |
| `/hackathons/:id/teams` | POST | `name`, `description?` | created team, creator becomes `LEADER` | PARTICIPANT | 403 (hackathon not `PUBLISHED`), 409 (already in a team this hackathon / duplicate name / hackathon already has `maxTeams` teams), 422 |
| `/teams/:id` | GET | `id` | team detail with members and roles | any session | 404 |
| `/teams/:id` | PATCH | `name?`, `description?` | updated team | that team's `LEADER`, or ADMIN | 403, 404 |
| `/teams/:id` | DELETE | `id` | 204 | that team's `LEADER`, or ADMIN | 403, 404 |
| `/teams/:id/join` | POST | `id` | updated membership | PARTICIPANT, not already in a team this hackathon | 409 (full, or already in a team), 404 |
| `/teams/:id/leave` | POST | `id` | 204 (team deleted if now empty; leadership transferred first if the leader leaves and others remain) | the member themself | 403, 404 |
| `/teams/:id/members/:userId` | DELETE | `teamId`, `userId` | 204 (team deleted if now empty) | that team's `LEADER`, or ADMIN | 403, 404 |
| `/users/me` | GET | — | own profile incl. `emailVerified` | any session | 401 |
| `/users/me` | PATCH | `name?` | updated profile | self | 422 |
| `/users` | GET | `page`, `search?`, `pageSize` (default 20, max 100) | paginated users, sorted by `createdAt desc` | ADMIN | 403 |
| `/users/:id/role` | PATCH | `role: PARTICIPANT \| ADMIN` | updated user | ADMIN | 403, 404, 409 (would demote the last ADMIN) |

Email verification itself is **not** a custom endpoint here: `better-auth` already exposes `send-verification-email` and `verify-email` under its own `/auth/*` routes (mounted by the existing `AuthController`/`AuthService`). The frontend calls them through `authClient.sendVerificationEmail()` and the verify-link callback; this backend spec only has to turn verification **on** (`requireEmailVerification: true`) and supply the `sendVerificationEmail` callback that hands off to `MailService` (see Build plan step 3).

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Create/join team | effective max team size | `hackathon.maxTeamSize` column, or the code constant `DEFAULT_MAX_TEAM_SIZE = 4` when null |
| Create/join team | whether requester already has a team in this hackathon | `TeamMember` row where `hackathonId = :hackathonId AND userId = :requesterId` (the new unique constraint) |
| Join team | current member count vs. the cap | `count(TeamMember WHERE teamId = :id)` compared to the effective max team size, computed after a `SELECT ... FOR UPDATE` row lock on the `Team` row inside the transaction (a plain read + transaction does not stop two concurrent joins both seeing "one slot left") |
| Create team | current team count vs. `maxTeams` | `count(Team WHERE hackathonId = :id)` compared to `hackathon.maxTeams` (when set), computed after a `SELECT ... FOR UPDATE` row lock on the `Hackathon` row inside the transaction |
| Leave team (as LEADER, others remain) | who becomes the new `LEADER` | the remaining `TeamMember` with the earliest `joinedAt` for that team |
| Edit/delete team, remove member | whether requester may act | `TeamMember.role` for `(teamId, requesterId) == LEADER`, or `requester.role == ADMIN` |
| List/detail hackathons | which statuses are visible | `requester.role`: ADMIN sees all statuses; PARTICIPANT sees only `PUBLISHED`/`CLOSED` |
| List hackathons (ADMIN) | which `status` filter is applied | the `status` query param when `requester.role == ADMIN`; ignored (not 403) for any other role |
| Any paginated list | page size and sort order | the `pageSize` query param (default 20, capped at 100); sort order fixed per endpoint, see the API surface table |
| Update hackathon status | whether the transition is allowed | the state machine rule above, plus `count(Team WHERE hackathonId = :id)` for the `PUBLISHED → DRAFT` guard |
| Verification email | recipient address, link | `User.email` column; the signed token and link are generated entirely by `better-auth`'s own `sendVerificationEmail` flow, not custom code |
| Verification email | sender address / template | `RESEND_FROM_EMAIL` env var + a fixed template in `MailService`, not user input |

**Key invariants**:
- A user holds at most one `TeamMember` row per hackathon (DB enforced via `@@unique([hackathonId, userId])`).
- A team's member count never exceeds its effective `maxTeamSize`, and a hackathon's team count never exceeds its `maxTeams` (both enforced via a `SELECT ... FOR UPDATE` row lock before the count check, not a plain transaction, since `READ COMMITTED` alone does not stop two concurrent requests from both reading "one slot left").
- A team always has a `LEADER` while it has any members: if the `LEADER` leaves or is removed and others remain, the longest tenured remaining member (earliest `joinedAt`) is auto-promoted to `LEADER`.
- A team with zero members is deleted, never left orphaned.
- There is always at least one `ADMIN` user; a role update that would remove the last one is rejected.
- A hackathon with any team cannot be deleted outright (409); it must be `CLOSED` instead, so team data is never silently destroyed by an admin mistake.

**Security model**:
- Every endpoint above requires an authenticated session (the existing `AuthGuard`), except sign up, sign in, and email verification.
- PARTICIPANT: read `PUBLISHED`/`CLOSED` hackathons, manage their own profile, manage their own team only if `LEADER`, leave their own team if `MEMBER`, create/join exactly one team per hackathon.
- ADMIN: everything above plus `DRAFT` visibility, hackathon CRUD, delete/view any team, and user/role management.
- No payment or health data in scope; the only sensitive field is `email`, already covered by `better-auth`'s existing handling.

**Configuration required**:
- `RESEND_API_KEY`: the Resend account's API key, used by `MailService` to send verification emails.
- `RESEND_FROM_EMAIL`: the verified sender address for outgoing email.
- `FRONTEND_URL`: used both for the verification link's base URL and for `trustedOrigins`/CORS (see the umbrella's cross origin session contract).

**Critical test scenarios**:
- Happy path: a participant creates a team in a published hackathon, becomes `LEADER`, a second participant joins it successfully, verifies **AC-3**, **AC-4**.
- Failure case: two participants race for a team's last open slot (concurrent requests against the row-locked capacity check); exactly one succeeds, the other receives 409, verifies **AC-11**.
- Auth/permission: a `MEMBER` (not `LEADER`) attempts to remove another member and is rejected with 403, verifies **AC-5**.

## Build plan

- [x] Write and run the migration: `Hackathon.status` + `maxTeamSize`, `TeamMember.hackathonId` + `role` enum + the new unique constraint, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-10**. Applied directly against the live DB (no prior migrations folder existed; this project uses `prisma db push`), with existing rows backfilled (`LEAD` → `LEADER`, `hackathonId` populated from `Team`) rather than reset. Verified live: `prisma db push` reports no drift.
- [x] Create `src/lib/mail/mail.module.ts` + `mail.service.ts` (wraps Resend, `@Global()`, imported once in `AppModule`, per this repo's infrastructure-module convention), satisfies **AC-8**. Falls back to logging the link to the console when `RESEND_API_KEY` is unset (no Resend account configured yet); verified live.
- [x] In `src/lib/auth/auth.config.ts`: flip `emailAndPassword.requireEmailVerification` to `true`, add the `sendVerificationEmail` callback (delegates to `MailService`), and reconcile `advanced.useSecureCookies`/`sameSite` — made environment-aware (`isProduction`) rather than always-on, since forcing `Secure` cookies breaks local HTTP-only dev. Also set `basePath: '/auth'` and added the missing `GET /auth/verify-email` and `POST /auth/send-verification-email` routes to `AuthController` (better-auth doesn't expose these on its own here, since this project wraps every method by hand instead of mounting its router) — found and fixed via live testing. Satisfies **AC-8**. Verified live end to end: sign-up → console-logged link → verify → sign-in.
- [x] Build out `src/hackathon/` (controller + service): CRUD, status transition validation, role scoped visibility filtering, `maxTeams`/pagination enforcement, satisfies **AC-1**, **AC-2**. Verified live (pagination shape, 401/403/404 cases) and by unit tests.
- [x] Create `src/team/` (new module, following the existing `src/<name>/` pattern already used by `auth`/`hackathon`/`user`): create/join/leave/update/delete/remove-member, with the one-team-per-hackathon unique constraint, the row-locked capacity checks, and leader auto-succession on leave, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-10**, **AC-11**. Verified live and by unit tests; a real bug in unique-constraint detection (Prisma 7's driver-adapter error shape) was caught by live testing and fixed.
- [x] Build out `src/user/` (controller + service): `me`, list, role update with the last-admin guard, satisfies **AC-7**. Verified live and by unit tests.
- [x] Apply the existing `ArcjetGuard` to every new write endpoint above, satisfies **AC-9**. Already global (`APP_GUARD` in `app.module.ts`) before this build — confirmed it covers the new endpoints via live testing (hit the rate limit mid-verification).
- [x] Add Vitest unit coverage for the service logic and guards above (happy path, the race/conflict cases, and the permission checks from Critical test scenarios). 21 new tests added across `team.service.spec.ts`, `hackathon.service.spec.ts`, `user.service.spec.ts`; also fixed a pre-existing broken test (`auth.controller.spec.ts`, unrelated to this feature). Full suite: 22/22 passing.

## Consequences

**Positive**: the frontend has a complete, real contract to build against; no part of the Prisma schema is left unused by the API.

**Negative / tradeoffs**: the `TeamMember.role` migration from a free text string to an enum needs a backfill (existing `"MEMBER"` rows map cleanly, but this is still a live schema change); a Resend account and verified sending domain must exist before step 2 can ship for real (a console-log stub can unblock local development in the meantime).

**Neutral**: the denormalized `TeamMember.hackathonId` column duplicates data already reachable through `Team`, a deliberate tradeoff for a real DB constraint over an application-only check.

## Follow-up

- [ ] This spec specified `GET /hackathons/:id/teams`; the actual build kept the existing `GET /teams?hackathonId=X` shape instead, since the frontend's `lib/api.ts` already depends on it and changing it would be pure churn with no behavioral difference. Cosmetic only — flagging so this spec's text matches reality.
- [ ] `RESEND_API_KEY` / `RESEND_FROM_EMAIL` are not set yet; verification emails currently log to the console instead of sending. Set these once a Resend account exists.
