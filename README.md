# Hackathon Backend

A NestJS 11 REST API for managing hackathons, teams, and participants — built on the Express adapter, Prisma ORM 7 (PostgreSQL), and Better Auth for authentication, and Resend for transactional email. Arcjet provides bot/rate-limit protection at the request level, and NestJS Observe provides tracing, metrics, and logging.

## Tech stack

| Concern              | Technology                                   |
| -------------------- | --------------------------------------------- |
| Framework            | NestJS 11 (Express platform)                  |
| Language             | TypeScript (ESM, `type: module`)              |
| Database             | PostgreSQL via Prisma ORM 7 (`@prisma/adapter-pg`) |
| Authentication       | Better Auth (`better-auth` + Prisma adapter)  |
| Email                | Resend (`resend`)                             |
| Frontend             | Next.js 16 + Tailwind 4 + shadcn/ui (`frontend/`) |
| Security / rate limit| Arcjet (`@arcjet/nest`)                       |
| Observability        | `@nestjs/observe`                             |
| Validation           | `class-validator` / `class-transformer`       |
| Testing              | Vitest                                        |
| Linting / formatting | oxlint, Prettier                              |
| Package manager      | Yarn (lockfile committed; npm lockfile also present) |

## Project structure

```
src/
├── app.module.ts              # Root module — wires Observe, Arcjet, Prisma, Mail, Auth and the feature modules
├── main.ts                    # Bootstrap: loads .env, global ValidationPipe, starts HTTP server
├── app.controller.ts / app.service.ts
├── common/
│   ├── guards/
│   │   ├── arcjet.guard.ts    # Global guard — blocks requests Arcjet denies (bots, rate limits)
│   │   ├── auth.guard.ts      # Route guard — requires a valid Better Auth session
│   │   └── admin.guard.ts     # Route guard — requires `Role.ADMIN`
│   ├── pagination.ts
│   ├── prisma-errors.ts
│   └── interceptors/
│       └── logging.interceptor.ts
├── lib/                        # Infrastructure modules (each @Global(), imported once in AppModule)
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts  # Injectable PrismaClient wrapper — never instantiate PrismaClient directly
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.config.ts     # Better Auth configuration
│   │   └── auth.service.ts    # Exposes the Better Auth instance via DI
│   ├── arcjet/
│   │   ├── arcjet.module.ts
│   │   └── arcjet.service.ts
│   └── mail/
│       ├── mail.module.ts
│       └── mail.service.ts    # Resend wrapper; logs to console without RESEND_API_KEY
├── auth/                       # Feature module — auth HTTP surface
│   ├── auth.module.ts
│   ├── auth.controller.ts     # POST /auth/sign-up, /auth/sign-in, /auth/sign-out, /auth/session
│   └── dto/
│       ├── sign-up.dto.ts
│       └── sign-in.dto.ts
├── user/                       # /users — profile + admin role management
├── hackathon/                  # /hackathons — CRUD (admin writes)
├── team/                       # /teams — create, join, leave, manage members
├── submission/                 # one project submission per team
├── task/                       # per-hackathon checklist + team completions
└── schedule/                   # per-hackathon schedule items

frontend/                       # Next.js UI (port 3000)

prisma/
└── schema.prisma               # User, Session, Account, Verification, Hackathon, Team, TeamMember, Submission, Task, TaskCompletion, ScheduleItem
```

New infrastructure integrations follow the same pattern: `src/lib/<name>/<name>.module.ts` + `<name>.service.ts`, marked `@Global()` and imported once in `AppModule`. Feature modules live under `src/<name>/` (not `src/module/<name>/` as CLAUDE.md suggests). Shared guards, interceptors, and decorators live under `src/common/`.

## Data model

Defined in `prisma/schema.prisma`, generated into `generated/prisma`:

