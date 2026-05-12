# asima-backend

NestJS 10 + TypeORM 0.3 + PostgreSQL 16. Node ≥ 20. Hexagonal per module.

System-level context (cross-cutting concepts, terminology, API conventions)
lives in the parent `CLAUDE.md`. This file is **backend-only rules**.

## Hexagonal layout (non-negotiable)

Every feature module mirrors this shape:

```
src/<feature>/
├── domain/                 # pure TS — no @nestjs/* runtime, no typeorm
│   ├── <feature>.ts                   # domain class
│   ├── <feature>-search-criteria.ts   # filter shape
│   └── find-all-<feature>.ts          # PaginatedResponse alias
├── persistence/
│   ├── entities/<feature>.entity.ts          # TypeORM @Entity
│   ├── mappers/<feature>.mapper.ts           # toDomain / toPersistence
│   ├── repositories/<feature>.repository.ts  # concrete impl
│   ├── base-<feature>.repository.ts          # abstract port
│   └── persistence.module.ts                 # binds Base→Concrete
├── dto/                    # class-validator inputs
├── controllers/            # @Controller({ version: API_VERSION })
├── <feature>.service.ts    # depends on Base*Repository (the port)
├── <feature>.module.ts
└── <feature>.constants.ts  # if the module has stable enums
```

Reference exemplar: `src/permissions/` (already in tree). When unsure how a
new piece fits, mirror what permissions does. The original blueprint is
`module-architecture.md`; the categories prototype in `reference/` is a
deeper pattern source — read but never import from `reference/`.

### The rules that make this work

