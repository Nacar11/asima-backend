# Implementation Plan: `asima-backend` v0

## Overview

Build the v0 backend for **asima**, an Ashima-inspired Employee Time Management System. v0 covers the identity foundation only: **Auth + Users + Roles + Permissions** in NestJS, PostgreSQL, dockerized. The architecture mirrors `module-architecture.md` and the exemplar at `reference/categories/` (hexagonal layering: domain → application → infrastructure, with abstract repository ports and a mapper).

## Improvements over the original draft

The original sequence was layered (all entities first, then all controllers). This revision applies:

- **Vertical slicing** — every task delivers an observable, testable end-to-end behavior instead of a layer in isolation.
- **Walking skeleton first** — `/health` + Postgres handshake before any feature work, so deployment is provably alive on day 1.
- **Audit fields from day 1** — `created_by`, `updated_by`, `deleted_by` on User/Role/Permission match the reference pattern; adding them later is a painful migration.
- **Lowercase email normalization** — case-insensitive uniqueness without requiring the Postgres `citext` extension (simpler ops).
- **Refresh-token rotation** — `/refresh` issues a fresh refresh token alongside the new access token (reduces leaked-token blast radius even in stateless mode).
- **`/users/me/permissions`** — flat permission-code array for frontend UI gating, so the client never has to parse `role.permissions`.
- **Permissions seeded from a JSON manifest** — `database/seeds/data/permissions.json`. Adding `TIMEKEEPING:Approve`, `LEAVE:Approve` later is a one-line edit.
- **Request-ID middleware** — generates/echoes `X-Request-ID` for correlation. Cheap to add now, valuable when logs matter.
- **`PaginatedResponse<T>` shared type** — every list endpoint returns `{ data, total, page, limit, has_more }`. Consistent client integration.
- **Health endpoint backs the API container's Docker healthcheck** — not just Postgres.
- **CI stub from day 1** — `.github/workflows/ci.yml` runs install → build → test → lint.
- **Engines pin** — `"engines": { "node": ">=20" }` so contributors don't drift.

## Architecture decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | NestJS + TypeORM + PostgreSQL | User-chosen; matches reference. |
| 2 | Hexagonal per module: `domain/`, `persistence/`, `dto/`, `controllers/`, `<module>.service.ts` | `module-architecture.md` rule: domain has zero `@nestjs/*` / `typeorm` imports. |
| 3 | Abstract repository as port; concrete `extends` it | Matches `reference/categories/persistence/base-category.repository.ts`. Enables service-layer mocking. |
| 4 | Stateless JWT (access 15m, refresh 7d) with refresh rotation | No `refresh_tokens` table in v0; simpler. Trade-off: cannot revoke single token. v1 adds session table. |
| 5 | `bcryptjs` (not native `bcrypt`) | Avoids Alpine native build pain in Docker; matches reference. |
| 6 | Snake_case columns; domain fields also snake_case | Matches reference exactly (`category_name`, `created_at`). Avoids naming-strategy package. |
| 7 | `password_hash` with `select: false` | Excluded by default; opted in only by `findByEmailWithCredentials`. |
| 8 | Permission code shape: `RESOURCE:Action` (e.g. `USER:Create`) | Easier to read than reference's two-axis `{ AC01: 'Create' }`. Decorator stays `@Permissions({ USER: 'Create' })`. |
| 9 | Audit fields (`created_by/updated_by/deleted_by`) on every entity | Reference pattern; sets up traceability for future approval workflows. |
| 10 | Lowercase email normalization | Case-insensitive uniqueness without `citext` extension. Service-layer `email.toLowerCase()` on save. |
| 11 | `PermissionsGuard` provided per-route via `@UseGuards`, not globally | Keeps `/auth/login`, `/health` open without complex `@Public()` annotations. |
| 12 | Single migration file in v0 | Generated initial schema; no incremental migrations until first feature module lands. |
| 13 | Single-tenant; no `organization_id` columns | Internal HR-style tool, one company per deployment. Adding tenancy later is a rewrite — committing to single-tenant now. |
| 14 | No soft-delete on permissions | Permissions are seed-managed configuration, not user data. History lives in git on the JSON manifest. |
| 15 | NestJS default `Logger` for v0 | Zero config, console output. Upgrade to `nestjs-pino` in v1 when a log destination exists. `X-Request-ID` middleware already provides the correlation hook. |
| 16 | Shared `API_VERSION` constant in `src/utils/constants/api.constants.ts`, imported by every controller | Single source of truth for `@Controller({ version: ... })`. When v2 ships, split into `API_VERSION_V1` / `API_VERSION_V2` and per-controller hardcode the relevant one. |
| 17 | Default super admin password warning-only (no forced rotation) | v0 is local-only. v1 roadmap adds `must_change_password` flag + forced-rotation guard before any real deployment. |

