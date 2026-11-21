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

## Authentication API

Sessions use a JWT (`{ sub: userId, role }`) stored in an `httpOnly` cookie named `sweety_token` (`SameSite=Lax`,
`Secure` in production, lifetime from `JWT_EXPIRES_IN`). Errors use `{ "error": { "message", "code", "details?" } }`;
validation failures return `400` with `details` mapping each field to its message.

| Method | Path                 | Auth | Body                        | Success                 | Failures                           |
| ------ | -------------------- | ---- | --------------------------- | ----------------------- | ---------------------------------- |
| POST   | `/api/auth/register` | no   | `{ name, email, password }` | `201 { user }` + cookie | `400` validation, `409` email used |
| POST   | `/api/auth/login`    | no   | `{ email, password }`       | `200 { user }` + cookie | `400` validation, `401` bad login  |
| POST   | `/api/auth/logout`   | no   | none                        | `204`, cookie cleared   |                                    |
| GET    | `/api/auth/me`       | yes  | none                        | `200 { user }`          | `401` missing or invalid session   |

Password rules: 8-72 characters with at least one letter and one number. Email is trimmed and lower-cased and is unique
case-insensitively. Login returns the same `401` message for an unknown email and a wrong password, and always runs a bcrypt
comparison so timing does not reveal which accounts exist. Login and register share the stricter rate limiter (20 requests
per 15 minutes per IP), which is switched off when `NODE_ENV=test`.

## Readings API

All readings routes require a logged-in user and every query is scoped to that user. A reading that does not exist, or
belongs to someone else, returns `404 "Reading not found."` so its existence is never revealed. Each reading is returned as
`{ id, date, slot, slotLabel, value, createdAt, updatedAt }`, where `date` is a plain `YYYY-MM-DD` string.

| Method | Path                | Body                     | Success            | Notes                               |
| ------ | ------------------- | ------------------------ | ------------------ | ----------------------------------- |
| GET    | `/api/readings`     | query `?date=YYYY-MM-DD` | `200 { readings }` | Ordered by slot, empty list if none |
| POST   | `/api/readings`     | `{ date, slot, value }`  | `201 { reading }`  |                                     |
| PUT    | `/api/readings/:id` | `{ date, slot, value }`  | `200 { reading }`  | Full replace, same rules as create  |
| DELETE | `/api/readings/:id` | none                     | `204`              |                                     |

Slots, in display order: `morning_fasting` (Morning (fasting)), `after_breakfast` (After breakfast), `after_lunch`
(After lunch), `after_dinner` (After dinner).

### Validation order

Rules run in this order and only the first failure is returned. The error is
`{ error: { message, code, details } }` and `details` is keyed by field (`value`, `date` or `slot`) so the UI can attach the message to the right input.

| #   | Rule                                              | Status | Message                                                |
| --- | ------------------------------------------------- | ------ | ------------------------------------------------------ |
| 1   | Value missing or empty                            | 400    | Please enter a glucose value.                          |
| 2   | Value not a whole number from 40 to 600           | 400    | Value must be between 40 and 600 mg/dl.                |
| 3   | Date missing or not a real `YYYY-MM-DD` date      | 400    | Please choose a valid date.                            |
| 4   | Slot not one of the four keys                     | 400    | Please choose a time slot.                             |
| 5   | Date in the future                                | 400    | Date cannot be in the future.                          |
| 6   | The user already has 4 readings on that date      | 409    | You can add only 4 readings per day.                   |
| 7   | The user already has a reading for that slot/date | 409    | You already have an After lunch reading for this date. |

Rules 6 and 7 exclude the reading being edited, so changing only the value never conflicts, while moving a reading to a taken
slot or a full date does. The database unique constraint on `(user_id, reading_date, slot)` is the final safety net: a race
that slips past rule 7 is mapped to the same 409 message.

### "Today" is computed in Asia/Kolkata

"Future" is judged against the current date in the timezone from the `TZ` setting (`Asia/Kolkata` by default), not UTC or
the server's local zone. A reading logged at 00:30 IST today is accepted even though it is still yesterday in UTC. The client
makes the same assumption when it disables future dates in the calendar.

### Glucose bands are display hints only

The dashboard labels a value below 70 mg/dl as **Low**, 70 to 180 as **In range** and above 180 as **High**. The thresholds
live in one constant (`GLUCOSE_THRESHOLDS` in `client/src/features/readings/readings.constants.ts`). They are visual hints,
not medical advice, and they are not used for any server-side validation. Talk to your doctor about your own targets.

## Server tests and the test database

Server tests run against a real PostgreSQL database named `sweety_test`, separate from the development `sweety` database.
On every `npm test -w server`, `src/tests/globalSetup.ts` creates `sweety_test` if it does not exist (on the same server as
`DATABASE_URL`) and applies all migrations to it. Each test starts with `TRUNCATE users CASCADE` (which also clears readings). Postgres must be running
(`npm run db:up`). The development database is never touched.

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
