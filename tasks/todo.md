# asima-backend v0 — Task Checklist

Track progress here. Each task links to the detailed spec in `tasks/plan.md`.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Phase 0 — Walking Skeleton

- [ ] **Task 1** — Bootstrap + DB handshake + `/health` endpoint
  - [ ] `nest new` scaffold inside `asima-backend/`
  - [ ] tsconfig path alias `@/* → src/*`
  - [ ] Install prod + dev deps (see plan §1)
  - [ ] `src/config/{app,database}.config.ts` + `config.type.ts` with class-validator validation
  - [ ] `.env.example` (NODE_ENV, APP_PORT, API_PREFIX, CORS_ALLOWED_ORIGINS, DATABASE_*, AUTH_*)
  - [ ] `src/database/typeorm-config.service.ts` (synchronize:false)
  - [ ] `src/database/data-source.ts` (CLI DataSource with `import 'dotenv/config'`)
  - [ ] Port from reference: `EntityHelper`, `validate-config`, `validation-options`, `QueryFailedFilter`, `current-user.decorator`, `public.decorator`, `nullable.type`
  - [ ] `src/utils/constants/api.constants.ts` exports `API_VERSION = '1'` (used by every controller as `@Controller({ path: '...', version: API_VERSION })`)
  - [ ] `src/utils/middleware/request-id.middleware.ts` (gen/echo `X-Request-ID`)
  - [ ] `src/health/health.controller.ts` — pings DB, returns 503 if down
  - [ ] `src/main.ts` — helmet, CORS from config, ValidationPipe, URI versioning, prefix `api`, Swagger `/docs` (non-prod), 50mb body, request-id middleware
  - [ ] `src/app.module.ts` — ConfigModule global, TypeOrmModule.forRootAsync, ThrottlerModule (200/min global)
  - [ ] **Verify:** `docker compose up -d asima-postgres && npm run start:dev` → `curl /api/v1/health` 200 with `X-Request-ID`; stop DB → 503

---

## Phase 1 — Identity Foundation

- [ ] **Task 2** — Permissions module (entity → seed → admin GET)
  - [ ] Entity `permissions(id, code unique, resource, action, description, audit + timestamps)` + indexes
  - [ ] Domain `Permission` (no NestJS/TypeORM imports), search criteria, find-all types
  - [ ] `BasePermissionRepository` (abstract) + concrete impl
  - [ ] `PermissionMapper.toDomain` / `toPersistence`
  - [ ] `permissions.module.ts` with `PermissionPersistenceModule` sub-module
  - [ ] `PermissionsService` — findAll/findById/findByCodes/update
  - [ ] `src/database/seeds/data/permissions.json` — v0 codes (USER:*, ROLE:*, PERMISSION:View|Update)
  - [ ] `PermissionSeedService` (idempotent upsert by `code`)
  - [ ] `src/database/seeds/{seed.module.ts, run-seed.ts}`
  - [ ] First migration: `npm run migration:generate -- src/database/migrations/InitialSchema`
  - [ ] **Verify:** `npm run migration:run && npm run seed`; rerun is no-op; `psql` lists codes
  - [ ] `AdminPermissionsController` — `GET /api/v1/admin/permissions` (JWT-only for now; gate added in Task 6)

- [ ] **Task 3** — Roles module (entity → seed → admin GET)
  - [ ] Entity `roles(id, name unique, description, audit + timestamps)` + M2M `role_permissions`
  - [ ] Domain `Role` carries `permissions: Permission[]`
  - [ ] `BaseRoleRepository` + concrete; load with `relations: ['permissions']`
  - [ ] `RoleMapper.toDomain` calls `PermissionMapper.toDomain` per item
  - [ ] `roles.module.ts` + persistence sub-module
  - [ ] `RolesService` — full CRUD + `findByName` + `assignPermissions`
  - [ ] `RoleSeedService` upserts SUPER_ADMIN / ADMIN / EMPLOYEE (idempotent perm assignments)
  - [ ] **Verify:** double-seed no-ops; SQL counts permissions per role correctly
  - [ ] `AdminRolesController` — `GET /api/v1/admin/roles` (gate in Task 9)

- [ ] **Task 4** — Users module (entity → seed default super admin)
  - [ ] Entity `users(id, email lowercased+unique, password_hash select:false, first/last_name, role_id FK, system_admin, status, timestamps + soft-delete + audit)`
  - [ ] Domain `User` — NO `password_hash` field
  - [ ] `BaseUserRepository` + concrete; `findByEmailWithCredentials` uses `addSelect`
  - [ ] `UserMapper.toDomain` does NOT copy `password_hash`
  - [ ] Unit test: `test/unit/users/user.mapper.spec.ts` asserts hash never leaks
  - [ ] `users.module.ts` + persistence sub-module
  - [ ] `UsersService` — bcrypt cost 10, lowercase email on save, throw `UnprocessableEntityException` on dupe
  - [ ] `UserSeedService` — env-driven super admin, idempotent
  - [ ] **Verify:** seed creates admin with `system_admin: true`, role `SUPER_ADMIN`; rerun skips

