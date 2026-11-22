# Sweety

Sweety is a blood glucose tracker. A patient signs up, logs up to four readings a day (morning fasting, after breakfast,
after lunch, after dinner) and reviews them as a daily summary, a month-to-date report with a chart, and a previous-month
report. The backend is Node, Express and PostgreSQL, the frontend is React, and both live in one npm workspaces monorepo.

## Table of contents

1. [Screenshots](#screenshots)
2. [Features](#features)
3. [Tech stack and architecture](#tech-stack-and-architecture)
4. [Prerequisites and quick start](#prerequisites-and-quick-start)
5. [Docker quick start](#docker-quick-start)
6. [Environment variables](#environment-variables)
7. [Database and migrations](#database-and-migrations)
8. [Running the tests](#running-the-tests)
9. [API reference](#api-reference)
10. [Validation rules](#validation-rules)
11. [Report definitions](#report-definitions)
12. [Security notes](#security-notes)
13. [Notes](#notes)

## Screenshots

The images below live in [`docs/screenshots/`](docs/screenshots/README.md). Until they are added, GitHub shows them as broken
images.

| Screen                                | Image                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Login                                 | ![Login](docs/screenshots/01-login.png)                                   |
| Dashboard with the four reading slots | ![Dashboard](docs/screenshots/02-dashboard-readings.png)                  |
| Add reading dialog showing validation | ![Add reading validation](docs/screenshots/03-add-reading-validation.png) |
| Daily report                          | ![Daily report](docs/screenshots/04-daily-report.png)                     |
| Month-to-date report with chart       | ![Month to date chart](docs/screenshots/05-month-to-date-chart.png)       |
| Previous month report                 | ![Previous month](docs/screenshots/06-previous-month.png)                 |
| History page with pagination          | ![History pagination](docs/screenshots/07-history-pagination.png)         |
| Mobile layout                         | ![Mobile](docs/screenshots/08-mobile.png)                                 |

## Features

**Core**

- [x] Sign up, log in, log out and a `/me` endpoint, with a JWT in an `httpOnly` cookie
- [x] Log readings in four fixed slots per day, with add, edit and delete
- [x] Server-side validation with exact messages: value 40 to 600 mg/dl, a real date that is not in the future, one reading per slot, at most four per day
- [x] Every reading is private to its owner (per-user isolation on every query)
- [x] Daily, month-to-date and previous-month reports: highest, lowest, average (one decimal) and count
- [x] Dashboard with a date picker, previous/next day, and a "n of 4 readings" progress indicator
- [x] Low / In range / High badges as display hints (shown as text as well as colour)

**Bonus tasks completed**

- [x] Pagination: `GET /api/readings` is paginated, and a History page shows all readings with page and page-size controls kept in the URL
- [x] Charts: a Recharts line chart of the daily average for month-to-date and previous month, with reference lines at 70 and 180
- [x] Docker: server and client images, run together with `docker compose --profile full up`
- [x] Frontend tests: React Testing Library tests for the login form, the add/edit reading form, reports, history pagination and cache handling

**Also included**

- [x] Idempotent demo seed (`npm run seed`) with a demo account
- [x] GitHub Actions CI (lint, format check, build, tests against PostgreSQL 16)
- [x] Reduced-motion support and keyboard-visible focus (see [Notes](#notes))

**Not implemented**

- [ ] Redis caching, BullMQ background jobs, a doctor role with doctor features and a 3D gauge. `ioredis` and `bullmq` are installed and `REDIS_URL` is required, but no code uses Redis yet. The `users.role` column allows `doctor`, but every account is a `patient`.

## Tech stack and architecture

| Area     | Technology                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Server   | Node 24, Express 5, PostgreSQL 16 (`pg`), Zod 4, bcrypt, jsonwebtoken, helmet, express-rate-limit, pino   |
| Database | PostgreSQL 16, migrations with node-pg-migrate                                                            |
| Client   | React 19, Vite 8, Tailwind CSS 4, shadcn/ui on Base UI, React Router 7, TanStack Query 5, React Hook Form |
| Charts   | Recharts 3                                                                                                |
| Motion   | Motion 14, NumberFlow, AutoAnimate                                                                        |
| Tests    | Vitest, Supertest (server), React Testing Library and user-event (client)                                 |
| Tooling  | ESLint (flat config), Prettier, husky and lint-staged, GitHub Actions                                     |

The server is layered per feature. A route validates input and calls a controller, the controller handles HTTP only, the
service holds the rules, and the repository holds the SQL (always parameterised). One error handler turns everything into
`{ "error": { "message", "code", "details?" } }`. The client talks to the API through one axios instance and TanStack Query
hooks, and the Vite dev server proxies `/api` to the API.

```
sweety/
├─ package.json            npm workspaces and root scripts
├─ docker-compose.yml      postgres + redis, and server + client behind the "full" profile
├─ .env.example            every environment variable, documented
├─ .github/workflows/      ci.yml
├─ docs/screenshots/       screenshots to add (see its README)
├─ server/
│  ├─ Dockerfile, docker-entrypoint.sh
│  ├─ migrations/          users and readings tables
│  ├─ scripts/seed.ts      thin CLI wrapper for the demo seed
│  └─ src/
│     ├─ app.ts, server.ts
│     ├─ config/           env.ts (Zod-validated environment)
│     ├─ db/               pg pool
│     ├─ lib/, utils/      AppError, logger, schema parsing, date helpers
│     ├─ middleware/       error handler, rate limiters, validate
│     ├─ modules/          auth, readings, reports, health (routes, controller, service, repository, schemas)
│     ├─ seed/             demo data generator and seed function
│     └─ tests/            Vitest and Supertest tests
└─ client/
   ├─ Dockerfile, nginx.conf
   └─ src/
      ├─ app/              providers and router
      ├─ components/       ui (shadcn), layout, form
      ├─ features/         auth, readings, reports (api, hooks, schemas, components)
      ├─ pages/            Login, Signup, Dashboard, History, NotFound
      ├─ hooks/, lib/      shared hooks, API client, date and motion helpers
      └─ test/             test setup
```

## Prerequisites and quick start

You need Node.js 22 or newer (`.nvmrc` pins 24) and Docker, which provides PostgreSQL and Redis.

```bash
# 1. Install dependencies for both workspaces
npm install

# 2. Create your environment file and set JWT_SECRET (32+ characters)
cp .env.example .env            # Windows: copy .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# paste the output after JWT_SECRET= in .env

# 3. Start PostgreSQL 16 and Redis 7 (waits until both are healthy)
npm run db:up

# 4. Create the tables
npm run db:migrate

# 5. Load demo data (optional but recommended)
npm run seed

# 6. Run the API and the client together
npm run dev
```

| What         | URL                              |
| ------------ | -------------------------------- |
| Client       | http://localhost:5173            |
| API          | http://localhost:4000            |
| Health check | http://localhost:4000/api/health |

**Demo login** (created by `npm run seed`): `demo@sweety.app` / `Demo@1234`. This is a published demo credential, not a
secret. You can also create your own account on the sign-up page.

Useful scripts, all run from the repository root:

| Script                 | What it does                                                 |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | API (tsx watch) and client (Vite) together                   |
| `npm run build`        | Type-check and build both workspaces                         |
| `npm run lint`         | ESLint with zero warnings allowed                            |
| `npm run format`       | Prettier, write                                              |
| `npm run format:check` | Prettier, check only                                         |
| `npm test`             | Server and client tests                                      |
| `npm run verify`       | Lint, format check, build and tests in one go (what CI runs) |
| `npm run db:up`        | Start only PostgreSQL and Redis                              |
| `npm run db:down`      | Stop them (data stays in named volumes)                      |
| `npm run db:migrate`   | Apply database migrations                                    |
| `npm run seed`         | Create or reset the demo user and its readings               |

PostgreSQL is published on host port **5434** and Redis on **6380**, not the usual 5432 and 6379, so they do not clash with a
local installation. If you change them, change `docker-compose.yml` and `.env` together.

## Docker quick start

The `full` compose profile runs the whole app: PostgreSQL, Redis, the API and the client behind nginx. Without the profile,
`npm run db:up` still starts only PostgreSQL and Redis.

```bash
cp .env.example .env            # then set JWT_SECRET in .env (32+ characters)
docker compose --profile full up --build -d --wait
```

Then open **http://localhost:8080**. nginx serves the built client, falls back to `index.html` for client routes, and proxies
`/api` to the server container. The server runs the migrations every time it starts.

Load the demo data inside the running container:

```bash
docker compose exec -e ALLOW_DEMO_SEED=true server npm run seed
```

The stack runs the API with `NODE_ENV=production`, and the seed refuses to run in production unless `ALLOW_DEMO_SEED=true` is
set, hence the flag. Stop it with `docker compose --profile full down` (add `-v` to delete the database volume as well).

Things to know:

- `JWT_SECRET`, `JWT_EXPIRES_IN` and `TZ` are read from your `.env`. If `JWT_SECRET` is empty the server container exits with
  a message saying so. Everything else (database URLs, `CLIENT_URL=http://localhost:8080`, `COOKIE_SECURE=false`,
  `TRUST_PROXY=1`) is set in `docker-compose.yml`.
- `COOKIE_SECURE=false` is needed because the stack is served over plain `http://localhost`. Behind HTTPS leave it unset.
- The server image runs as the non-root `node` user and has a health check on `/api/health`. The client image runs the
  unprivileged nginx image and sets a Content-Security-Policy, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy` and `Permissions-Policy`.
- The compose file uses the development database password `sweety_dev_password`. Change it before exposing the stack anywhere.

## Environment variables

Copy `.env.example` to `.env`. The server reads these variables (nothing else), validates them with Zod in
`server/src/config/env.ts` and refuses to start when one is missing or invalid. The client reads none. A test fails if
`.env.example` and the schema ever disagree.

| Variable          | Purpose                                                                                                                                                                                                        | Example                                                       | Required / default                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`        | Runtime mode: development, test or production.                                                                                                                                                                 | `development`                                                 | optional, default `development`                      |
| `PORT`            | Port the API listens on.                                                                                                                                                                                       | `4000`                                                        | optional, default `4000`                             |
| `CLIENT_URL`      | The only origin allowed by CORS (credentials are enabled). Matches the Vite dev server.                                                                                                                        | `http://localhost:5173`                                       | required                                             |
| `DATABASE_URL`    | PostgreSQL connection string. Docker compose publishes Postgres on host port 5434.                                                                                                                             | `postgres://sweety:sweety_dev_password@localhost:5434/sweety` | required                                             |
| `REDIS_URL`       | Redis connection string. Docker compose publishes Redis on host port 6380. No feature uses it yet.                                                                                                             | `redis://localhost:6380`                                      | required                                             |
| `JWT_SECRET`      | Secret used to sign auth tokens, minimum 32 characters. Left empty on purpose so the server refuses to start until you set it.                                                                                 | _(empty on purpose)_                                          | required, 32+ characters                             |
| `JWT_EXPIRES_IN`  | Token and cookie lifetime, for example 15m or 1h.                                                                                                                                                              | `15m`                                                         | required                                             |
| `TZ`              | Time zone used to decide what "today" is (future-date checks, seed data).                                                                                                                                      | `Asia/Kolkata`                                                | optional, default `Asia/Kolkata`                     |
| `COOKIE_SECURE`   | Send the auth cookie over HTTPS only. Defaults to true when NODE_ENV=production, otherwise false. Set it to false to run a production build over plain http://localhost (the Docker "full" profile does this). | `false`                                                       | optional, default `true` in production, else `false` |
| `TRUST_PROXY`     | How many reverse proxies sit in front of the API (0 when none). Set to 1 behind the bundled nginx so rate limiting sees real client IPs.                                                                       | `0`                                                           | optional, default `0`                                |
| `ALLOW_DEMO_SEED` | Lets "npm run seed" run when NODE_ENV=production. Only for throwaway demo stacks; leave false everywhere else.                                                                                                 | `false`                                                       | optional, default `false`                            |

## Database and migrations

Migrations live in `server/migrations` and run with `npm run db:migrate` (the Docker server runs them on startup). Both have a
working `down`.

**`users`**: `id` (uuid, generated), `name`, `email`, `password_hash`, `role` (`patient` or `doctor`, default `patient`),
`created_at`. A unique index on `lower(email)` makes emails unique regardless of letter case.

**`readings`**: `id` (uuid, generated), `user_id` (references `users`, deleted with the user), `reading_date` (a `date`),
`slot` (`morning_fasting`, `after_breakfast`, `after_lunch` or `after_dinner`), `value` (integer, 40 to 600),
`created_at`, `updated_at`. There is an index on `(user_id, reading_date)`.

**Why `UNIQUE (user_id, reading_date, slot)`?** The product rule is one reading per slot per day. The service checks it first
so it can return a friendly 409, but two simultaneous requests could both pass that check. The database constraint is the final
safety net: a violation (`23505`) is caught and mapped to the same 409 message. With four slots it also means a day can never
hold more than four readings.

`DATE` columns are returned as plain `YYYY-MM-DD` strings (a pg type parser in `server/src/db/pool.ts`), so a time zone can
never shift a reading to a different day.

## Running the tests

```bash
npm test                  # server and client
npm run test -w server    # server only
npm run test -w client    # client only
npm run verify            # lint, format check, build and tests
```

Server tests need PostgreSQL (`npm run db:up`). They use a separate `sweety_test` database on the same server: a global setup
creates it if needed and applies the real migrations, and each test starts with `TRUNCATE users CASCADE`. Your development
database is never touched. Current totals: 143 server tests and 38 client tests.

| Where  | File                         | Covers                                                                                     |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------ |
| server | `auth.test.ts`               | register, login, logout, `/me`, hashed passwords, duplicate emails, identical 401s         |
| server | `readings.test.ts`           | create, update, delete, every validation rule and message, IST "today", per-user isolation |
| server | `readingsPagination.test.ts` | page and limit defaults, ordering, out-of-range pages, invalid values, isolation           |
| server | `reports.test.ts`            | report maths and rounding, date ranges end to end, empty state, isolation, validation      |
| server | `reportRange.test.ts`        | the date-range helper (January, leap years, month ends)                                    |
| server | `date.test.ts`               | the IST "today" helper around midnight, calendar-date checks                               |
| server | `seed.test.ts`               | seed idempotency, rules, other users untouched, production guard                           |
| server | `cookieSecure.test.ts`       | the `COOKIE_SECURE` flag and its defaults                                                  |
| server | `envExample.test.ts`         | `.env.example` lists exactly the variables the server reads                                |
| server | `health.test.ts`             | health endpoint, 404 shape, no `x-powered-by`                                              |
| client | `LoginPage.test.tsx`         | login form validation and submission                                                       |
| client | `ReadingDialog.test.tsx`     | add and edit form: validation, boundaries, server errors on the right field, pending state |
| client | `ReportsSection.test.tsx`    | report values and badges, tab switching, empty state, error and retry                      |
| client | `HistoryPage.test.tsx`       | pagination, URL parameters, fallbacks, empty state                                         |
| client | `useReadings.test.tsx`       | reading changes refresh the reports and readings queries                                   |
| client | `useAuth.test.tsx`           | cached user data is discarded on login and logout                                          |
| client | `readings.constants.test.ts` | glucose band boundaries                                                                    |

## API reference

All paths are under `/api`. Request and response bodies are JSON. Authenticated routes read the `sweety_token` cookie, so
send requests with credentials (`curl -b cookiejar`, `fetch(..., { credentials: 'include' })`).

Every error has the same shape: `{ "error": { "message": "...", "code": "...", "details": { "field": "message" } } }`
(`details` only appears for validation and slot conflicts). Codes you can get: `VALIDATION_ERROR`, `EMAIL_TAKEN`,
`INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `SLOT_TAKEN`, `DAILY_LIMIT_REACHED`, `READING_NOT_FOUND`, `NOT_FOUND`,
`RATE_LIMITED`, `PAYLOAD_TOO_LARGE`, `INVALID_JSON` and `INTERNAL_ERROR`.

| Method | Path                 | Auth | Purpose                                        |
| ------ | -------------------- | ---- | ---------------------------------------------- |
| GET    | `/api/health`        | no   | API and database status                        |
| POST   | `/api/auth/register` | no   | Create an account and log in                   |
| POST   | `/api/auth/login`    | no   | Log in                                         |
| POST   | `/api/auth/logout`   | no   | Clear the cookie                               |
| GET    | `/api/auth/me`       | yes  | The current user                               |
| PATCH  | `/api/users/me`      | yes  | Change your gender (`male`, `female`, `other`) |
| GET    | `/api/readings`      | yes  | List readings (paginated, optional date)       |
| POST   | `/api/readings`      | yes  | Create a reading                               |
| PUT    | `/api/readings/:id`  | yes  | Replace a reading                              |
| DELETE | `/api/readings/:id`  | yes  | Delete a reading                               |
| GET    | `/api/reports`       | yes  | Daily, month-to-date or previous-month report  |

### Health

`GET /api/health` returns `200 {"status":"ok","db":"up"}`, or `503 {"status":"degraded","db":"down"}` when PostgreSQL is
unreachable.

### Auth

`POST /api/auth/register` with `{ "name", "email", "password", "dateOfBirth", "gender" }` returns `201`, sets the cookie and returns the user. The
password hash is never returned. `gender` is `"male"` or `"female"` and is required for new sign-ups ("Please choose a gender."); the user object
returned by register, login and `/me` includes it. `PATCH /api/users/me` with `{ "gender" }` returns `200 { user }` and only ever changes the caller's own row.

```json
{
  "user": {
    "id": "90af9c08-55d9-400d-b65f-8c6515be887d",
    "name": "Asha Rao",
    "email": "asha@example.com",
    "role": "patient"
  }
}
```

Errors: `400` validation, `409 {"error":{"message":"An account with this email already exists.","code":"EMAIL_TAKEN"}}`.

```json
{
  "error": {
    "message": "Please correct the highlighted fields.",
    "code": "VALIDATION_ERROR",
    "details": {
      "name": "Name is required",
      "email": "Enter a valid email address",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

`POST /api/auth/login` with `{ "email", "password" }` returns `200` with the same `{ user }` body and sets the cookie. Any
failure returns `401 {"error":{"message":"Invalid email or password.","code":"INVALID_CREDENTIALS"}}`, the same for an
unknown email and a wrong password.

`POST /api/auth/logout` returns `204` and clears the cookie. `GET /api/auth/me` returns `200 { user }`, or
`401 {"error":{"message":"Authentication required.","code":"UNAUTHENTICATED"}}` without a valid cookie.

The cookie is `sweety_token`, `HttpOnly`, `SameSite=Lax`, `Path=/`, with `Max-Age` equal to `JWT_EXPIRES_IN` and `Secure`
according to `COOKIE_SECURE`.

### Readings

A reading is returned as `{ id, date, slot, slotLabel, value, createdAt, updatedAt }`. Slots, in display order:
`morning_fasting` (Morning (fasting)), `after_breakfast` (After breakfast), `after_lunch` (After lunch), `after_dinner`
(After dinner). A reading that does not exist, or belongs to someone else, returns
`404 {"error":{"message":"Reading not found.","code":"READING_NOT_FOUND"}}`, so its existence is never revealed.

`POST /api/readings` with `{ "date": "2026-10-14", "slot": "after_dinner", "value": 140 }` returns `201`:

```json
{
  "reading": {
    "id": "516b27e4-52ae-4abd-8648-218f419f1874",
    "date": "2026-10-14",
    "slot": "after_dinner",
    "value": 140,
    "createdAt": "2026-11-21T13:43:56.110Z",
    "updatedAt": "2026-11-21T13:43:56.110Z",
    "slotLabel": "After dinner"
  }
}
```

`PUT /api/readings/:id` takes the same body and returns `200 { reading }`. It follows the same rules as create, except that
the reading being edited is ignored when counting readings and checking the slot. `DELETE /api/readings/:id` returns `204`.

`GET /api/readings` always returns an envelope:

| Query   | Default | Rule                                 |
| ------- | ------- | ------------------------------------ |
| `date`  | none    | Optional `YYYY-MM-DD`; only that day |
| `page`  | `1`     | Whole number, 1 or more              |
| `limit` | `20`    | Whole number, 1 to 100               |

Without `date` it returns all of your readings, newest date first and then slot order. With `GET /api/readings?date=2026-10-15`:

```json
{
  "data": [
    {
      "id": "b5b8e99d-...",
      "date": "2026-10-15",
      "slot": "morning_fasting",
      "value": 95,
      "slotLabel": "Morning (fasting)",
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "e793918d-...",
      "date": "2026-10-15",
      "slot": "after_lunch",
      "value": 182,
      "slotLabel": "After lunch",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}
```

A page past the last one returns `data: []` with the correct `meta`. `totalPages` is `0` when there are no readings.

Example errors:

```json
{ "error": { "message": "Value must be between 40 and 600 mg/dl.", "code": "VALIDATION_ERROR", "details": { "value": "Value must be between 40 and 600 mg/dl." } } }
{ "error": { "message": "You already have an After dinner reading for this date.", "code": "SLOT_TAKEN", "details": { "slot": "You already have an After dinner reading for this date." } } }
```

### Reports

`GET /api/reports?type=daily|mtd|monthly&date=YYYY-MM-DD`. Example with `date=2026-10-15`, `type=mtd`, for a user with readings
on 1, 10, 14 and 15 October:

```json
{
  "type": "mtd",
  "from": "2026-10-01",
  "to": "2026-10-15",
  "count": 5,
  "highest": 182,
  "lowest": 95,
  "average": 133.4,
  "days": [
    { "date": "2026-10-01", "average": 100, "lowest": 100, "highest": 100, "count": 1 },
    { "date": "2026-10-10", "average": 150, "lowest": 150, "highest": 150, "count": 1 },
    { "date": "2026-10-14", "average": 140, "lowest": 140, "highest": 140, "count": 1 },
    { "date": "2026-10-15", "average": 138.5, "lowest": 95, "highest": 182, "count": 2 }
  ]
}
```

`daily` returns `readings: [{ id, slot, slotLabel, value, date }]` in slot order instead of `days`. `highest`, `lowest` and
`average` are `null` when `count` is `0`. Errors are `400` with the messages in the next section.

## Validation rules

Errors are returned as `400` (bad input) or `409` (conflict). For readings and reports only the **first** failing rule is
returned, checked in this order:

| #   | Rule (readings: create and update)                                | Status | Message                                                     |
| --- | ----------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| 1   | Value missing or empty                                            | 400    | Please enter a glucose value.                               |
| 2   | Value not a whole number from 40 to 600                           | 400    | Value must be between 40 and 600 mg/dl.                     |
| 3   | Date missing or not a real `YYYY-MM-DD` date                      | 400    | Please choose a valid date.                                 |
| 4   | Slot not one of the four keys                                     | 400    | Please choose a time slot.                                  |
| 5   | Date after today in Asia/Kolkata                                  | 400    | Date cannot be in the future.                               |
| 6   | The user already has 4 readings on that date (excluding this one) | 409    | You can add only 4 readings per day.                        |
| 7   | The user already has a reading in that slot on that date          | 409    | You already have a Morning (fasting) reading for this date. |

Rule 7 uses the slot label with the right article: "a Morning (fasting)", "an After breakfast", "an After lunch" or "an After
dinner". Rule 6 is checked before rule 7. On update, the reading being edited is excluded from both checks, so changing only the
value never conflicts, while moving it to a taken slot or a full date does.

| Endpoint            | Rule                                     | Status | Message                                         |
| ------------------- | ---------------------------------------- | ------ | ----------------------------------------------- |
| `GET /api/readings` | `date` present but not a real date       | 400    | Please choose a valid date.                     |
| `GET /api/readings` | `page` not a whole number of 1 or more   | 400    | Page must be a whole number of 1 or more.       |
| `GET /api/readings` | `limit` not a whole number from 1 to 100 | 400    | Limit must be a whole number between 1 and 100. |
| `GET /api/reports`  | `type` not `daily`, `mtd` or `monthly`   | 400    | Please choose a valid report type.              |
| `GET /api/reports`  | `date` missing or not a real date        | 400    | Please choose a valid date.                     |
| `GET /api/reports`  | `date` in the future (Asia/Kolkata)      | 400    | Date cannot be in the future.                   |

Auth (`POST /api/auth/register` returns the first message for **each** invalid field in `details`):

| Field    | Rules                                              | Messages                                                                                                                                                                                       |
| -------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | trimmed, 2 to 60 characters                        | Name is required / Name must be at least 2 characters / Name must be at most 60 characters                                                                                                     |
| email    | trimmed, lower-cased, valid address                | Email is required / Enter a valid email address                                                                                                                                                |
| password | 8 to 72 characters, at least one letter and number | Password is required / Password must be at least 8 characters / Password must be at most 72 characters / Password must contain at least one letter / Password must contain at least one number |

`POST /api/auth/login` only requires an email and a non-empty password ("Password is required"). Requests over the limits return
`429 {"error":{"message":"Too many requests, please try again later","code":"RATE_LIMITED"}}`, bodies over 10 KB return `413`
(`PAYLOAD_TOO_LARGE`) and malformed JSON returns `400` (`INVALID_JSON`).

## Report definitions

All reports are for the logged-in user and are based on the selected date. Take the selected date **15 Oct 2026**:

| Report         | `type`    | Range                                                     | Example              |
| -------------- | --------- | --------------------------------------------------------- | -------------------- |
| Daily          | `daily`   | The selected date only                                    | 15 Oct 2026          |
| Month to date  | `mtd`     | The 1st of the selected date's month up to the date       | 1 Oct to 15 Oct 2026 |
| Previous month | `monthly` | The whole calendar month before the selected date's month | 1 Sep to 30 Sep 2026 |

Edge cases: a January date gives the previous December of the previous year, `2028-03-01` gives 1 to 29 February, and
month-to-date on the 1st is a single day. The range maths works on `YYYY-MM-DD` strings with UTC calendar arithmetic, never the
server's local time zone.

`highest`, `lowest`, `average` and `count` come from one SQL aggregate query. The average is
`ROUND(AVG(value)::numeric, 1)`, rounded to **one decimal** in PostgreSQL and returned as a JSON number (for example 97, 98, 98
gives 97.7, and 101, 102 gives 101.5). A whole average such as 117 is returned as `117` and displayed as `117.0`. The average
is over all readings in the range, not an average of daily averages.

With no readings in the range the API still returns `200` with `count: 0` and `null` statistics, and the dashboard shows a
"No readings in this period yet" message instead of the stat cards.

## Security notes

- **Passwords** are hashed with bcrypt at cost 12 and the hash is never returned. Login compares against a dummy hash when the
  email is unknown, so unknown email and wrong password return the same message with similar timing.
- **Sessions** are a JWT (HS256, algorithm pinned on verify) in an `httpOnly`, `SameSite=Lax` cookie; `Secure` is controlled by
  `COOKIE_SECURE`. The token is never exposed to JavaScript.
- **Configuration** is validated at startup. The server will not boot without a `JWT_SECRET` of at least 32 characters.
- **HTTP hardening**: helmet defaults (including its default CSP), `x-powered-by` disabled, a 10 KB JSON body limit, `hpp`, and
  CORS restricted to `CLIENT_URL` with credentials.
- **Rate limiting**: 300 requests per 15 minutes per IP for the whole API, and 20 per 15 minutes per IP on login and register.
  The counters are in memory (one server process).
- **Input validation** with Zod on every route, plus database `CHECK` and `UNIQUE` constraints as a second line of defence.
- **SQL injection**: every query is parameterised (`$1`, `$2`, ...); the only interpolated SQL text is fixed column lists.
- **Data isolation**: every readings and reports query is scoped to the logged-in user's id, and another user's reading looks
  like it does not exist (404). Tests cover list, update, delete, pagination and report isolation.
- **Errors**: one central handler, no stack traces in responses, unexpected errors become a generic `INTERNAL_ERROR`.
- **Client cache**: cached user data is discarded on login, register and logout, so one user's data is never shown to the next.
- **Docker**: non-root containers, and a restrictive CSP and security headers on the nginx side.

## Notes

### Assumptions

- **"Today" is computed in Asia/Kolkata.** The server uses the `TZ` setting (default `Asia/Kolkata`) for future-date checks and
  seed data, so a reading logged at 00:30 IST today is accepted even though it is still yesterday in UTC. The client has the
  time zone fixed to Asia/Kolkata in `client/src/lib/date.ts` and does not read `TZ`.
- **Previous month** means the whole calendar month before the selected date's month, regardless of which day is selected.
- **Only the first failing validation rule is returned** for readings, the readings list and reports, in the order shown above.
  Sign-up returns one message per invalid field.
- **The glucose bands are display hints, not medical advice.** Below 70 mg/dl is shown as Low, 70 to 180 as In range and above
  180 as High (one constant, `GLUCOSE_THRESHOLDS`). They are not used by the server. Talk to a doctor about your own targets.
- **Numeric strings are accepted for `value`.** `"140"` is treated as 140; decimals, signs and text are rejected with the range
  message.
- **Emails are case-insensitive** and stored lower-cased. Registering also logs you in.
- **One reading per slot per day** is a business rule, enforced by the service and the database.
- **Sessions last `JWT_EXPIRES_IN`** (15 minutes in `.env.example`) and are not refreshed, so you are signed out after that.
- **After login the app opens the dashboard**, even if you arrived from another page.
- **Demo data** covers the first day of the previous month to today, is deterministic and always includes today. The seed
  refuses to run in production unless `ALLOW_DEMO_SEED=true`.
- **Redis and BullMQ** are installed but unused. The `ioredis` and `bullmq` packages are kept for planned caching and jobs.
- **Docker** is for running and demonstrating the app on one machine over HTTP, not a production deployment.

### Onboarding

`/signup` is a three-step flow inside the same two-column layout as the login page (a fixed-size stage and a friendly line on the
left, the form card on the right; a single column on phones).

1. **Create your account** (floating mascot): name, email and password. Next is blocked with inline errors until they are valid.
2. **About you** (waving mascot): date of birth in a native date input limited to today and 120 years ago, with the age shown
   live ("You are 36 years and 6 months old", announced politely to screen readers). Nothing medical is asked.
3. **Choose your gender**: two selectable cards, Male and Female (native radios, so arrow keys work). Nothing is chosen by
   default and "Create my account" stays disabled, with a reason, until one is. The waving mascot stays on the stage until a
   choice is made, then it cross-fades to the 3D body, which fills once to an in-range demo value (110).
4. **Welcome to Sweety** (bouncing mascot): shown after the account exists, with the first name and a "Go to my dashboard" button.

The account is created once, at the end of step 3, with a single register call. If the server rejects a field from step 1 (for
example a taken email, 409) the flow goes back to step 1 and shows the message on that field; a date-of-birth error goes back to
step 2. Back keeps everything typed; the form state lives only in memory and the password is never stored. The login page uses the
loving mascot. Every screen has a staggered entrance, a direction-aware step slide and an animated progress bar, all using only
transform and opacity; with `prefers-reduced-motion` they become short fades.

### Body model and the glucose body

The dashboard shows a 3D figure that fills with a colour like a glass of liquid: empty at 40 mg/dl, full (top of the head) at 400
or more, linear in between. The colour follows the same bands as the rest of the app (below 70 amber, 70 to 180 green, above 180
red). It shows the latest reading of the selected day (after dinner, then lunch, breakfast, morning) and the meaning is always
given as text under it ("After lunch, 182 mg/dl, High"). A Male / Female switch under it calls `PATCH /api/users/me` with an
optimistic update and rolls back with an error toast if the call fails.

Assumptions and limits:

- The figure is a **procedural, stylised mannequin**, not a scanned or modelled human. Each body part is a rounded primitive,
  smoothly merged into one signed-distance field and meshed with surface nets (about 47k triangles). All proportions live in
  `client/src/features/body/bodyProportions.ts`. `getBodyGeometry(model)` is the only entry point, so a modelled GLB can replace it.
- The mesh takes about a quarter to half a second to build, so it runs in a Web Worker and is cached per model. The worker is a
  same-origin module, so the CSP needed no change.
- Existing accounts get `male` (the column default) and can change it from the dashboard.
- Only **one WebGL canvas** is on a page at a time (the dashboard, or the onboarding stage). three.js loads lazily, so the login
  page does not download it. Without WebGL, or if it fails, a flat card with the value, a band badge and a level meter is shown.
- Rendering pauses when the tab is hidden or the canvas is off screen, and draws on demand under reduced motion.

### Media

The mascot videos, logo and favicons are generated from the original design files by a script, so they can be reproduced:

```bash
npm run media:optimize            # everything
npm run media:optimize -- logo    # or just "mascots" or "logo"
```

It needs `ffmpeg` and `ffprobe` on your PATH. Put the originals in `design-source/` (`1.mp4` to `4.mp4` for floating, waving,
bouncing and love, plus `logo.png`); that folder is git-ignored on purpose, so the large originals are **not committed**. The
script writes WebM, MP4 (no audio) and a WebP poster per clip to `client/src/assets/mascot/`, the logo as 1x and 2x WebP to
`client/src/assets/`, and the favicons to `client/public/`.

- Each clip is cropped to the band of the 1080x1920 original that contains the mascot and scaled to 720 px tall.
- **Loops never blend two poses.** The script decodes each clip, compares every candidate start frame (first 40%) with every
  candidate end frame (last 40%) by mean squared error (also comparing the frames either side, so the direction of motion matches)
  and trims the clip to the best pair, with a minimum length of about 2 seconds. If the best trim is still not good enough it
  interpolates the last frames towards the first with motion compensation (ffmpeg `minterpolate`). The acceptance test is printed
  per clip: the last-to-first difference must be no larger than the typical difference between two consecutive frames. The
  love clip plays once and rests on its last frame.
- Near-white is snapped to pure white. The videos are drawn with `mix-blend-mode: multiply` so the white disappears into the page,
  and multiply can only darken, so an off-white background would show as a faint box.
- WebM output from VP9 is not bit-for-bit reproducible, so re-running the script changes those files even when nothing else did.
- The mascot does not autoplay under `prefers-reduced-motion` (it shows the poster), pauses when the tab is hidden or the mascot
  is off screen, and the next step's clip is preloaded.

### Accessibility and motion

- A single `MotionConfig reducedMotion="user"` switches off Motion's transform animations when the OS asks for reduced
  motion. Components call `useReducedMotion` only where they need a different result (the error banner, the chart draw, the
  route transition). NumberFlow and AutoAnimate respect the setting themselves, and skeleton pulsing is disabled in CSS.
- Presets (durations, easings, stagger) are shared in `client/src/lib/motion.ts`.
- Interactive controls have visible focus rings, tabs, dialogs and selects use Base UI's ARIA roles, the pagination `nav` is
  labelled "Pagination" and marks the current page with `aria-current`.

### What I would improve with more time

- **Sessions**: refresh tokens or server-side sessions so a login lasts longer than 15 minutes and can be revoked on logout.
  Today a logout only clears the cookie, and a copied token stays valid until it expires.
- **Accounts**: email verification, password reset, changing the password and deleting an account.
- **CSRF**: the cookie is `SameSite=Lax` and CORS is restricted, but there is no CSRF token or `Origin` check on state-changing requests.
- **Password limit**: bcrypt truncates at 72 bytes and the validation counts characters, so very long passphrases with
  multi-byte characters would be silently cut.
- **End-to-end tests** with Playwright, and automated accessibility checks. I tested the layout in a desktop browser and
  through tests, not on real phones.
- **Per-user time zone** instead of one global `TZ`, and one shared source for the client and server (the client currently
  hard-codes Asia/Kolkata).
- **Units**: mmol/L as well as mg/dl, and user-specific target ranges instead of the fixed 70 and 180.
- **Export** of readings and reports to CSV or PDF.
- **Rate limiting** backed by a shared store (Redis is already a dependency) so limits hold across several server instances.
- **Redis caching** for reports, background jobs (for example reminders), and the doctor role the schema already allows.
- **Deployment**: HTTPS termination, secrets management instead of the development database password in `docker-compose.yml`,
  a smaller server image (it is about 500 MB because it keeps `tsx` and the TypeScript sources to run the seed), and building
  the Docker images in CI.
- **Dependency audit**: `npm audit` reports 6 moderate advisories (none high or critical), all from `glob`/`minimatch` through
  two tools: `node-pg-migrate`, which only runs the migrations in `server/migrations`, and `shadcn`, whose code generator is
  not part of the app (the client only imports its CSS file at build time). The only fix npm offers is a breaking downgrade of
  `node-pg-migrate`, so I left it. `node-pg-migrate` is also a runtime dependency of the Docker image, so it is worth updating
  once a release with fixed dependencies exists.