## Dependency graph

```
                       ┌─────────────────────────────┐
                       │  Bootstrap (Phase 0)         │
                       │  • Nest CLI + tsconfig       │
                       │  • Config + .env             │
                       │  • DataSource + Postgres     │
                       │  • /health endpoint          │
                       └──────────────┬──────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────────┐
│ Permissions   │           │ Shared utils  │           │ Audit fields base │
│ entity+repo   │──depends──▶│ EntityHelper, │           │ (created_by FK    │
│ +mapper+seed  │           │ QueryFailedF, │           │ to users) needs   │
└───────┬───────┘           │ pagination    │           │ User entity first │
        │                   └───────┬───────┘           └─────────┬─────────┘
        │                           │                             │
        ▼                           ▼                             │
┌───────────────┐                                                 │
│ Roles entity  │                                                 │
│ M2M perms     │                                                 │
│ +mapper+seed  │                                                 │
└───────┬───────┘                                                 │
        │                                                         │
        ▼                                                         │
┌───────────────┐                                                 │
│ Users entity  │◀────────────────────────────────────────────────┘
│ FK roles      │
│ +mapper+seed  │
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────────────┐
│ Auth: JwtStrategy (loads user.role.perms) │
│       /auth/login, /auth/me               │
└───────────────────┬───────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────┐
│ PermissionsGuard + @Permissions decorator │
│ Verified end-to-end via one gated route   │
└───────┬───────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ CRUD admin controllers (Users, Roles, Permissions) + self-service │
└───────┬──────────────────────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────────────────┐
│ Auth completeness: register, refresh w/ rotation │
└───────┬─────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────┐
│ Production readiness: Dockerfile,    │
│ docker-compose, e2e test, README, CI │
└─────────────────────────────────────┘
```

## Vertical slices (phases)

### Phase 0 — Walking Skeleton
Goal: prove the project boots, connects to Postgres, and serves HTTP.

- **Task 1**: Project bootstrap + Postgres handshake + `/health` endpoint.

### Phase 1 — Identity Foundation
Goal: minimum viable auth — seeded admin can log in and call a protected route.

- **Task 2**: Permissions module (entity, repo, mapper, domain, JSON-driven seed).
- **Task 3**: Roles module (entity with M2M to permissions, repo, mapper, domain, seed).
- **Task 4**: Users module (entity with FK to roles, repo, mapper, domain, seed default super admin).
- **Task 5**: Auth login + `/auth/me` (JwtStrategy loads `role.permissions`; one round-trip works).

**Checkpoint A** — Can a seeded admin log in and call `/auth/me`?

### Phase 2 — Authorization Gate
Goal: prove route gating works end-to-end (positive + negative path).

- **Task 6**: `PermissionsGuard` + `@Permissions` decorator + protect one admin route + verify 403 path.

**Checkpoint B** — Does an `EMPLOYEE` token get 403 on the gated route?

### Phase 3 — CRUD Surfaces
Goal: full management endpoints for the four resources.

- **Task 7**: Admin Users CRUD (`/api/v1/admin/users`).
- **Task 8**: Self-service Users (`/api/v1/users/me`, `PATCH /me`, `GET /me/permissions`).
- **Task 9**: Admin Roles CRUD + assign-permissions endpoint.
- **Task 10**: Admin Permissions read + update.

**Checkpoint C** — Can an admin create a user, assign a role, and that user gets the right permissions?

### Phase 4 — Auth Completeness
Goal: registration + refresh-with-rotation + logout no-op.

- **Task 11**: `/auth/register` (default role `EMPLOYEE`).
- **Task 12**: `/auth/refresh` with refresh-token rotation.
- **Task 13**: `/auth/logout` (stateless no-op + documented behavior).

**Checkpoint D** — Full user journey: register → login → refresh → access protected route.

### Phase 5 — Production Readiness
Goal: ship-ready container, smoke test, docs, CI.