- [ ] **Task 5** — Auth login + `/auth/me`
  - [ ] `auth.config.ts` (4 secrets/expiries)
  - [ ] DTOs: `LoginDto`, `LoginResponseDto`
  - [ ] `JwtStrategy` validates and loads `relations: ['role', 'role.permissions']`
  - [ ] `AuthService.login` — bcrypt compare, reject non-Active / soft-deleted
  - [ ] `AuthController` — `POST /auth/login` (Throttle 10/min), `GET /auth/me` (`AuthGuard('jwt')`)
  - [ ] **Verify:** seeded admin login → tokens; wrong password → 401; `/auth/me` → role + permissions

### ☑ Checkpoint A — Identity foundation
- [ ] Login as seeded admin returns tokens
- [ ] `/auth/me` shows role + permission codes
- [ ] Swagger lists Auth + Health
- [ ] **Human review before continuing**

---

## Phase 2 — Authorization Gate

- [ ] **Task 6** — `PermissionsGuard` + `@Permissions` decorator + verify 403 path
  - [ ] `permissions.decorator.ts` — `@Permissions(...reqs: PermissionRequirement[])`
  - [ ] `permissions.guard.ts` — Public bypass → user check → `system_admin` bypass → match `RESOURCE:Action`
  - [ ] Apply to `GET /admin/permissions` (Task 2's endpoint)
  - [ ] Support multi-action: `@Permissions({ USER: ['Create', 'Update'] })`
  - [ ] **Verify:** admin → 200; employee (temporarily seed one) → 403; `system_admin` user always passes

### ☑ Checkpoint B — Authorization
- [ ] Positive + negative paths verified
- [ ] No regression on `/auth/me`

---

## Phase 3 — CRUD Surfaces (parallelizable after Task 6)

- [ ] **Task 7** — Admin Users CRUD
  - [ ] `src/utils/types/paginated-response.type.ts` — shared `{ data, total, page, limit, has_more }`
  - [ ] DTOs: `CreateUserDto`, `UpdateUserDto`, `QueryUserDto` (with `@Transform`)
  - [ ] `AdminUsersController` — POST/GET list/GET one/PATCH/DELETE under `/api/v1/admin/users`
  - [ ] All routes set `created_by`/`updated_by`/`deleted_by` from `@CurrentUser()`
  - [ ] Filter: `?email=` case-insensitive (ILIKE)
  - [ ] **Verify:** create → list → update → soft-delete → list excludes; dupe email → 422

- [ ] **Task 8** — Self-service users
  - [ ] `UpdateMeDto` — only `first_name`, `last_name`, `password` (whitelist; reject extras via `forbidNonWhitelisted`)
  - [ ] `UsersController` — `GET /users/me`, `PATCH /users/me`, `GET /users/me/permissions` (flat array)
  - [ ] **Verify:** employee can call all three; `PATCH` with `role_id` → 400; `/me/permissions` returns flat codes

- [ ] **Task 9** — Admin Roles CRUD + assign-permissions
  - [ ] DTOs: `CreateRoleDto`, `UpdateRoleDto`, `AssignPermissionsDto`, `QueryRoleDto`
  - [ ] `AdminRolesController` — full CRUD + `POST /:id/permissions`
  - [ ] Server-side guard: cannot delete `SUPER_ADMIN` (throw `ForbiddenException`)
  - [ ] Validate `permission_ids` exist; report unknowns
  - [ ] **Verify:** create role, assign perms, user with that role can access matching endpoints; delete SUPER_ADMIN → 403

- [ ] **Task 10** — Admin Permissions update
  - [ ] `UpdatePermissionDto` — only `description` (others stripped via whitelist)
  - [ ] Extend `AdminPermissionsController` with `PATCH /:id`
  - [ ] Filter `?resource=USER` on list endpoint
  - [ ] **Verify:** description update persists; `code/resource/action` updates → 400

### ☑ Checkpoint C — CRUD surfaces
- [ ] All four resources have working endpoints
- [ ] Admin → create user → assign role → user accesses matching resources
- [ ] Pagination consistent
- [ ] Audit fields populated on every write

---

## Phase 4 — Auth Completeness (parallelizable after Task 5)

- [ ] **Task 11** — `/auth/register`
  - [ ] `RegisterDto` with `confirm_password` cross-field check
  - [ ] `AuthService.register` — default role `EMPLOYEE`, lowercase email, hash, return tokens
  - [ ] Throttle 5/min
  - [ ] **Verify:** new email → 201 + tokens; dupe → 422; password mismatch → 400

- [ ] **Task 12** — `/auth/refresh` with rotation
  - [ ] `JwtRefreshStrategy` — separate secret/expiry
  - [ ] DTO: `RefreshResponseDto`
  - [ ] `AuthService.refresh` — verify, reject if user soft-deleted/inactive, issue NEW pair
  - [ ] Throttle 20/min
  - [ ] **Verify:** new pair returned; new access ≠ old access; access-as-refresh → 401; soft-delete user → 401

- [ ] **Task 13** — `/auth/logout` (no-op)
  - [ ] Endpoint returns 204
  - [ ] OpenAPI description states stateless behavior + frontend responsibility
  - [ ] **Verify:** 204 with valid bearer

### ☑ Checkpoint D — Auth completeness
- [ ] Full journey: register → login → access → refresh → access → logout
- [ ] All four auth routes documented in Swagger

---

## Phase 5 — Production Readiness

- [ ] **Task 14** — Dockerfile + entrypoint
  - [ ] `docker/Dockerfile` — multi-stage Node 20-alpine, builder + runner
  - [ ] `docker/entrypoint.sh` — `migration:run` always; seed if `SEED_ON_BOOT=true`; `exec node dist/main.js`
  - [ ] `.dockerignore` — `node_modules dist .git .env reference *.md test coverage`
  - [ ] **Verify:** `docker build` succeeds; image < 250 MB; container connects to host Postgres for smoke

- [ ] **Task 15** — `docker-compose.yml`
  - [ ] `asima-postgres` (postgres:16-alpine, `pg_isready` healthcheck, named volume `asima-pgdata`)
  - [ ] `asima-api` (build, env_file, `DATABASE_HOST=asima-postgres`, depends_on healthy, port 3000)
  - [ ] API container healthcheck curls `/api/v1/health`
  - [ ] **Verify:** `docker compose up --build` → both healthy; `curl localhost:3000/api/v1/health` → 200; `down -v` then `up` re-seeds clean

- [ ] **Task 16** — e2e smoke test
  - [ ] `test/jest-e2e.json`
  - [ ] `test/test-setup.ts` — DB schema cleanup helper
  - [ ] `test/auth.e2e-spec.ts` — login → `/auth/me` → refresh → 403 path
  - [ ] **Verify:** `npm run test:e2e` green in < 30s

- [ ] **Task 17** — README + CI + finalize
  - [ ] `README.md` — overview, prereqs, quick start (host + Docker), env table, default creds + rotation warning, architecture pointer to `module-architecture.md`, v1 roadmap
  - [ ] `.github/workflows/ci.yml` — install, build, lint, test on PR + push to main
  - [ ] `package.json` — `"engines": { "node": ">=20" }`
  - [ ] Audit `.gitignore` (`.env`, `dist`, `node_modules`, `coverage`)
  - [ ] **Verify:** throwaway PR → CI green; `nvm use 18 && npm install` warns engine

### ☑ Checkpoint E (Final) — v0 complete
- [ ] Fresh clone → `docker compose up --build` → all 14 verification steps from `plan.md` §15 pass
- [ ] CI green
- [ ] README gets a new contributor running locally in < 5 min
- [ ] **Human approval before tagging v0**

---

## Progress summary

| Phase | Tasks | Done |
|---|---|---|
| 0 — Walking Skeleton | 1 | 0 / 1 |
| 1 — Identity Foundation | 4 | 0 / 4 |
| 2 — Authorization Gate | 1 | 0 / 1 |
| 3 — CRUD Surfaces | 4 | 0 / 4 |
| 4 — Auth Completeness | 3 | 0 / 3 |
| 5 — Production Readiness | 4 | 0 / 4 |
| **Total** | **17** | **0 / 17** |

## Open questions (block on these before relevant tasks)

- [x] Q1: Force password rotation for default super admin on first login? → **No** for v0 (README warns; revisit in v1 before any real deployment)
- [x] Q2: Multi-tenancy now or later? → **Single-tenant for v0** (no `organization_id` columns)
- [x] Q3: Soft-delete on permissions? → **Skip** (permissions are seed-managed configuration; history lives in git)
- [x] Q4: Logging library? → **NestJS default `Logger`** for v0; upgrade to `nestjs-pino` in v1 when log destination exists
- [x] Q5: API versioning policy? → Shared `API_VERSION = '1'` constant in `src/utils/constants/api.constants.ts`, imported by every controller. When v2 ships, split into per-version constants.