- **User** — account record (email, name, image, verification state)
- **Session** — Better Auth session tokens tied to a user
- **Account** — linked auth provider credentials (supports password + OAuth-style fields)
- **Verification** — email verification tokens
- **Hackathon** — an event (title, description, dates, location, max teams)
- **Team** — belongs to a `Hackathon`, unique per `(hackathonId, name)`
- **TeamMember** — join table between `Team` and `User`, carries a `TeamRole` (`LEADER` / `MEMBER`)
- **Submission** — one project link + description per team
- **Task** — an ordered checklist item belonging to a hackathon
- **TaskCompletion** — records a team completing a task (unique per task + team)
- **ScheduleItem** — a titled, timed entry on a hackathon's schedule

Enums: `Role` (`PARTICIPANT`, `ADMIN`), `HackathonStatus` (`DRAFT`, `PUBLISHED`, `CLOSED`), `TeamRole`.

## Getting started

### Prerequisites

- Node.js 20+
- Yarn
- A PostgreSQL database (the project is wired for [Prisma Postgres](https://www.prisma.io/postgres) but any Postgres connection string works)

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment variables

Create a `.env` file in the project root (never commit this file — it's already git-ignored):

```bash
# Database
DATABASE_URL=postgres://<user>:<password>@<host>:5432/<db>?sslmode=require
DIRECT_URL=postgres://<user>:<password>@<host>:5432/<db>?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=<long-random-string>
APP_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000

# Resend (transactional email)
RESEND_API_KEY=<your-resend-key>
RESEND_FROM_EMAIL=onboarding@resend.dev
# Optional: send every email to this inbox instead of the real recipient.
# Needed while using Resend's shared onboarding sender, which only delivers
# to the address that owns the Resend account.
MAIL_OVERRIDE_TO=<your-personal-email>

# Arcjet (bot detection / rate limiting)
ARCJET_ENV=development
ARCJET_KEY=<your-arcjet-key>
ARCJET_MODE=LIVE

# NestJS Observe (optional — tracing/metrics/logging)
OBSERVE_APP_KEY=<your-observe-app-key>
OBSERVE_APP_SECRET=<your-observe-app-secret>

# Server
PORT=8080
```

### 3. Set up the database

```bash
yarn prisma:generate       # generate the Prisma client into generated/prisma
yarn prisma:migrate:dev    # create/apply migrations against DATABASE_URL
```

### 4. Run the app

```bash
yarn start:dev     # watch mode
yarn start         # single run
yarn start:prod    # run compiled dist/main.js (after `yarn build`)
```

The API listens on `http://localhost:8080` by default (or `PORT` from `.env`).

## API

Every request passes through the global `ArcjetGuard` first, which blocks bots and rate-limit violations. `AuthGuard` requires a Better Auth session and attaches `request.user` / `request.session`; `AdminGuard` additionally requires `Role.ADMIN`.

**Auth** (`/auth`)

| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/auth/sign-up`, `/auth/sign-in` | Create an account / sign in with email + password |
| POST | `/auth/sign-out`, `/auth/session` | End the session / fetch the current session |
| GET | `/auth/verify-email` | Complete email verification |
| POST | `/auth/send-verification-email` | Resend the verification email |
| GET | `/auth/sessions` | List your active sessions |
| POST | `/auth/session/revoke`, `/revoke-all`, `/revoke-others` | Revoke sessions |
| GET | `/auth/accounts` | List linked accounts |
| POST | `/auth/account/unlink` | Unlink an account |

**Resources** (auth required unless noted)

| Method | Route | Access | Description |
| ------ | ----- | ------ | ----------- |
| GET / PATCH | `/users/me` | user | Read / update your profile |
| GET | `/users` | admin | List users |
| PATCH | `/users/:id/role` | admin | Change a user's role |
| GET | `/hackathons`, `/hackathons/:id` | user | List / read hackathons |
| POST / PATCH / DELETE | `/hackathons[/:id]` | admin | Manage hackathons |
| GET | `/teams`, `/teams/:id` | public | List / read teams |
| POST | `/teams` | user | Create a team |
| PATCH / DELETE | `/teams/:id` | user | Update / delete a team |
| POST | `/teams/:id/join`, `/teams/:id/leave` | user | Join / leave a team |
| DELETE | `/teams/:id/members/:userId` | user | Remove a member |
| GET / PUT | `/teams/:id/submission` | user | Read / set a team's submission |
| GET | `/hackathons/:id/submissions` | user | Submission gallery |
| GET | `/hackathons/:id/tasks` | user | List tasks |
| POST | `/hackathons/:id/tasks` | admin | Create a task |
| PATCH / DELETE | `/tasks/:id` | admin | Update / delete a task |
| POST / DELETE | `/tasks/:id/complete` | user | Mark / unmark a task complete for your team |
| GET | `/hackathons/:id/schedule` | user | List schedule items |
| POST | `/hackathons/:id/schedule` | admin | Add a schedule item |
| PATCH / DELETE | `/schedule/:id` | admin | Update / delete a schedule item |

## Scripts

| Command                       | Purpose                                      |
| ------------------------------ | --------------------------------------------- |
| `yarn build`                   | Compile with `nest build`                     |
| `yarn start` / `start:dev` / `start:prod` | Run the app (prod / watch / compiled) |
| `yarn lint`                    | Type-aware lint with oxlint                   |
| `yarn format`                  | Format `src/` and `test/` with Prettier       |
| `yarn test` / `test:watch` / `test:cov` | Unit tests via Vitest                 |
| `yarn test:e2e`                | End-to-end tests (separate Vitest config)     |
| `yarn prisma:generate`         | Regenerate the Prisma client                  |
| `yarn prisma:migrate:dev`      | Create and apply a dev migration              |
| `yarn prisma:migrate:deploy`   | Apply pending migrations (CI/production)      |
| `yarn prisma:migrate:reset`    | Drop and recreate the database from migrations|
| `yarn prisma:db:push`          | Push the schema without creating a migration  |
| `yarn prisma:studio`           | Open Prisma Studio                            |

## Frontend

A Next.js app lives in `frontend/` and talks to this API.

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (defaults to `http://localhost:8080`). The backend's `FRONTEND_URL` must match the frontend origin so CORS and auth cookies work. The UI supports light/dark mode via the navbar toggle.

## Email

Verification emails are sent with Resend through `MailService`. With no `RESEND_API_KEY` they are logged to the console instead. Resend's shared `onboarding@resend.dev` sender only delivers to the account owner's own address, so set `MAIL_OVERRIDE_TO` to that address during development, or verify a domain and set `RESEND_FROM_EMAIL` for real delivery.

## Deployment

The project has two deployable parts.

**Backend on Vercel (free, second project):** NestJS runs on Vercel with no extra code because the entry file is `src/main.ts`.

1. In Vercel choose **Add New > Project**, import this repository again, name it `hackathon-backend`, and leave **Root Directory** empty (the repo root). Vercel detects NestJS on its own and runs the `build` script, which generates the Prisma client. Do not add a `vercel.json` at the repo root: the frontend project builds from the same repository and would pick it up.
2. Add the environment variables from [`.env.example`](.env.example) before deploying: `DATABASE_URL`, `ARCJET_KEY`, `RESEND_API_KEY`, `BETTER_AUTH_SECRET`, `FRONTEND_URL`, `APP_BASE_URL`, `CONTACT_TO_EMAIL`, `NODE_ENV=production`, `ARCJET_ENV=production`, `TRUST_PROXY=1`. Do not set `PORT`.
3. Deploy, then open `https://<project>.vercel.app/` and check that it answers.
4. In the frontend project set `BACKEND_URL` to that URL and redeploy.

If requests to the backend return a Vercel sign in page, switch off **Vercel Authentication** under the backend project's Settings > Deployment Protection.

**Backend on Render (recommended, free):** the repository includes a Blueprint, [`render.yaml`](render.yaml).

1. In Render choose **New > Blueprint**, pick this repository and the branch that contains `render.yaml`.
2. Render shows the service `hackathon-backend` and asks for the values marked secret: `DATABASE_URL`, `ARCJET_KEY` and `RESEND_API_KEY`. Copy them from your local `.env`. The auth secret is generated for you.
3. Apply. When the deploy finishes, open the service URL: `GET /` should return 200.
4. In Vercel set `BACKEND_URL` to that service URL (no trailing slash), then redeploy the frontend.

The free plan sleeps after about 15 minutes without traffic, so the first request after a pause is slow.

**Backend (NestJS)** on any other Node host (Railway, Fly, ...):

1. Create a service from this repository, root directory `/`.
2. Build command `npm run build` (generates the Prisma client, then compiles). Start command `npm run start:prod`.
3. Set the variables listed in [`.env.example`](.env.example) in the host's dashboard, including `NODE_ENV=production` and `TRUST_PROXY=1`.
4. On a new database, create the tables once with `npx prisma db push --config prisma7.config.ts`, then optionally `npm run prisma:seed`.
5. Check that `GET /` returns 200 and note the public URL.

**Frontend (Next.js)** on Vercel:

1. Import the repository and set **Root Directory** to `frontend`.
2. Add `BACKEND_URL` (the backend's public URL, no trailing slash) and `NEXT_PUBLIC_SITE_URL` (the Vercel URL), then redeploy.
3. On the backend set `FRONTEND_URL` to the Vercel URL and `APP_BASE_URL` to the Vercel URL plus `/backend`, for example `https://your-app.vercel.app/backend`.

With `BACKEND_URL` set, the browser calls `/backend/...` on the Vercel site and Next.js forwards it to the API. That keeps the sign in cookie first party, so it works even in browsers that block third party cookies. Without `BACKEND_URL` the app calls `NEXT_PUBLIC_API_URL` directly, which is what local development uses.

## Performance: caching and scheduled jobs

**Cache.** `src/lib/cache` is a small cache with a time to live. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (the REST values on your Upstash database page; `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which Vercel's Upstash integration adds, work too) to use Redis over HTTPS, or leave them empty to cache in each server's memory. The `rediss://` address (`REDIS_URL`) is not used. A Redis error never breaks a request: that call is served from memory instead. Open `/health` to see which one is active (`"cache": "redis"` or `"memory"`).

It currently caches the **leaderboard** (`GET /leaderboard`, 5 minutes) and **projects** (`GET /projects`, 2 minutes), which the website used to assemble from about twenty requests. A new submission clears both immediately.

**Scheduled jobs.**

| Job | Schedule | What it does |
| --- | --- | --- |
| `warm-cache` | every 5 minutes | recomputes the leaderboard and projects so nobody waits for a cold cache |
| `cleanup` | hourly | deletes expired sessions and one time tokens |

On a normal server (local, Render, Railway) they run inside the app. A serverless host such as Vercel cannot keep timers alive, so the same jobs are exposed as `POST /cron/:job`, protected by `CRON_SECRET`, and [`.github/workflows/scheduled-jobs.yml`](.github/workflows/scheduled-jobs.yml) calls them. To enable that, create a long random value, set it as `CRON_SECRET` on the backend, and add the same value as a repository secret named `CRON_SECRET`. The backend address defaults to the live one in the workflow; a `BACKEND_URL` secret overrides it.

## Testing

```bash
yarn test        # unit tests
yarn test:e2e     # e2e tests
yarn test:cov     # coverage report
```

## Observability (optional)

The app is pre-instrumented with [NestJS Observe](https://observe.nestjs.com) for distributed tracing, metrics, logging, and error tracking. Create a free account, add an application, and set `OBSERVE_APP_KEY` / `OBSERVE_APP_SECRET` in `.env` to enable it — the app runs fine without them (telemetry simply no-ops).

## Notes on tooling directories

This repo may contain local AI-assistant configuration (`.claude/`, `.agents/`, `.windsurf/`, `.qodo/`) used by various coding assistants during development. These are development tooling, not application code, and are excluded from version control via `.gitignore`.

## License

UNLICENSED — private project.
