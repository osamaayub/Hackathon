# Frontend pages and routes

Part of [0001-hackathon-platform-frontend](index.md). Builds second, against the finished API from [0001-backend-api-completion.md](0001-backend-api-completion.md).

## Summary

This is the page and route plan for the new Next.js app: what screens exist, who can see them, and how they're built. Everything sits behind sign in (no public marketing page for now). Participants browse hackathons, form or join a team, and manage their profile; admins get a separate section to manage hackathons, teams, and users. No visual design exists yet, so this spec proposes a direction (shadcn/ui's default theme) rather than matching an existing one.

## Requirements

**User stories**:
- As a visitor, I want to sign up, verify my email, and sign in so I can use the platform.
- As a participant, I want to browse hackathons and create or join a team so I can take part.
- As a team leader, I want to manage my team from one page so I don't need the admin section.
- As an admin, I want a separate section to manage hackathons, teams, and users.

**Acceptance criteria**:
- **AC-1**: Any route other than `/sign-in`, `/sign-up`, and `/verify-email` redirects an unauthenticated visitor to `/sign-in`.
- **AC-2**: A signed in PARTICIPANT's home page shows the browsable list of `PUBLISHED`/`CLOSED` hackathons.
- **AC-3**: From a hackathon's detail page, a PARTICIPANT can see its teams and create or join one.
- **AC-4**: A PARTICIPANT can view their team's dashboard (members, their own role) and leave it, or, if they are the `LEADER`, edit the team or remove a member.
- **AC-5**: A PARTICIPANT can edit their profile name and resend the verification email if `emailVerified` is false.
- **AC-6**: An ADMIN can reach every `/admin/*` page; a PARTICIPANT who navigates to one is redirected to their own home page before the page renders.
- **AC-7**: An ADMIN can create/edit/delete hackathons (including status), view and delete any team, manage user roles, and see an overview page with basic counts.
- **AC-8**: Every list (hackathons, teams, users) paginates, and shows a loading state, an empty state, and an error state.
- **AC-9**: Every form (sign up, sign in, create hackathon, create team, edit profile) validates with zod before submitting and shows field level errors returned by the API.

## Feature design

**Page composition and routes** (Next.js App Router, route groups for the two shells):

```
app/
  (auth)/sign-in/page.tsx
  (auth)/sign-up/page.tsx
  (auth)/verify-email/page.tsx          # handles the verification link + a resend action
  (app)/layout.tsx                      # participant shell: top nav, requires a session
  (app)/page.tsx                        # hackathon browse (AC-2)
  (app)/hackathons/[id]/page.tsx        # detail: info + teams + join/create (AC-3)
  (app)/teams/[id]/page.tsx             # team dashboard (AC-4)
  (app)/profile/page.tsx                # own profile + resend verification (AC-5)
  (admin)/layout.tsx                    # admin shell: sidebar nav, requires session + role=ADMIN
  (admin)/page.tsx                      # overview/stats (AC-7)
  (admin)/hackathons/page.tsx           # list + create
  (admin)/hackathons/[id]/edit/page.tsx # edit incl. status
  (admin)/teams/page.tsx                # all teams across hackathons
  (admin)/users/page.tsx                # user list + role management
middleware.ts                           # session + role check before any (app)/(admin) route renders
```

