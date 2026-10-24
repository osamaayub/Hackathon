# Verify: hackathon platform frontend & backend completion · spec 0001 · updated 2026-10-24

_Steps derived from spec 0001's backend child (`0001-backend-api-completion.md`) acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. Frontend ACs (child `0001-frontend-pages-and-routes.md`) are not yet built, so no steps for those are listed here yet._

## Commands

- [ ] `npx vitest run` → 22/22 tests pass → AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-10, AC-11
- [ ] `npx tsc --noEmit -p tsconfig.json` → no errors → all ACs
- [ ] `npx prisma db push` → "already in sync", no drift → AC-1, AC-3, AC-4

## UI / manual (via HTTP, no frontend yet)

- [ ] `GET /hackathons` with no session → 401 → AC-2 (auth boundary)
- [ ] Sign up, then sign in before verifying → `EMAIL_NOT_VERIFIED` error, sign-in blocked → AC-8
- [ ] Follow the console-logged verification link (`GET /auth/verify-email?token=...`), then sign in → succeeds, `emailVerified: true` on `GET /users/me` → AC-8
- [ ] As a signed-in participant, `GET /hackathons` → only `PUBLISHED`/`CLOSED` hackathons appear, paginated shape (`items`, `page`, `pageSize`, `total`, `totalPages`) → AC-2
- [ ] `POST /teams` with a `DRAFT` hackathon id → 403 → AC-3
- [ ] `POST /teams` for a hackathon the user is already in a team for → 409 "already in a team for this hackathon" → AC-10
- [ ] `POST /teams/:id/join` on a team at its effective `maxTeamSize` → 409 "team is full" → AC-4
- [ ] `POST /teams/:id/leave` as the `LEADER` with other members remaining → the longest-tenured remaining member becomes `LEADER` → AC-5
- [ ] `POST /teams/:id/leave` as the last member → the team is deleted → AC-6
- [ ] `DELETE /teams/:id/members/:userId` as a `MEMBER` (not `LEADER`, not `ADMIN`) → 403 → AC-5
- [ ] `PATCH /users/:id/role` demoting the only remaining `ADMIN` → 409 → AC-7
- [ ] `POST /hackathons`, `GET /users`, `PATCH /users/:id/role` as a non-`ADMIN` → 403 (`AdminGuard`) → AC-1, AC-7
- [ ] Rapid repeated requests from one IP → 429 from `ArcjetGuard` → AC-9

## Acceptance-criteria coverage

- AC-1 (hackathon CRUD, admin only) … covered by the 403 step and `hackathon.service.spec.ts`
- AC-2 (role-scoped visibility) … covered by the 401/pagination step and `hackathon.service.spec.ts`'s `findOne` tests
- AC-3, AC-4 (create/join a team) … covered by the DRAFT-403 and full-team-409 steps and `team.service.spec.ts`
- AC-5 (leader vs member permissions, succession) … covered by the remove-member-403 and leave-succession steps and `team.service.spec.ts`
- AC-6 (empty team auto-delete) … covered by the last-member-leave step and `team.service.spec.ts`
- AC-7 (admin user/role management, last-admin guard) … covered by the demote-409 step and `user.service.spec.ts`
- AC-8 (email verification) … covered by the sign-in-before-verify and verify-then-sign-in steps
- AC-9 (Arcjet on write endpoints) … covered by the rate-limit step (confirmed live during this build)
- AC-10 (one team per hackathon) … covered by the duplicate-team-409 step and `team.service.spec.ts`
- AC-11 (capacity race) … row-locked in code (`SELECT ... FOR UPDATE`); not yet exercised under real concurrency — `/test` should add a concurrent-request test for this specifically, since a sequential manual check can't prove the lock works
