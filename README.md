# Sweety

A blood glucose tracker: Node/Express + PostgreSQL + React, in an npm workspaces monorepo.

| Workspace | Stack                                                                |
| --------- | -------------------------------------------------------------------- |
| `server/` | Express 5, PostgreSQL (`pg`), Zod, pino, node-pg-migrate, Vitest     |
| `client/` | React 19, Vite, Tailwind v4, shadcn/ui, TanStack Query, Vitest + RTL |

## Prerequisites

- Node.js 22+ (`.nvmrc` pins 24)
- Docker (for PostgreSQL 16 and Redis 7)

## Install

```bash
npm install
cp .env.example .env
```

Open `.env` and set `JWT_SECRET` (at least 32 characters). The server refuses to boot otherwise.
Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`npm install` also installs the git hooks (husky). On every commit, lint-staged runs ESLint and Prettier on staged files.

## Database setup

```bash
npm run db:up        # start postgres + redis and wait until both are healthy
npm run db:migrate   # apply migrations in server/migrations
npm run db:down      # stop the containers (data is kept in named volumes)
```

Postgres is published on host port **5434** and Redis on **6380** (see Notes). Credentials are the dev defaults in
`docker-compose.yml` and `.env.example`.

## Run

```bash
npm run dev                  # server (http://localhost:4000) and client (http://localhost:5173) together
npm run dev -w server        # server only (tsx watch)
npm run dev -w client        # client only (Vite; proxies /api to http://localhost:4000)
```

Health check: `curl http://localhost:4000/api/health` returns `{"status":"ok","db":"up"}`, or `503` with
`{"status":"degraded","db":"down"}` when PostgreSQL is unreachable.

## Test, lint, build

```bash
npm test             # server (Vitest + Supertest) and client (Vitest + Testing Library)
npm run test -w server
npm run test -w client
npm run lint         # ESLint, zero warnings allowed
npm run format       # Prettier
npm run build        # type-check and build both workspaces
npm run start -w server   # run the built server (after npm run build)
```

## Environment variables

| Variable         | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `NODE_ENV`       | `development`, `test` or `production`            |
| `PORT`           | Server port (default 4000)                       |
| `CLIENT_URL`     | The only origin allowed by CORS (credentials on) |
| `DATABASE_URL`   | PostgreSQL connection string                     |
| `REDIS_URL`      | Redis connection string                          |
| `JWT_SECRET`     | Signing secret, minimum 32 characters            |
| `JWT_EXPIRES_IN` | Token lifetime, for example `15m`                |
| `TZ`             | Process timezone (default `Asia/Kolkata`)        |

All variables are validated with Zod in `server/src/config/env.ts`. A missing or invalid value stops the server at startup.

## Server conventions

- **Parameterised queries only.** Never build SQL by concatenating or interpolating user input; pass values as
  parameters (`pool.query('SELECT * FROM t WHERE id = $1', [id])`).
- Errors are thrown as `AppError` and rendered by one handler as `{ "error": { "message", "code" } }`. Stack traces are never sent to clients.
- Security baseline: helmet (default CSP), CORS restricted to `CLIENT_URL`, a global rate limit, a stricter limiter mounted on `/api/auth/*`, a 10kb JSON body limit, hpp, and `x-powered-by` disabled.
- Feature code lives in `server/src/modules/<feature>/` (routes + controller), added as features arrive.

## Notes

- **Host ports.** Compose maps Postgres to `5434` and Redis to `6380` instead of `5432` and `6379`, because those defaults are
  commonly taken by a local PostgreSQL install or other containers. Change both `docker-compose.yml` and `.env` together if you need different ports.
- **shadcn/ui.** Installed components: button, input, label, card, dialog, select, calendar, popover, skeleton.
  The registry's `form` entry is empty in the current shadcn style, which replaced it with `field`, so `form` is not installed.
  Components in `client/src/components/ui` are generated and excluded from ESLint.
- **Redis and BullMQ** are installed and configured via `REDIS_URL`, but nothing uses them yet.
- **Dependency audit.** `npm audit` reports moderate advisories in `glob`/`minimatch` pulled in by `node-pg-migrate`, a dev-only CLI
  that is not part of the running server. The only suggested fix is a downgrade, so it is left as is.