- **Task 14**: Multi-stage Dockerfile + `entrypoint.sh` (migrate, optional seed, start).
- **Task 15**: `docker-compose.yml` with healthchecks for both services.
- **Task 16**: e2e smoke test (`auth login → 200 + tokens`).
- **Task 17**: README + `.env.example` + CI stub + engines pin.

**Checkpoint E (Final)** — Fresh clone → `docker compose up --build` → all 14 verification steps in §15 pass.

## Tasks

### Task 1: Walking skeleton — boot, DB connect, `/health`

**Description:** Scaffold the Nest project, wire ConfigModule + TypeOrmModule, expose `GET /api/v1/health` returning `{ status: 'ok', database: 'up' }` only when the DB is reachable. Set up `main.ts` with helmet, CORS, ValidationPipe, URI versioning, prefix `api`, Swagger at `/docs` (non-prod only), body-parser limits, request-ID middleware.

**Acceptance criteria:**
- [ ] `npm run start:dev` boots without error and prints "Nest application successfully started".
- [ ] `GET http://localhost:3000/api/v1/health` returns 200 with DB up.
- [ ] Swagger UI loads at `/docs`.
- [ ] When Postgres is down, `/health` returns 503.
- [ ] Every response carries an `X-Request-ID` header.

**Verification:**
- [ ] `docker compose up -d asima-postgres && npm install && npm run start:dev`
- [ ] `curl -i http://localhost:3000/api/v1/health` → 200 + `X-Request-ID` present
- [ ] `docker compose stop asima-postgres && curl http://localhost:3000/api/v1/health` → 503

**Dependencies:** None.

**Files likely touched:**
- `package.json`, `tsconfig.json`, `nest-cli.json`
- `src/main.ts`, `src/app.module.ts`
- `src/config/{app.config.ts, database.config.ts, config.type.ts}`
- `src/database/{typeorm-config.service.ts, data-source.ts}`
- `src/health/health.controller.ts`
- `src/utils/{validate-config.ts, validation-options.ts, helpers/exception.helper.ts, middleware/request-id.middleware.ts, constants/api.constants.ts}`
- `.env.example`, `.gitignore`

**Scope:** M (5 files).

---

### Task 2: Permissions module (entity → seed → admin read endpoint)

**Description:** Full vertical slice for Permissions. Entity `permissions(id, code, resource, action, description, audit + timestamps)`. Abstract `BasePermissionRepository` + concrete impl + mapper + domain. Seed from `src/database/seeds/data/permissions.json`. Admin endpoint `GET /api/v1/admin/permissions` (auth-gated, but no `PermissionsGuard` yet — wire that in Task 6).

**Acceptance criteria:**
- [ ] Migration creates `permissions` table with unique index on `code`.
- [ ] `npm run seed` upserts every code in `permissions.json` (idempotent — second run is a no-op).
- [ ] `GET /api/v1/admin/permissions` returns the seeded codes (gated only by JwtStrategy at this point — temporarily open to any authenticated user).
- [ ] `PermissionMapper.toDomain` strips no fields (permissions are public metadata).
- [ ] Domain class `Permission` imports nothing from `@nestjs/*` or `typeorm`.

**Verification:**
- [ ] `npm run migration:generate -- src/database/migrations/InitPermissions` produces a sane SQL file.
- [ ] `npm run migration:run && npm run seed` exits 0; rerun is idempotent.
- [ ] `psql -c "select code from permissions order by code"` lists `USER:Create`, `ROLE:View`, `PERMISSION:Update`, etc.

**Dependencies:** Task 1.

**Files:**
- `src/permissions/permissions.module.ts`
- `src/permissions/permissions.service.ts`
- `src/permissions/permissions.constants.ts`
- `src/permissions/persistence/{persistence.module.ts, base-permission.repository.ts, repositories/permission.repository.ts, mappers/permission.mapper.ts, entities/permission.entity.ts}`
- `src/permissions/domain/{permission.ts, permission-search-criteria.ts, find-all-permission.ts}`
- `src/permissions/dto/{update-permission.dto.ts, query-permission.dto.ts}`
- `src/database/seeds/{seed.module.ts, run-seed.ts, permission/permission-seed.service.ts, data/permissions.json}`

**Scope:** L (~10 files but mostly boilerplate following the reference pattern).

---

### Task 3: Roles module (entity → seed → admin read endpoint)

**Description:** Vertical slice for Roles. Entity `roles(id, name unique, description, audit + timestamps)` with M2M to permissions via `role_permissions` join table. Seed three roles: `SUPER_ADMIN` (all perms), `ADMIN` (USER:* + ROLE:View + PERMISSION:View), `EMPLOYEE` (none — uses self-service routes only).