**Design direction** (no existing design to match, per the engineer's choice to suggest one): shadcn/ui's default neutral theme, dark mode aware via `prefers-color-scheme`, card based layouts for every list (hackathons, teams, users), a simple top nav for the participant shell and a left sidebar for the admin shell to visually separate the two areas.

**Component inventory** (all net new, built from shadcn/ui primitives):
`AppShell` / `AdminShell` (nav + layout), `HackathonCard`, `HackathonList` (paginated), `TeamCard`, `TeamMemberList`, `RoleBadge`, `CreateHackathonForm`, `EditHackathonForm`, `CreateTeamForm`, `JoinTeamButton`, `UserTable` (admin), `DataTable` (shared paginated table for admin lists), `ConfirmDialog` (destructive actions: delete team/hackathon, remove member), `EmptyState`, `ErrorState`, `LoadingSkeleton`.

**State transitions**: none at the page level; the hackathon/team state machines live in the backend spec. The UI only reflects `status`/`role` values it reads from the API.

**API surface**: none new; every page calls the endpoints defined in [0001-backend-api-completion.md](0001-backend-api-completion.md) through the thin fetch wrapper + TanStack Query, per the umbrella's stack decision.

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| `middleware.ts` role gate on `(admin)/*` | current user's role | the session cookie, read server side via the `better-auth` session check (forwarded automatically with `credentials: 'include'`) |
| Home page hackathon list | which hackathons appear | `GET /hackathons` (the backend already filters by role, per the backend spec's AC-2) |
| Team dashboard | "am I the leader" (shows leader-only actions) | the current user's id matched against the `role` field in `GET /teams/:id`'s members array |
| Profile page | resend-verification button visibility | `emailVerified` from `GET /users/me` |
| Any paginated list | current page / total pages | the `page`/`pageSize` query params echoed back by the API, kept in the URL's search params so pagination state survives a refresh |

**Key invariants**:
- No page fetches or renders data for a role the user does not have; the middleware gate and the backend's own role filtering are both enforced (defense in depth), so a bypassed client side check still returns a 403/404 from the API.
- Every mutation (create/edit/delete/join/leave) shows an optimistic-free pending state and reverts to the TanStack Query cache's last known good value on error, never a half updated UI.

**Security model**: identical to the backend spec's; the frontend adds no new authorization rules, it only reflects them. The middleware role check is a UX convenience (avoids a flash of the wrong shell), not the security boundary; the API's own checks are.

**Configuration required**:
- `NEXT_PUBLIC_API_URL`: the deployed NestJS backend's base URL, used both for API calls and as the `baseURL` passed to `createAuthClient` (see the umbrella's env var list; `better-auth`'s routes are mounted on this same backend, so no separate auth URL is needed).

**Critical test scenarios**:
- Happy path: sign up, verify email, sign in, browse a hackathon, create a team, land on the team dashboard as `LEADER`, verifies **AC-2**, **AC-3**, **AC-4**.
- Failure case: a PARTICIPANT manually navigates to `/admin`, is redirected before the admin shell renders, verifies **AC-6**.
- Auth/permission: an unauthenticated visit to `/profile` redirects to `/sign-in`, verifies **AC-1**.

## Build plan

1. Scaffold the Next.js app in its own repository; install Tailwind v4, shadcn/ui, TanStack Query, react-hook-form + zod, the `better-auth/react` client; configure `NEXT_PUBLIC_API_URL`. Prerequisite for every task below.
2. Build `(auth)` pages (sign in, sign up, verify email) and `middleware.ts`'s session + role gate, satisfies **AC-1**, **AC-6**.
3. Build the participant shell, hackathon browse page, and hackathon detail page with create/join team actions, satisfies **AC-2**, **AC-3**.
4. Build the team dashboard page (members list, leave, and the `LEADER`-only edit/remove-member actions), satisfies **AC-4**.
5. Build the profile page with the resend-verification action, satisfies **AC-5**.
6. Build the admin shell and the hackathon CRUD pages (list, create, edit incl. status), satisfies **AC-7**.
7. Build the admin teams page and the admin users/roles page and the overview page, satisfies **AC-7**.
8. Add pagination, loading/empty/error states across every list, and a Vitest + React Testing Library pass over the forms and the role gate, satisfies **AC-8**, **AC-9**.

## Consequences

**Positive**: participants and admins each get a shell scoped to what they can actually do; no page ever needs to branch heavily on role internally.

**Negative / tradeoffs**: two separate layouts (`(app)` and `(admin)`) mean some shared UI (nav patterns, page headers) is duplicated rather than fully unified; acceptable at this scope, revisit if a third role shell is ever needed.

**Neutral**: the chosen design direction (shadcn/ui default theme) is a placeholder aesthetic; swapping it for real branding later only touches Tailwind config and theme tokens, not component logic.