1. **Domain has zero `@nestjs/*` runtime imports and zero `typeorm`
   imports.** `@nestjs/swagger` decorators are the only allowed exception
   (they're stripped at runtime). Putting `@Injectable()` or `@Entity()` on
   a domain class breaks every test that mocks the repository.
2. **Service depends on the abstract `Base<Feature>Repository`.** The
   concrete repository extends it; the persistence module binds them with
   `{ provide: BaseFooRepository, useClass: FooRepository }`. Tests mock
   the abstract — that's the whole point of the port.
3. **Every cross-layer hop goes through a mapper.** `toDomain(entity)` on
   the way out, `toPersistence(domain)` on the way in. Repositories never
   return entities; controllers never see entities.
4. **Snake_case end-to-end.** DB columns, domain field names, and JSON
   payloads all use `created_at`, `password_hash`, `is_active`. Don't add a
   naming-strategy plugin to translate.
5. **Audit fields on every entity from day 1.** `created_by`, `updated_by`,
   `deleted_by` (FK to users). Soft delete via `deleted_at`. Adding these
   later is a painful migration. Permissions are the only exception — they
   are seed-managed configuration, not user data.
6. **Definite-assignment (`!`) on every field of a data class.**
   Domain classes, TypeORM entities, and DTOs are populated by mappers,
   `class-transformer`, or TypeORM's reflective `repo.create()` — never
   by a constructor. TypeScript can't see those assignments, so
   `strictPropertyInitialization` (correctly) flags every field whose
   type doesn't already include `undefined`. The fix is `!`, applied at
   the field — not turning the check off:

   ```ts
   id!: number;                    // non-nullable    → needs !
   email!: string;                 // non-nullable    → needs !
   title!: string | null;          // nullable        → STILL needs ! (null ≠ undefined)
   last_login_at?: Date;           // optional        → no ! (the ? makes it undefined-able)
   ```

   Critical nuance: `field: string | null` does NOT include `undefined`,
   so it still requires `!`. `field?: string` is the only shape that
   doesn't — and we rarely use it on domain classes because the wire
   contract is "the field is always present, sometimes null."

   Why `!` and not turn the flag off: the flag is the safety net for
   real classes (services, factories, guards) where forgetting to
   initialize a field IS a bug. `!` says "a framework populates this" —
   which is true for entities/DTOs/domain, and false everywhere else.
   `tsconfig.json` keeps `strictPropertyInitialization: true` so CI
   catches anyone who skips `!` on a new field.

## Path alias

`@/` resolves to `src/`. Use it everywhere — never `../../../config/...`.
Configured in `tsconfig.json`, `nest-cli.json`, and Jest's
`moduleNameMapper`.

## Permissions / roles

- Code shape: `RESOURCE:Action` (e.g. `USER:Create`). Resource axis lives
  in `permissions/permissions.constants.ts`; action axis is
  Create/View/Update/Delete.
- Permissions seeded from `src/database/seeds/data/permissions.json`.
  Adding a permission = JSON edit + `npm run seed`. No migration, no
  controller change.
- Seeds **must be idempotent** — upsert by natural key (code, name).
  Re-running `npm run seed` should be a no-op.
- Roles → permissions M2M via `role_permissions`. v0 ships
  `SUPER_ADMIN` / `ADMIN` / `EMPLOYEE`; ADR 0001 evolves this to add
  `HR_ADMIN`, `PROJECT_MANAGER`, `TECHNICAL_DIRECTOR`.
- `SUPER_ADMIN` short-circuits `PermissionsGuard` via `system_admin: true`
  on the user record (lands with the user module).

## Auth

- Stateless JWT. Access 15m, refresh 7d. `/auth/refresh` rotates the
  refresh token alongside the new access token.
- No `refresh_tokens` / sessions table in v0 — single-token revocation
  isn't possible yet. Don't add session storage without ADR.
- `bcryptjs` (not native `bcrypt`) — avoids Alpine native build pain.
- `password_hash` column has `select: false`. Only
  `findByEmailWithCredentials` and `findByIdWithCredentials` opt in via
  `addSelect`.
- Email is normalized to lowercase at the **service layer** before save.
  No `citext` extension; no DB-level case folding.

## Auth & guards — pipeline

Three guards run on every request, **in this order** (registered as
`APP_GUARD` in `app.module.ts`):

1. **`ThrottlerGuard`** — IP-keyed rate limit. Three named tiers:
   - `default` 60/min — applies globally to everything.
   - `login` 10/min — applied per-route via `@Throttle({ login: ... })`
     on `POST /auth/login`.
   - `refresh` 20/min — applied per-route on `POST /auth/refresh`.
   - Routes that monitors hit must use `@SkipThrottle()` (e.g. `/health`).
2. **`JwtAuthGuard`** — verifies the access token and populates
   `req.user`. Honors the `@Public()` decorator from
   `@/utils/decorators/public.decorator.ts` — public routes pass through
   unauthenticated. **Two routes are `@Public()`:**
   - `POST /auth/login` (no token to send yet).
   - `POST /auth/refresh` (uses `JwtRefreshGuard` instead, which verifies
     the refresh token against `AUTH_REFRESH_SECRET` rather than the
     access secret).
3. **`PermissionsGuard`** — reads the `@Permissions(...)` metadata via
   Reflector. No metadata → pass (auth is the only gate). Metadata
   present → every required `RESOURCE:Action` code must be in
   `req.user.role.permissions` (AND-semantics). `system_admin: true`
   bypasses unconditionally — reserved for ops/infra.

### What this means for new controllers

- **Default to gated.** Every new admin route just needs the right
  `@Permissions(...)` decorator — `JwtAuthGuard` is already global.
- **Self-service routes need no decorator.** Identity-only gating
  happens automatically because the global `JwtAuthGuard` populates
  `req.user`, and `PermissionsGuard` passes when no `@Permissions(...)`
  is set.
- **Use `@Public()` sparingly.** Only the auth login + refresh routes
  and the health probe should opt out. Don't add it for "admin tools"
  or "internal endpoints" — those should be gated by `@Permissions(...)`.
- **Never apply `@UseGuards(JwtAuthGuard)` per-route.** It's already
  global. Per-route usage of `@UseGuards(JwtRefreshGuard)` IS correct
  on `/auth/refresh` — that's a different strategy.

## Controllers

- All controllers use `@Controller({ path: '...', version: API_VERSION })`
  importing `API_VERSION` from `@/utils/constants/api.constants`. Single
  source of truth — when v2 ships, split into per-version constants and
  hardcode the version per controller.
- Admin endpoints under `admin/` (e.g. `admin/permissions`,
  `admin/roles`, `admin/users`). Self-service under `users/me`.
- Swagger annotations (`@ApiTags`, `@ApiOperation`, `@ApiResponse`,
  `@ApiBearerAuth`) on every public route.

## Admin / self-service split — folder convention

When a resource exposes both admin-management AND self-service surfaces
(parent `CLAUDE.md` describes the principle), the module folder is laid
out so the audience boundary is *physical*, not conditional. Reference
implementation: `src/users/` (admin CRUD + `/me` profile + password).

```
src/<feature>/
├── domain/                              # ONE domain class — shared.
├── persistence/                         # ONE repo + mapper — shared.
├── dto/
│   ├── admin/                           # wide field set — admin-only.
│   │   ├── create-<feature>.dto.ts
│   │   ├── update-<feature>.dto.ts
│   │   ├── reset-<feature>-password.dto.ts   # if applicable
│   │   └── query-<feature>.dto.ts
│   └── me/                              # narrow field set — self-service.
│       ├── update-me.dto.ts
│       └── change-my-password.dto.ts    # if applicable
├── controllers/
│   ├── admin-<feature>.controller.ts    # /admin/<feature>, USER:* gated.
│   └── me-<feature>.controller.ts       # /<feature>/me, JWT-only.
└── <feature>.service.ts                 # ONE service — both controllers depend on it.
```

### The rules that make this work

1. **DTOs are grouped by audience folder, not by verb.** `dto/admin/` and
   `dto/me/` are separate directories. Never share a single DTO file
   between admin and self-service routes — the audience is part of the
   contract, and conditional `@IsOptional()` doesn't enforce a security
   boundary.
2. **Self-service DTOs MUST omit privileged fields entirely.** The global
   `ValidationPipe` runs `forbidNonWhitelisted: true`, so any field not
   declared on the DTO is rejected with 400. That's how `PATCH /users/me`
   refuses `role_id` — not a runtime check, but the DTO not declaring it.
   Adding a field to a `me/*.dto.ts` is the same security boundary
   change as adding a route. Review accordingly.
3. **Self-service controllers key on `req.user.id`, never on a path
   parameter.** No `:id` segment on any `me-*` route. Identity comes
   from the JWT, period.
4. **Privileged operations get their own endpoint.** Password change is
   never a field on the generic update DTO. Self-service has
   `PATCH /<feature>/me/password` with current-password re-verification
   in the service; admin has `POST /admin/<feature>/:id/reset-password`
   with no such check. Never accept a `password` field inside an
   `Update<Feature>Dto` or `UpdateMeDto`.
5. **Both controllers share ONE service.** Business invariants (email
   uniqueness, role lookup, bcrypt hashing) live in the service and
   apply identically regardless of caller. Self-service-specific logic
   (e.g. `changeMyPassword` re-verifying the current password) gets its
   own service method — not an `if (isSelfService)` branch inside the
   shared one.
6. **Repository methods that load credentials are per-call-site.**
   `findByEmailWithCredentials` is for the login flow; `findByIdWithCredentials`
   is for self-service password change. Each is a distinct method using
   `addSelect('password_hash')` — there's no generic
   `findById({ withPassword: true })` flag, because the call sites are
   security-sensitive and worth grepping for explicitly.

## Pagination

`PaginatedResponse<T>` from `@/utils/types/paginated-response.type`. Shape:
`{ data, total, page, limit, has_more }`. Defaults from `PAGINATION_DEFAULTS`
(`page=1`, `limit=20`, `maxLimit=100`). Repository builds the response;
service and controller pass it through.

## Migrations & DB

- Generate: `npm run migration:generate src/database/migrations/<Name>`.
- Run: `npm run migration:run`. Revert: `npm run migration:revert`.
- Never `synchronize: true` — config defaults it off.
- Two TypeORM configs exist: `TypeOrmConfigService` (runtime, DI-driven)
  and `data-source.ts` (CLI-only, dotenv-driven). Keep them in sync.

### Migration naming convention (one operation per file)

Each migration file does **one schema operation on one table**. Never bundle
multiple tables or mix CREATE with ALTER in the same file. The class name
matches the filename (sans timestamp).

| Operation              | File / class name pattern                       | Example                              |
|------------------------|-------------------------------------------------|--------------------------------------|
| Create a table         | `Create<Plural>Table`                           | `CreateUsersTable`                   |
| Create a junction      | `Create<TableA><TableB>Table` (snake on disk)   | `CreateRolePermissionsTable`         |
| Add columns            | `Alter<Plural>TableAdd<What>`                   | `AlterUsersTableAddPhoneNumber`      |
| Drop columns           | `Alter<Plural>TableDrop<What>`                  | `AlterUsersTableDropTitle`           |
| Rename a column        | `Alter<Plural>TableRename<Old>To<New>`          | `AlterUsersTableRenameTitleToJobTitle` |
| Add index / FK         | `Alter<Plural>TableAdd<What>`                   | `AlterUsersTableAddRoleFk`           |
| Drop a table           | `Drop<Plural>Table`                             | `DropApprovalChainsTable`            |
| Rename a table         | `Rename<Old>TableTo<New>`                       | `RenameTimeEntriesTableToTimeLogs`   |

Junction tables (e.g. `role_permissions`) count as their own table and get
their own `Create…Table` migration — created **after** both parent tables
exist so the FKs can be added in the same file.

If a single feature touches multiple tables, ship multiple migration files
ordered by timestamp (lower = runs first). Splitting is cheaper to review,
cheaper to revert, and avoids "this one migration broke and now nothing
works" situations.

### Wipe and re-migrate (dev only)

When migrations get rewritten during early development, the schema and the
`migrations` ledger drift. The fix is to drop everything and re-apply from
scratch:

```bash
npm run db:fresh    # = schema:drop && migration:run && seed
```

What it does, in order:

1. `npm run schema:drop` — drops every table in the public schema, including
   the `migrations` ledger itself (so re-runs aren't skipped as "already
   applied").
2. `npm run migration:run` — replays every file under `src/database/migrations/`.
3. `npm run seed` — permissions → roles → users.

**This is destructive.** It wipes all data, including anything you typed into
TablePlus by hand. Never run `db:fresh` against a non-local database. There is
no production guard — the only thing protecting prod is your `.env` pointing
at the wrong host.

If you only want to drop without re-applying, use `npm run schema:drop`
on its own. If you need to nuke the volume too (e.g. Postgres extensions
got into a weird state), `docker compose down -v && npm run docker:up` is
the heavier option — but `db:fresh` is enough for normal schema resets.

### Wipe and re-migrate (dev only)

When migrations get rewritten during early development, the schema and the
`migrations` ledger drift. The fix is to drop everything and re-apply from
scratch:

```bash
npm run db:fresh    # = schema:drop && migration:run && seed
```

What it does, in order:

1. `npm run schema:drop` — drops every table in the public schema, including
   the `migrations` ledger itself (so re-runs aren't skipped as "already
   applied").
2. `npm run migration:run` — replays every file under `src/database/migrations/`.
3. `npm run seed` — permissions → roles → users.

**This is destructive.** It wipes all data, including anything you typed into
TablePlus by hand. Never run `db:fresh` against a non-local database. There is
no production guard — the only thing protecting prod is your `.env` pointing
at the wrong host.

If you only want to drop without re-applying, use `npm run schema:drop`
on its own. If you need to nuke the volume too (e.g. Postgres extensions
got into a weird state), `docker compose down -v && npm run docker:up` is
the heavier option — but `db:fresh` is enough for normal schema resets.

## Cross-cutting middleware / filters

- `RequestIdMiddleware` — generates/echoes `X-Request-ID` on every route.
  Don't strip the header in any future HTTP client.
- `helmet`, restricted CORS via `CORS_ALLOWED_ORIGINS`, body limit 50mb.
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`,
  `transform: true` — don't disable per route. If a DTO needs to accept a
  surprising shape, fix the DTO.
- `QueryFailedFilter` global filter — Postgres errors are sanitized.
- Throw the right Nest exception in services (`NotFoundException`,
  `BadRequestException`, `ForbiddenException`). The filter handles the rest.

## Logging

NestJS default `Logger` for v0 — console output, zero config. Upgrade to
`nestjs-pino` lands in v1 when a log destination exists. Don't introduce
a logger library without ADR.

## Testing

- Unit specs (`*.spec.ts`) co-located with `src/`.
- Service-level tests mock the abstract `Base*Repository`. That's the
  whole reason the port pattern exists — never mock the concrete class.
- Domain classes have no NestJS imports → trivially unit-testable with no
  DI graph.
- E2E: `npm run test:e2e` (config at `test/jest-e2e.json`, runs in band).
- Coverage: `npm run test:cov`.

## Swagger

`/docs` non-prod only (gated by `NODE_ENV !== 'production'`). Bearer auth
registered globally. If you add a route, add `@ApiOperation` and at least
one `@ApiResponse` — Swagger is the de-facto API contract for the frontend.

### Tag-naming convention (`@ApiTags`)

The Swagger UI clusters routes by tag — what you see as the gray bars
above each group of endpoints. Keep these consistent:

- **Admin-gated controllers** → `'Admin - <Resource>'`
  Examples: `Admin - Users`, `Admin - Roles`, `Admin - Permissions`.
  Hyphen with spaces, NOT slash. Slashes look like a path segment in
  the UI and confuse the visual grouping.
- **Self-service controllers** → plain `'<Resource>'`
  Example: `me-users.controller.ts` uses `@ApiTags('Users')` for
  `/users/me`. Don't tag it `'Users / Me'` or `'Self-service'` —
  the `/me` URL is the audience signal, the tag stays simple.
- **Cross-cutting** → single word: `'Auth'`, `'Health'`.

When adding a new admin controller, copy the pattern from
`admin-users.controller.ts` — class-level `@ApiTags('Admin - <Resource>')`.

### Schema grouping in the Swagger UI

The Swagger "Schemas" panel renders DTOs in the order the framework
discovers them, which produces a confusing flat list mixing
`LoginDto`, `Permission`, `CreateUserDto`, etc. We post-process the
OpenAPI document to cluster them by feature.

The grouping helper lives at
`src/utils/swagger/schema-groups.ts` and is wired in `main.ts` after
`SwaggerModule.createDocument(...)`. Each group is declared as
`{ name, schemas: [...] }`; the helper prefixes every schema name with
`[<group>]` and reorders `components.schemas` so groups render together.
All `$ref` paths in the document are rewritten to point at the new
keys — never reference a schema by its un-prefixed name elsewhere.

**When you add a new DTO:**

1. Decide which group it belongs to. Today's groups (in `main.ts`):
   - `Auth` — login / token DTOs.
   - `Admin - User` — admin CRUD payloads + the `User` domain class itself.
   - `User` — self-service DTOs (`/users/me` payloads).
2. Add the class name to that group's `schemas` array in `main.ts`.
   Order within the array is the display order — keep related DTOs
   adjacent (e.g. `CreateUserDto` next to `UpdateUserDto`).
3. If you're starting a brand-new group (e.g. `Admin - Role` once role
   write endpoints land), add a new `{ name, schemas: [...] }` entry
   to the array. Group order in the array is the render order in the UI.
4. Don't add a DTO to two groups — schemas are unique by name, the
   first group wins. The grouping is a UI convenience, not an
   ownership system.

**Schemas you can leave un-grouped:** anything that's purely internal or
not yet stable (e.g. `UpdatePermissionDto` while permissions are
seed-managed config). Un-grouped schemas render after all grouped ones,
in their original discovery order.

**Why post-process instead of `@ApiSchema({ name })`:** the project
pins `@nestjs/swagger` 7.4.x; `@ApiSchema` was added in 7.5.x. Post-
processing avoids a dependency bump while delivering the same UX. If
the version is ever bumped, the helper can be retired in favor of
class-level decorators — but the grouping convention itself stays the
same.

**Don't add display-only fields to `@ApiTags()` to fake grouping** —
e.g. `@ApiTags('[Admin] Users')`. The schema grouping handles the
visual organization; tags should stay clean and human-readable for
when frontend devs grep them.

## Commands

```
npm run start:dev          # watch mode
npm run docker:up          # postgres only (this app runs on the host in v0)
npm run docker:down
npm run migration:generate src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
npm run seed               # idempotent — safe to re-run
npm run lint               # eslint --fix
npm run test               # jest unit
npm run test:e2e           # jest e2e (in-band)
npm run test:cov
npm run build              # nest build → dist/
```

## Where to look first

- `tasks/plan.md` — phase plan, current task, acceptance criteria.
- `tasks/todo.md` — active queue.
- `docs/adr/` — read the matching ADR before changing roles, auth, or
  approval logic.
- `module-architecture.md` — the hexagonal blueprint.
- `reference/categories/` — pattern reference. Read for shape; do not import.

## Out of scope for v0

Don't introduce these without an ADR:

- Multi-tenancy / `organization_id` columns.
- A sessions / refresh-tokens table.
- A separate `titles` lookup table (titles stay freeform).
- A logger library beyond `nestjs/common`'s `Logger`.
- Any auth provider beyond local JWT (no OAuth, no SSO in v0).
- Forced password rotation / `must_change_password` (v1 roadmap).
