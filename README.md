<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f9d7a,50:2dd4a7,100:a7f3d0&height=220&section=header&text=Sweety&fontSize=76&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=A%20friendly%20blood%20glucose%20tracker&descSize=20&descAlignY=60" alt="Sweety banner" width="100%" />

### Log your readings. See your day. Stay in range.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white&style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-raw%20SQL-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white&style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-0f9d7a?style=for-the-badge)

[Demo video](https://drive.google.com/file/d/1Yffjmniv0B1wYkySK9nIuwUP10VVJD-7/view?usp=sharing) · [Screenshots](#screenshots) · [Getting started](#getting-started) · [Notes](#notes)

</div>

---

## Table of contents

- [About](#about)
- [Demo](#demo)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [API overview](#api-overview)
- [Validation rules](#validation-rules)
- [Notes](#notes)
- [What I would improve](#what-i-would-improve)
- [Author](#author)

---

## About

**Sweety** is a full-stack web app for logging daily blood glucose readings and understanding them at a glance. Each day has four fixed time slots (morning fasting, after breakfast, after lunch, after dinner). A 3D body figure fills with colour that reflects the latest reading, and daily, month-to-date and previous-month reports summarise the trend.

> Sweety displays visual hints only. It is not a medical device and does not give medical advice.

## Demo

[▶ Watch the 2-minute walkthrough](https://drive.google.com/file/d/1Yffjmniv0B1wYkySK9nIuwUP10VVJD-7/view?usp=sharing)

## Features

| Area | What you get |
|---|---|
| **Accounts** | Sign-up and login with bcrypt-hashed passwords, JWT in an httpOnly cookie, and a 3-step onboarding flow (account, date of birth with live age, gender) |
| **Readings** | Add, view, edit and delete readings by date and time slot, value range 40-600 mg/dl |
| **Validation** | Exact, user-friendly error messages on both client and server (see [Validation rules](#validation-rules)) |
| **Reports** | Daily, month-to-date and previous-month reports with highest, lowest, average and count, plus a trend chart and an empty state |
| **Body figure** | Procedural 3D figure (male, female, other) coloured by glucose band: low (amber), in range (green), high (red), with a 2D fallback |
| **History** | Paginated list of all readings with edit and delete |
| **Profile** | Name, age, gender and monthly insights |
| **Polish** | Smooth animations, looping mascot videos, responsive layout, reduced-motion support |

## Screenshots

### Onboarding

| Login | Create account |
|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Create account](docs/screenshots/02-onboarding-account.png) |

| Date of birth and live age | Gender and body figure |
|---|---|
| ![Date of birth](docs/screenshots/03-onboarding-dob-age.png) | ![Gender](docs/screenshots/04-onboarding-gender-figure.png) |

### Dashboard and readings

| Dashboard | Add reading validation |
|---|---|
| ![Dashboard](docs/screenshots/05-dashboard-readings.png) | ![Validation](docs/screenshots/06-add-reading-validation.png) |

### Reports

| Daily report | Month-to-date chart |
|---|---|
| ![Daily report](docs/screenshots/07-daily-report.png) | ![Month to date](docs/screenshots/08-month-to-date-chart.png) |

| Previous month | History with pagination |
|---|---|
| ![Previous month](docs/screenshots/09-previous-month.png) | ![History](docs/screenshots/10-history-pagination.png) |

### Profile

| Insights | Insight charts |
|---|---|
| ![Profile insights](docs/screenshots/11-profile-insights.png) | ![Profile charts](docs/screenshots/11b-profile-insights-charts.png) |

### Mobile

| Responsive dashboard | Mobile onboarding |
|---|---|
| ![Mobile](docs/screenshots/12-mobile.png) | ![Mobile onboarding](docs/screenshots/13-mobile-onboarding.png) |

## Tech stack

| Layer | Technology |
|---|---|
| Client | React, TypeScript, Vite, TanStack Query, React Hook Form + Zod, Tailwind CSS v4 + shadcn/ui, Motion, Recharts, React Three Fiber |
| Server | Node.js, Express, TypeScript, `pg` (raw SQL), Zod, bcrypt, JWT, helmet, CORS, rate limiting |
| Database | PostgreSQL with `node-pg-migrate` migrations |
| Testing | Vitest, Supertest, React Testing Library |
| Tooling | npm workspaces, Docker Compose, GitHub Actions CI |

## Project structure

```
Sweety/
├── client/            React app (Vite)
│   └── src/
│       ├── features/  auth, readings, reports, body, profile
│       └── ...
├── server/            Express API
│   └── src/
│       ├── modules/   auth, users, readings, reports, insights
│       └── ...
├── scripts/           seed, media and model tooling
├── docs/screenshots/  README images
├── docker-compose.yml
└── .env.example
```

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (for PostgreSQL), or a local PostgreSQL instance

### 1. Clone and install

```bash
git clone https://github.com/KarthikVishwaa/Sweety.git
cd Sweety
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET`.

### 3. Start the database

```bash
docker compose up -d
```

PostgreSQL runs on port `5434`.

### 4. Run migrations and seed demo data

```bash
npm run migrate
npm run seed
```

The seed script creates a demo user with sample readings:

| Email | Password |
|---|---|
| `demo@sweety.app` | `Demo@1234` |

### 5. Run the app

```bash
# terminal 1 - API on http://127.0.0.1:4000
npm run dev:server

# terminal 2 - client on http://localhost:5173
npm run dev:client
```

Or run everything in containers:

```bash
docker compose --profile full up --build
```

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@127.0.0.1:5434/sweety` |
| `JWT_SECRET` | Secret used to sign auth tokens | long random string |
| `PORT` | API port | `4000` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Runtime environment | `development` |

See `.env.example` for the complete list.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev:server` | Start the API in watch mode |
| `npm run dev:client` | Start the Vite dev server |
| `npm run migrate` | Apply database migrations |
| `npm run seed` | Insert demo user and readings |
| `npm run build` | Build client and server |
| `npm run lint` | Lint all workspaces |
| `npm test` | Run all tests |
| `npm run verify` | Lint, typecheck, test and build |

## Testing

```bash
npm test                  # all tests
npm test -w server        # API tests (Vitest + Supertest)
npm test -w client        # UI tests (Vitest + React Testing Library)
npm run verify            # full pipeline, same as CI
```

## API overview

All routes except sign-up and login require the auth cookie.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user |
| GET | `/api/readings?date=YYYY-MM-DD` | Readings for a day |
| GET | `/api/readings/history` | Paginated history |
| POST | `/api/readings` | Add a reading |
| PATCH | `/api/readings/:id` | Edit a reading |
| DELETE | `/api/readings/:id` | Delete a reading |
| GET | `/api/reports/daily` | Daily report |
| GET | `/api/reports/month-to-date` | Month-to-date report |
| GET | `/api/reports/previous-month` | Previous month report |
| GET | `/api/insights` | Monthly profile insights |
| PATCH | `/api/users/me` | Update profile |

## Validation rules

| Rule | Message |
|---|---|
| Value is empty | `Please enter a glucose value.` |
| Value outside 40-600 | `Value must be between 40 and 600 mg/dl.` |
| Slot already used on that date | `You already have an After lunch reading for this date.` |
| More than 4 readings in a day | `You can add only 4 readings per day.` |
| Date is in the future | `Date cannot be in the future.` |

Rules are enforced on the server and mirrored on the client for instant feedback.

## Notes

- **Glucose bands** are display hints only: below 70 is low (amber), 70-180 is in range (green), above 180 is high (red).
- **"Today" uses Asia/Kolkata.** The server resolves the current date in IST so the future-date rule behaves correctly regardless of server timezone.
- **Report ranges:** daily is the selected date, month-to-date runs from the first of the month to the selected date, and previous month is the whole calendar month before the selected date. Averages are rounded to one decimal in SQL.
- **Security:** passwords hashed with bcrypt (cost 12), JWT stored in an httpOnly cookie, helmet, CORS allow-list, and rate limiting on auth routes.
- **Raw SQL:** queries use `pg` directly with parameterised statements, and a unique constraint on user, date and slot backs the duplicate-slot rule.
- **3D figure:** generated procedurally, baked to GLB, lazy-loaded, and replaced by a 2D card when WebGL is unavailable or motion is reduced.
- **Bonus tasks completed:** pagination, trend chart, Docker setup, frontend tests.

## What I would improve

- Background jobs with Redis and BullMQ (for example reminders and scheduled summaries)
- A doctor role with read-only access to patient reports
- CSV and PDF export of reports
- End-to-end tests with Playwright
- Deployment pipeline with a hosted demo

## Author

**Karthik R**  
Full stack developer, Salem, Tamil Nadu  
GitHub: [@KarthikVishwaa](https://github.com/KarthikVishwaa)

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:a7f3d0,50:2dd4a7,100:0f9d7a&height=100&section=footer" width="100%" alt="" />

</div>
