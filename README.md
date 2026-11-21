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

### Demo data

```bash
npm run seed
```

Creates (or resets) a demo patient and fills in realistic readings so you can log in and see everything straight away.

| Field    | Value           |
| -------- | --------------- |
| Name     | Ramesh Kumar    |
| Email    | demo@sweety.app |
| Password | `Demo@1234`     |

This is a published demo credential, not a secret. The seed is idempotent: it upserts the demo user and replaces that user's
readings in a single transaction, so running it twice gives identical data, and it never touches any other user. It covers
every day from the first day of the previous month up to today (Asia/Kolkata), is deterministic (a seeded PRNG, no
`Math.random`), mostly in range with some highs and lows, leaves some days partly filled and a couple empty, and refuses to
run when `NODE_ENV=production`.

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

| Method | Path                | Body                             | Success              | Notes                              |
| ------ | ------------------- | -------------------------------- | -------------------- | ---------------------------------- |
| GET    | `/api/readings`     | query `?date`, `?page`, `?limit` | `200 { data, meta }` | Paginated, see below               |
| POST   | `/api/readings`     | `{ date, slot, value }`          | `201 { reading }`    |                                    |
| PUT    | `/api/readings/:id` | `{ date, slot, value }`          | `200 { reading }`    | Full replace, same rules as create |
| DELETE | `/api/readings/:id` | none                             | `204`                |                                    |

Slots, in display order: `morning_fasting` (Morning (fasting)), `after_breakfast` (After breakfast), `after_lunch`
(After lunch), `after_dinner` (After dinner).

### Listing and pagination

`GET /api/readings` always returns the envelope `{ data: Reading[], meta: { page, limit, total, totalPages } }`.

| Query   | Default | Rules                                              | Error message                                   |
| ------- | ------- | -------------------------------------------------- | ----------------------------------------------- |
| `date`  | none    | Optional `YYYY-MM-DD`; limits the list to that day | Please choose a valid date.                     |
| `page`  | `1`     | Whole number, 1 or more                            | Page must be a whole number of 1 or more.       |
| `limit` | `20`    | Whole number, 1 to 100                             | Limit must be a whole number between 1 and 100. |

Without `date` the response covers all of the user's readings, newest date first, then slot order. A page past the last one
returns `data: []` with the correct `meta`. `totalPages` is `0` when there are no readings. The query uses one `COUNT` and one
`LIMIT/OFFSET` query, both scoped to the user, and is served by the existing `(user_id, reading_date)` index (scanned
backwards), so no extra index was needed.

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

## Reports API

`GET /api/reports?type=daily|mtd|monthly&date=YYYY-MM-DD` (login required, scoped to the current user).

| `type`    | Range covered                                                                     |
| --------- | --------------------------------------------------------------------------------- |
| `daily`   | `from = to = date`                                                                |
| `mtd`     | The 1st of the month containing `date`, up to and including `date`                |
| `monthly` | The **whole calendar month before** the month containing `date` (1st to last day) |

Examples: `date=2026-10-15` gives daily `2026-10-15`, mtd `2026-10-01` to `2026-10-15`, monthly `2026-09-01` to
`2026-09-30`. A `date` in January gives the previous December, and `2028-03-01` gives 1 to 29 February. Range maths uses
UTC calendar arithmetic on the date strings, never the machine's local time zone.

Response:

```json
{
  "type": "mtd",
  "from": "2026-11-01",
  "to": "2026-11-21",
  "count": 6,
  "highest": 182,
  "lowest": 65,
  "average": 117,
  "days": [{ "date": "2026-11-01", "average": 100, "lowest": 100, "highest": 100, "count": 1 }]
}
```

- `daily` also returns `readings: [{ id, slot, slotLabel, value, date }]` in slot order. `mtd` and `monthly` return `days`
  instead (only days that have readings, ordered by date), which feeds the chart.
- `count`, `highest`, `lowest` and `average` come from a single SQL aggregate query. `average` is `ROUND(AVG(value), 1)`
  computed in PostgreSQL and returned as a JSON number. For example 97, 98, 98 gives `97.7`, 100, 100, 101 gives `100.3` and
  101, 102 gives `101.5`. A whole average such as 117 is returned as `117` and shown as `117.0` in the UI.
- Validation, in order: `type` ("Please choose a valid report type."), `date` ("Please choose a valid date."), and a
  future date in `Asia/Kolkata` ("Date cannot be in the future."). All return 400.

**Empty state (assumption).** When there are no readings in the range the API still returns `200` with `count: 0` and
`highest`, `lowest` and `average` all `null` (never `0`). The dashboard then shows a "No readings in this period yet" message
instead of stat cards, and on the Daily tab offers an "Add a reading" button for the selected date.

### Dashboard reports

The reports panel follows the dashboard's selected date (`?date=`). The active tab is stored in the URL as
`?report=daily|mtd|monthly` (anything else falls back to `daily`). Creating, editing or deleting a reading refreshes the
reports immediately.

## History page

`/history` (login required, linked from the header) lists every reading, newest first: date, time slot, value, status badge
and Edit and Delete actions that reuse the dashboard's dialogs. A table is shown from the `md` breakpoint up and a card list on
phones. The page and the rows per page (10, 20 or 50) live in the URL (`?page=2&limit=10`); invalid values fall back to page 1
and 20 rows. The previous page stays on screen while the next one loads, changing the page size returns to page 1, and
deleting the last reading on a page moves back one page. Editing or deleting refreshes the dashboard and reports too.

## Animation and reduced motion

- One `MotionConfig reducedMotion="user"` wraps the app, so Motion's transform animations (slides, shake, tap scale, the
  empty-state float) are switched off when the OS asks for reduced motion. Only opacity fades remain.
- Components call `useReducedMotion` only where they need a different result: the error banner (it animates height), the
  Recharts line draw (`isAnimationActive`), and the route transition, which is skipped entirely.
- NumberFlow and AutoAnimate honour `prefers-reduced-motion` themselves. Skeleton pulsing is disabled in CSS.
- Durations, easings, stagger and variants are shared presets in `client/src/lib/motion.ts`. Nothing animates for longer than
  about 400ms, apart from the chart draw and the looping droplet on the empty state.
- Route changes fade and slide by 8px (`RootLayout`), and primary buttons give a small tap scale.
- Links have a visible focus outline, tabs and dialogs use Base UI's ARIA roles, and the pagination `nav` is labelled
  "Pagination" with `aria-current` on the current page.

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
- **Seed assumptions.** The demo data runs from the 1st of the previous month to today in `Asia/Kolkata`, so the amount of
  data grows through the month. Today always has at least one reading. The deterministic generator is seeded with a constant,
  so the same dates give the same values.
- **Pagination assumptions.** `totalPages` is `0` for an empty list; the History page then shows its empty state instead of
  the pagination controls. After signing in the app always opens the dashboard, even if you arrived from `/history`.
- **Bundles.** Vendor libraries are split into separate chunks (`vite.config.ts`) and route pages and the chart are loaded
  lazily, so no chunk exceeds 500 kB.
- **Redis and BullMQ** are installed and configured via `REDIS_URL`, but nothing uses them yet.
- **Dependency audit.** `npm audit` reports moderate advisories in `glob`/`minimatch` pulled in by `node-pg-migrate`, a dev-only CLI
  that is not part of the running server. The only suggested fix is a downgrade, so it is left as is.
