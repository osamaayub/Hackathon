# Hackathon Backend

A NestJS 11 REST API for managing hackathons, teams, and participants — built on the Express adapter, Prisma ORM 7 (PostgreSQL), and Better Auth for authentication. Arcjet provides bot/rate-limit protection at the request level, and NestJS Observe provides tracing, metrics, and logging.

## Tech stack

| Concern              | Technology                                   |
| -------------------- | --------------------------------------------- |
| Framework            | NestJS 11 (Express platform)                  |
| Language             | TypeScript (ESM, `type: module`)              |
| Database             | PostgreSQL via Prisma ORM 7 (`@prisma/adapter-pg`) |
| Authentication       | Better Auth (`better-auth` + Prisma adapter)  |
| Security / rate limit| Arcjet (`@arcjet/nest`)                       |
| Observability        | `@nestjs/observe`                             |
| Validation           | `class-validator` / `class-transformer`       |
| Testing              | Vitest                                        |
| Linting / formatting | oxlint, Prettier                              |
| Package manager      | Yarn (lockfile committed; npm lockfile also present) |

## Project structure

```
src/
├── app.module.ts              # Root module — wires Observe, Arcjet, Prisma, Auth, User, Hackathon
├── main.ts                    # Bootstrap: loads .env, global ValidationPipe, starts HTTP server
├── app.controller.ts / app.service.ts
├── common/
│   ├── guards/
│   │   ├── arcjet.guard.ts    # Global guard — blocks requests Arcjet denies (bots, rate limits)
│   │   └── auth.guard.ts      # Route guard — requires a valid Better Auth session
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
│   └── arcjet/
│       ├── arcjet.module.ts
│       └── arcjet.service.ts
├── auth/                       # Feature module — auth HTTP surface
│   ├── auth.module.ts
│   ├── auth.controller.ts     # POST /auth/sign-up, /auth/sign-in, /auth/sign-out, /auth/session
│   └── dto/
│       ├── sign-up.dto.ts
│       └── sign-in.dto.ts
├── user/
│   └── user.module.ts
└── hackathon/
    └── hackathon.module.ts

prisma/
└── schema.prisma               # User, Session, Account, Verification, Hackathon, Team, TeamMember
```

New infrastructure integrations follow the same pattern: `src/lib/<name>/<name>.module.ts` + `<name>.service.ts`, marked `@Global()` and imported once in `AppModule`. Feature modules live under `src/<name>/`. Shared guards, interceptors, and decorators live under `src/common/`.

## Data model

Defined in `prisma/schema.prisma`, generated into `generated/prisma`:

- **User** — account record (email, name, image, verification state)
- **Session** — Better Auth session tokens tied to a user
- **Account** — linked auth provider credentials (supports password + OAuth-style fields)
- **Verification** — email verification tokens
- **Hackathon** — an event (title, description, dates, location, max teams)
- **Team** — belongs to a `Hackathon`, unique per `(hackathonId, name)`
- **TeamMember** — join table between `Team` and `User`, carries a `role`

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
BETTER_AUTH_API_KEY=<your-better-auth-key>

# Arcjet (bot detection / rate limiting)
ARCJET_ENV=development
ARCJET_KEY=<your-arcjet-key>
ARCJET_MODE=LIVE

# NestJS Observe (optional — tracing/metrics/logging)
OBSERVE_APP_KEY=<your-observe-app-key>
OBSERVE_APP_SECRET=<your-observe-app-secret>

# Server
PORT=3000
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

The API listens on `http://localhost:3000` by default (or `PORT` from `.env`).

## API

| Method | Route            | Description                              |
| ------ | ---------------- | ----------------------------------------- |
| POST   | `/auth/sign-up`   | Create an account (email, password, name) |
| POST   | `/auth/sign-in`   | Sign in with email + password             |
| POST   | `/auth/sign-out`  | Invalidate the current session            |
| POST   | `/auth/session`   | Fetch the current session, if any         |

Every request passes through the global `ArcjetGuard` first, which blocks bots and rate-limit violations before hitting a controller. Routes that require an authenticated user apply `AuthGuard`, which reads the Better Auth session and attaches `request.user` / `request.session`.

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
