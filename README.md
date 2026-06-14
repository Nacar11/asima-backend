# asima-backend

NestJS 10 + TypeORM 0.3 + PostgreSQL 16. The identity foundation (auth,
users, roles, permissions) plus the timesheet module (time entries, work
schedules) of **asima** — an Ashima-inspired Employee Time Management
System.

> System-level context lives in `../CLAUDE.md`. Architecture rules live in
> `./CLAUDE.md`; the hexagonal blueprint is
> `../docs/universal-guidelines/module-architecture.md`.

## Prerequisites

- Node ≥ 20 (`.engines` is enforced; `nvm use 20`)
- Docker + Docker Compose (for Postgres in dev; full stack in prod)
- npm 10+

## Quick start

### Dependencies in Docker, backend on the host

Docker Compose runs the **dependencies only** — there is no API container.
The backend always runs on the host via `npm run start:dev` (hot reload) on
port `3000`.

```bash
cp .env.example .env             # leave DATABASE_HOST=localhost
npm install
npm run docker:up                # dependencies: Postgres + MinIO (+ bucket init)
npm run migration:run
npm run seed
npm run start:dev                # backend on :3000, watches src/
```

## Default seeded credentials

The seed plants a single super admin and a roster of HR / PM / TD /
employee users — all with the same shipped password.

| Field    | Value                |
|----------|----------------------|
| Email    | `admin@asima.inc`    |
| Password | `Asima@1234`         |
| Role     | `SUPER_ADMIN` (`system_admin: true`) |

**⚠️ Rotate `SEED_DEFAULT_PASSWORD` before any non-local deployment.** v0
ships warning-only; forced rotation lands in v1 (see `tasks/plan.md` →
"v1 follow-ups"). The seed never re-hashes existing users on reruns —
change the env, drop the user, reseed.

## Environment variables

| Var | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `production` hides Swagger |
| `APP_PORT` | no | `3000` | HTTP listener |
| `API_PREFIX` | no | `api` | mounts all routes under `/api/v1` |
| `CORS_ALLOWED_ORIGINS` | yes | `http://localhost:3000` | comma-separated |
| `DATABASE_HOST` | yes | `localhost` | use `asima-postgres` inside Docker |
| `DATABASE_PORT` | yes | `5432` | |
| `DATABASE_USERNAME` | yes | `asima` | |
| `DATABASE_PASSWORD` | yes | `asima` | |
| `DATABASE_NAME` | yes | `asima` | |
| `DATABASE_SSL_ENABLED` | no | `false` | set `true` on managed Postgres |
| `AUTH_JWT_SECRET` | yes | — | access-token secret (must be set in prod) |
| `AUTH_JWT_TOKEN_EXPIRES_IN` | no | `15m` | access lifetime |
| `AUTH_REFRESH_SECRET` | yes | — | refresh-token secret (distinct from above) |
| `AUTH_REFRESH_TOKEN_EXPIRES_IN` | no | `7d` | refresh lifetime |
| `SEED_DEFAULT_PASSWORD` | yes | `Asima@1234` | applied to every seeded user |

## API surface

All routes are URI-versioned under `/api/v1/...`. Open `/docs` (non-prod
only) for the full Swagger spec.

Today the API ships:

- **Auth** — `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`,
  `POST /auth/logout`. Stateless JWT — access 15m, refresh 7d with
  rotation.
- **Admin Users** — full CRUD on `/admin/users` gated by `USER:*`
  permissions, plus `POST /:id/reset-password`.
- **Self-service Users** — `/users/me` (`GET`, `PATCH`),
  `/users/me/permissions`, `/users/me/password`. Identity-gated only.
- **Admin Roles** — full CRUD on `/admin/roles` plus
  `POST /:id/permissions` (replace permission set). Built-in roles
  (`SUPER_ADMIN`, `HR_ADMIN`, `PROJECT_MANAGER`, `TECHNICAL_DIRECTOR`,
  `EMPLOYEE`) are protected from deletion.
- **Admin Permissions** — read + `PATCH` description on
  `/admin/permissions`. Codes are seed-managed (no create/delete from API).
- **Time Entries** — `/admin/time-entries` (CRUD) and
  `/users/me/time-entries` (toggle-punch, range query, today's segments).
- **Work Schedules** — `/admin/work-schedules` (CRUD; DELETE = logical end
  via `effective_to`) and `/users/me/work-schedule`.

## Architecture pointer

Every feature module follows the hexagonal layout described in
[`module-architecture.md`](../docs/universal-guidelines/module-architecture.md).
The rule that matters most:

> **The domain folder has zero `@nestjs/*` runtime and zero `typeorm`
> imports.** Domain classes are plain TypeScript populated by mappers.

The exemplar module is `src/permissions/`. New modules mirror it. The
admin / self-service split convention (separate DTO folders, shared
service, no `:id` on `/me` routes) lives in `./CLAUDE.md` under
"Admin / self-service split — folder convention".

## Common commands

```bash
npm run start:dev          # watch mode
npm run docker:up          # dependencies: Postgres + MinIO
npm run docker:down
npm run migration:generate src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
npm run db:fresh           # drop schema + re-migrate + seed (DESTRUCTIVE)
npm run seed               # idempotent — safe to re-run
npm run lint
npm run test               # jest unit
npm run test:e2e           # jest e2e (needs running Postgres)
npm run test:cov
npm run build              # nest build → dist/
```

## v1 follow-ups

These were debated during v0 design and explicitly deferred. None of
them block v0 ship.

- **Sessions / refresh-token table** — server-side revocation, "log out
  of all devices", refresh-token reuse detection.
- **Split-storage cookies** — refresh token in `httpOnly` + `Secure`
  cookie scoped to `/auth/refresh`; access token in-memory only on the
  frontend.
- **Account lockout** — N consecutive bad logins per email triggers a
  cooldown. IP-keyed throttle covers brute-force today.
- **Forced password rotation** — `must_change_password` flag on `users`.
  v0 ships with documented default credentials; v1 prevents the seeded
  admin from being usable until rotated.
- **`approval_chains`** — per-employee approver routing. Unblocks the
  leave module and `time_correction_requests` (Task 22 / Phase 6).
- **`nestjs-pino` logger** — replaces the default `Logger` once we have
  a log destination.

## Where to look first

- [`./CLAUDE.md`](./CLAUDE.md) — backend-only rules (hexagonal layout,
  auth pipeline, migration conventions, Swagger tag rules).
- [`../CLAUDE.md`](../CLAUDE.md) — system-level context across frontend
  and backend (terminology, admin/self-service contract, API
  conventions).
- [`../docs/universal-guidelines/module-architecture.md`](../docs/universal-guidelines/module-architecture.md)
  — hexagonal blueprint every module follows.
- [`./tasks/plan.md`](./tasks/plan.md) — phase plan, current task,
  acceptance criteria (gitignored working file).
- [`../docs/adr/`](../docs/adr/) — architectural decisions. Read the
  matching ADR before changing roles, auth, or approval logic.