**Acceptance criteria:**
- [ ] Migration creates `roles` and `role_permissions` tables.
- [ ] Seed upserts roles by name; permission assignments are idempotent (reseed doesn't duplicate rows).
- [ ] `GET /api/v1/admin/roles` returns roles with permissions populated.
- [ ] `RoleMapper.toDomain` calls `PermissionMapper.toDomain` for each permission.
- [ ] Domain `Role` has zero NestJS/TypeORM imports.

**Verification:**
- [ ] `npm run seed` twice → second run logs "skipped, already exists" for all three roles.
- [ ] `psql -c "select r.name, count(rp.permission_id) from roles r left join role_permissions rp on rp.role_id=r.id group by r.name"` → SUPER_ADMIN has all, ADMIN has 6, EMPLOYEE has 0.

**Dependencies:** Task 2.

**Files:**
- `src/roles/{roles.module.ts, roles.service.ts, roles.constants.ts}`
- `src/roles/persistence/{persistence.module.ts, base-role.repository.ts, repositories/role.repository.ts, mappers/role.mapper.ts, entities/role.entity.ts}`
- `src/roles/domain/{role.ts, role-search-criteria.ts, find-all-role.ts}`
- `src/roles/dto/{create-role.dto.ts, update-role.dto.ts, assign-permissions.dto.ts, query-role.dto.ts}`
- `src/database/seeds/role/role-seed.service.ts`

**Scope:** L (~12 files).

---

### Task 4: Users module (entity → seed default super admin)

**Description:** Vertical slice for Users. Entity `users(id, email lowercased+unique, password_hash select:false, first_name, last_name, role_id FK, system_admin bool default false, status default 'Active', timestamps + soft-delete + audit fields)`. Service hashes with bcrypt cost 10 and lowercases email on every save. Seed default super admin from env (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).

**Acceptance criteria:**
- [ ] Migration creates `users` with unique index on `email`.
- [ ] `findById` defaults to NOT loading `password_hash`.
- [ ] `findByEmailWithCredentials(email.toLowerCase())` returns the hash for auth.
- [ ] `UserMapper.toDomain` does not copy `password_hash` (verified in unit test).
- [ ] Seeded super admin has `system_admin: true` and role `SUPER_ADMIN`.
- [ ] Re-running seed does not insert a duplicate admin.

**Verification:**
- [ ] `npm run seed` outputs "Created super admin admin@asima.local" on first run, "Skipped" on second.
- [ ] `psql -c "select email, system_admin from users"` → `admin@asima.local` with `t`.
- [ ] Unit test: `UserMapper.toDomain({...entity, password_hash: 'xyz'})` returns object without `password_hash` key.

**Dependencies:** Task 3.

**Files:**
- `src/users/{users.module.ts, users.service.ts, users.constants.ts}`
- `src/users/persistence/{persistence.module.ts, base-user.repository.ts, repositories/user.repository.ts, mappers/user.mapper.ts, entities/user.entity.ts}`
- `src/users/domain/{user.ts, user-search-criteria.ts, find-all-user.ts}`
- `src/users/dto/{create-user.dto.ts, update-user.dto.ts, query-user.dto.ts, update-me.dto.ts}`
- `src/database/seeds/user/user-seed.service.ts`
- `test/unit/users/user.mapper.spec.ts`

**Scope:** L (~14 files).

---

### Task 5: Auth login + `/auth/me`

**Description:** `POST /api/v1/auth/login` accepts email + password, validates with bcrypt, returns `{ access_token, refresh_token, token_expires_in, user }`. `JwtStrategy` validates the token AND loads `user.role.permissions` (via `relations: ['role', 'role.permissions']`) so downstream guards have everything. `GET /api/v1/auth/me` returns the loaded user.

**Acceptance criteria:**
- [ ] Wrong password → 401.
- [ ] User with `status !== 'Active'` or `deleted_at` set → 401.
- [ ] Successful login response includes both tokens and user (sans password_hash).
- [ ] `GET /auth/me` with valid bearer returns `user.role.permissions[].code` populated.
- [ ] Login is throttled at 10/min per IP, register at 5/min.

**Verification:**
- [ ] `curl -X POST /api/v1/auth/login -d '{"email":"admin@asima.local","password":"Admin@1234"}'` → 200 with tokens.
- [ ] Same with wrong password → 401.
- [ ] `curl /api/v1/auth/me -H "Authorization: Bearer $ACCESS"` → 200 with role + permissions array.

**Dependencies:** Task 4.

**Files:**
- `src/auth/{auth.module.ts, auth.service.ts, auth.controller.ts}`
- `src/auth/config/{auth.config.ts, auth-config.type.ts}`
- `src/auth/dto/{login.dto.ts, login-response.dto.ts}`
- `src/auth/strategies/{jwt.strategy.ts, types/jwt-payload.type.ts}`

**Scope:** M (~8 files).

---

### Checkpoint A: Identity foundation

- [ ] `docker compose up -d asima-postgres && npm run migration:run && npm run seed && npm run start:dev`
- [ ] Login as seeded admin returns tokens.
- [ ] `/auth/me` shows role + permission codes.
- [ ] Swagger lists Auth, Health.
- [ ] **Human review** before continuing.

---

### Task 6: PermissionsGuard + protect a route + 403 path

**Description:** Implement `@Permissions({ RESOURCE: 'Action' })` decorator and `PermissionsGuard` that reads `user.role.permissions` from the request, supports `system_admin: true` bypass, and matches required `RESOURCE:Action` codes. Apply to `GET /api/v1/admin/permissions` (Task 2's endpoint, now properly gated). Verify both positive and negative paths.

**Acceptance criteria:**
- [ ] Admin (with `PERMISSION:View`) hits `GET /admin/permissions` → 200.
- [ ] Employee (no admin perms) hits same → 403.
- [ ] User with `system_admin: true` bypasses all permission checks.
- [ ] Route with no `@Permissions(...)` decorator passes for any authenticated user.
- [ ] Decorator supports multi-action: `@Permissions({ USER: ['Create', 'Update'] })`.

**Verification:**
- [ ] Manual: log in as seeded admin → `GET /admin/permissions` → 200.
- [ ] Manual: register `emp@asima.local` (Task 11 not done yet — temporarily seed an employee for this test, or use an existing flow) and confirm → 403 on `/admin/permissions`.

**Dependencies:** Task 5.

**Files:**
- `src/permissions/{permissions.guard.ts, permissions.decorator.ts}`
- `src/utils/decorators/public.decorator.ts`
- `src/permissions/controllers/admin-permissions.controller.ts` (apply guard + decorator)

**Scope:** S (3-4 files).

---

### Checkpoint B: Authorization

- [ ] Positive + negative paths verified for `PermissionsGuard`.
- [ ] No regressions on `/auth/me` (still works).

---

### Task 7: Admin Users CRUD

**Description:** `/api/v1/admin/users` with full CRUD. Each route gated by `@Permissions({ USER: 'Create' | 'View' | 'Update' | 'Delete' })`. Soft-delete via `@DeleteDateColumn`. Pagination via shared `PaginatedResponse<T>` from `src/utils/types/paginated-response.type.ts`.

**Acceptance criteria:**
- [ ] `POST /admin/users` creates user, returns 201.
- [ ] `GET /admin/users?page=1&limit=20` returns `{ data, total, page, limit, has_more }`.
- [ ] `GET /admin/users?email=foo` filters case-insensitively.
- [ ] `PATCH /admin/users/:id` allows partial updates; password change re-hashes.
- [ ] `DELETE /admin/users/:id` soft-deletes; subsequent `GET` excludes by default.
- [ ] Email uniqueness check: duplicate insert → 422.
- [ ] All routes set `created_by`/`updated_by`/`deleted_by` from `@CurrentUser()`.

**Verification:**
- [ ] e2e curl flow: create → list (sees new) → update name → list (sees update) → delete → list (no longer sees).
- [ ] Duplicate email → 422 with clear error.

**Dependencies:** Task 6.

**Files:**
- `src/users/controllers/admin-users.controller.ts`
- `src/utils/types/paginated-response.type.ts`
- `src/users/users.service.ts` (extend)
- `src/users/persistence/repositories/user.repository.ts` (extend)

**Scope:** M (4 files, mostly extension).

---

### Task 8: Self-service users + `/users/me/permissions`

**Description:** `/api/v1/users/me` (GET, PATCH) and `/api/v1/users/me/permissions` (GET — flat array of permission codes for frontend UI gating). JWT-only, no permission gate.

**Acceptance criteria:**
- [ ] `GET /users/me` returns full profile including role and permissions.
- [ ] `PATCH /users/me` accepts only `first_name`, `last_name`, `password` (rejects `role_id`, `email`, `system_admin`).
- [ ] Password change re-hashes via service.
- [ ] `GET /users/me/permissions` returns `{ permissions: ['USER:View', ...] }` — flat array, not nested role.
- [ ] An authenticated employee can call all three; no `PermissionsGuard` is involved.

**Verification:**
- [ ] curl as employee → `/users/me` → 200 with own data.
- [ ] curl as employee → `PATCH /users/me` with `{ "role_id": 1 }` → 400 (forbidden field).
- [ ] curl as employee → `/users/me/permissions` → 200 with empty array (employee has none).

**Dependencies:** Task 6.

**Files:**
- `src/users/controllers/users.controller.ts`
- `src/users/dto/update-me.dto.ts`

**Scope:** S (2 files).

---

### Task 9: Admin Roles CRUD + assign-permissions

**Description:** `/api/v1/admin/roles` with full CRUD + `POST /:id/permissions` to assign a permissions list (replaces existing). Gated by `@Permissions({ ROLE: '...' })`. Loading uses `relations: ['permissions']`.

**Acceptance criteria:**
- [ ] CRUD endpoints behave identically to admin users (paginated list, filter, soft-delete).
- [ ] `POST /:id/permissions` with `{ permission_ids: [...] }` replaces the role's permission set.
- [ ] Cannot delete `SUPER_ADMIN` (server-side guard) → 403.
- [ ] Invalid `permission_ids` → 422 with which IDs were unknown.

**Verification:**
- [ ] Create new role `SUPERVISOR`, assign `USER:View`, then `GET /admin/users` succeeds with that role's user.
- [ ] Attempt delete `SUPER_ADMIN` → 403.

**Dependencies:** Task 6.

**Files:**
- `src/roles/controllers/admin-roles.controller.ts`
- `src/roles/roles.service.ts` (extend)
- `src/roles/persistence/repositories/role.repository.ts` (extend)

**Scope:** M (3 files).

---

### Task 10: Admin Permissions read + update

**Description:** `/api/v1/admin/permissions` read-only listing + `PATCH /:id` (description only). Permissions are seed-managed; no Create/Delete from API.

**Acceptance criteria:**
- [ ] `GET /admin/permissions?resource=USER` filters by resource.
- [ ] `PATCH /admin/permissions/:id` updates `description`; rejects updates to `code`, `resource`, `action`.
- [ ] Pagination consistent with users/roles.

**Verification:**
- [ ] Update description, re-fetch, see the new value.
- [ ] Attempt `PATCH` with `{ "code": "EVIL" }` → 400.

**Dependencies:** Task 6.

**Files:**
- `src/permissions/controllers/admin-permissions.controller.ts` (already created in Task 6, now extend)

**Scope:** S (1 file).

---

### Checkpoint C: CRUD surfaces

- [ ] All four resources have working endpoints.
- [ ] Admin → create user → assign role → user can access resources matching role.
- [ ] Pagination consistent across list endpoints.
- [ ] Audit fields populated on every write.

---

### Task 11: `/auth/register`

**Description:** Public registration. Default role `EMPLOYEE`. Email lowercased; password hashed; throttled 5/min.

**Acceptance criteria:**
- [ ] `POST /api/v1/auth/register` with valid body → 201, returns `{ access_token, refresh_token, user }`.
- [ ] Email already exists → 422.
- [ ] `confirm_password` mismatch → 400.
- [ ] Registered user has role `EMPLOYEE` and `system_admin: false`.

**Verification:**
- [ ] curl register `emp@asima.local` → 201 + tokens.
- [ ] Same email again → 422.

**Dependencies:** Task 5.

**Files:**
- `src/auth/auth.service.ts` (extend)
- `src/auth/auth.controller.ts` (extend)
- `src/auth/dto/register.dto.ts`

**Scope:** S (3 files, mostly extension).

---

### Task 12: `/auth/refresh` with rotation

**Description:** Separate `JwtRefreshStrategy` (own secret, longer expiry). `/auth/refresh` validates the refresh JWT, looks up the user, and issues a NEW access token AND a new refresh token. Old refresh token remains technically valid until expiry (acceptable for stateless v0); document this clearly.

**Acceptance criteria:**
- [ ] `POST /api/v1/auth/refresh` with `Authorization: Bearer <refresh>` → 200 with new pair.
- [ ] Access token used as refresh → 401 (wrong audience/secret).
- [ ] Refresh after user is soft-deleted → 401.
- [ ] Throttled at 20/min per IP.

**Verification:**
- [ ] curl `/auth/refresh` with refresh token → new pair.
- [ ] Verify new access token is different from previous.
- [ ] Soft-delete the user, retry refresh → 401.

**Dependencies:** Task 5.

**Files:**
- `src/auth/strategies/{jwt-refresh.strategy.ts, types/jwt-refresh-payload.type.ts}`
- `src/auth/auth.service.ts` (extend)
- `src/auth/auth.controller.ts` (extend)
- `src/auth/dto/refresh-response.dto.ts`

**Scope:** M (4 files).

---

### Task 13: `/auth/logout` (no-op)

**Description:** `POST /api/v1/auth/logout` returns 204 with a clear OpenAPI description: "Stateless v0 — frontend MUST discard tokens locally. v1 will introduce server-side revocation."

**Acceptance criteria:**
- [ ] Endpoint returns 204.
- [ ] Swagger docstring explicitly states the stateless behavior.

**Verification:**
- [ ] `curl -X POST /api/v1/auth/logout -H "Authorization: Bearer $ACCESS" -i` → 204.

**Dependencies:** Task 5.

**Files:** `src/auth/auth.controller.ts` (one method).

**Scope:** XS (1 file change).

---

### Checkpoint D: Auth completeness

- [ ] Full journey: register → login → use access → refresh → use new access → logout.
- [ ] All four auth routes documented in Swagger.

---

### Task 14: Multi-stage Dockerfile + entrypoint

**Description:** `docker/Dockerfile` (Node 20-alpine, builder + runner). `docker/entrypoint.sh` runs migrations, optionally seeds (if `SEED_ON_BOOT=true`), then starts the app. `.dockerignore` excludes `node_modules`, `dist`, `reference`, etc.

**Acceptance criteria:**
- [ ] `docker build -f docker/Dockerfile -t asima-api:dev .` succeeds.
- [ ] Final image size < 250 MB.
- [ ] Container running with `DATABASE_HOST=host.docker.internal` connects to host Postgres for a one-off test.
- [ ] `entrypoint.sh` is idempotent on restart (migrations skip if up-to-date).

**Verification:**
- [ ] Build succeeds; check image size with `docker images`.
- [ ] `docker run --rm -e DATABASE_HOST=host.docker.internal --env-file .env asima-api:dev` boots and passes `/health`.

**Dependencies:** Task 1 (and ideally all earlier tasks, since the container needs migrations + seeds to exist).

**Files:**
- `docker/Dockerfile`
- `docker/entrypoint.sh`
- `.dockerignore`

**Scope:** S (3 files).

---

### Task 15: `docker-compose.yml` end-to-end

**Description:** Two services: `asima-postgres` (postgres:16-alpine, healthcheck via `pg_isready`, named volume) and `asima-api` (build from Dockerfile, env_file, depends_on with `service_healthy`, exposes 3000). API container also has its own healthcheck that curls `/api/v1/health`.

**Acceptance criteria:**
- [ ] `docker compose up --build` brings both up; API waits for DB to be healthy.
- [ ] `docker compose ps` shows `asima-postgres (healthy)` and `asima-api (healthy)`.
- [ ] `curl localhost:3000/api/v1/health` from host → 200.
- [ ] `docker compose down -v` cleans state; next `up` re-seeds correctly.

**Verification:**
- [ ] Run the full sequence above from a fresh state.

**Dependencies:** Task 14.

**Files:**
- `docker-compose.yml`

**Scope:** XS (1 file).

---

### Task 16: e2e smoke test

**Description:** One Jest e2e file (`test/auth.e2e-spec.ts`) that boots `AppModule` against a test database and exercises: login → use access on `/auth/me` → refresh → 403 path. Configured to run via `npm run test:e2e`.

**Acceptance criteria:**
- [ ] `npm run test:e2e` boots the app against a Postgres test schema and passes 4 assertions.
- [ ] Test seeds its own data; no dependency on dev seed running.
- [ ] Runs in < 30 seconds locally.

**Verification:**
- [ ] Run `npm run test:e2e` → green.

**Dependencies:** Tasks 6, 11, 12 (needs login, register, refresh, gated route).

**Files:**
- `test/auth.e2e-spec.ts`
- `test/jest-e2e.json`
- `test/test-setup.ts` (DB cleanup helper)

**Scope:** M (3 files).

---

### Task 17: README + CI + finalize

**Description:** Write `README.md` with architecture pointer, quick start, env table, default seeded creds (with prominent rotation warning), v1 roadmap. Add `.github/workflows/ci.yml` (install → build → lint → test). Pin `engines: { node: '>=20' }`. Audit `.gitignore`.

**Acceptance criteria:**
- [ ] README covers: prereqs, quick start (Docker + host modes), env table, architecture rule pointer, seeded creds + rotation warning, v1 roadmap.
- [ ] CI workflow runs on PR + push to main, executes `npm ci && npm run build && npm run lint && npm run test`.
- [ ] `package.json` has `"engines": { "node": ">=20" }`.

**Verification:**
- [ ] Create a throwaway PR; CI runs green.
- [ ] `nvm use 18 && npm install` warns about engine mismatch.

**Dependencies:** All previous tasks.

**Files:**
- `README.md`
- `.github/workflows/ci.yml`
- `package.json` (engines field)
- `.gitignore`

**Scope:** S (4 files).

---

### Checkpoint E (Final): v0 complete

- [ ] Fresh `git clone` → `cp .env.example .env` → `docker compose up --build` → all 14 verification steps from the previous plan pass.
- [ ] CI green.
- [ ] README walks a new contributor from zero to running locally in < 5 min.
- [ ] **Human approval before tagging v0.**

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `JwtStrategy.validate` forgets to load `role.permissions` → silent 403s on every gated route | High | Task 6 acceptance criteria explicitly verify the negative path. e2e test in Task 16 also catches this. |
| Migration drift between dev (synchronize accidentally on) and prod | High | `synchronize: false` always. Single source of truth in `data-source.ts`. Lint check in CI for `synchronize: true` strings. |
| `password_hash` accidentally exposed via `findById` or response serialization | High | `select: false` on the column. `UserMapper.toDomain` never copies it (Task 4 unit test). Code review before merging Task 4. |
| Email case-sensitivity bug (`Admin@asima.local` vs `admin@asima.local`) | Med | Normalize to lowercase in service-layer `create` and `findByEmail`. e2e test in Task 16 covers mixed case. |
| Refresh-token rotation doesn't actually rotate (returns same token) | Med | Task 12 acceptance criterion explicitly checks "new access token is different". |
| Docker `entrypoint.sh` runs migrations on every container start, racing with another instance | Low | v0 runs single instance. Document the race in README; Phase 6 (post-v0) adds an init container or migration-as-Job pattern. |
| Bcrypt cost too low (perf) or too high (DOS) | Low | Cost 10 = ~70ms — matches reference, fine for v0. |
| Permissions seed JSON drifts from code that references codes | Med | Generate a `Permission` enum at build time from the JSON in v1. For v0, a single test asserts every code in the JSON exists in code. |

## Open questions

1. **Default super admin password rotation** — should we force a password change on first login? Currently the plan ships with a default that the README warns to change. Do you want a forced-rotation flow in v0 or accept the warning-only approach?
2. **Multi-tenancy** — is asima single-tenant or do we need to plan for `organization_id` on every entity now? Adding it later is painful. (Recommended answer: single-tenant for v0.)
3. **Soft-delete on permissions** — useful or noise? (Recommended: skip — permissions are seed-managed.)
4. **Logging stack** — pino, winston, or NestJS default? (Default is fine for v0; revisit when load matters.)
5. **API versioning policy** — when do we cut `v2`? Document the policy in README so frontend devs know what's stable.

## Parallelization opportunities

- **Sequential (must be in order):** Tasks 1 → 2 → 3 → 4 → 5 → 6. Each unlocks the next.
- **Safe to parallelize after Task 6:** Tasks 7, 8, 9, 10 are independent CRUD slices on different resources.
- **Safe to parallelize after Task 5:** Tasks 11, 12, 13 (auth completeness) — different routes.
- **Safe to parallelize after Tasks 6 + 11 + 12:** Task 14 (Dockerfile) can start; Task 16 (e2e) needs all auth routes.
- **Always last:** Task 17 (README + CI) — depends on full picture.

## Success metrics for v0

- All 17 tasks complete; all 5 checkpoints passed.
- Single-command bring-up: `docker compose up --build` → API healthy → seeded admin can log in.
- Architecture rule holds: `grep -rE "@nestjs|typeorm" src/*/domain/` returns nothing.
- e2e smoke test green; CI green.
- README walks a new contributor from zero to running locally in < 5 min.
