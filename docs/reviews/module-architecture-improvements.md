# Module Architecture Improvements — `src/users/`

**Reviewed:** 2026-05-12
**Scope:** every file under `asima-backend/src/users/` (19 files), plus
ripple effects in the user seeder and global throttler config.
**Reviewer:** five-axis (correctness, readability, architecture, security,
performance).

This document is the reference for the audit and the executed fixes. The
findings are kept as a checklist so future reviews can re-run the same
questions against neighbouring modules (roles, time-entries, and the
leave module when it lands).

---

## Is this DDD?

**No — it's hexagonal (ports & adapters) with a transaction-script
service. The `asima-backend/CLAUDE.md` is honest about this and never
claims DDD.**

What the module gets right (and intends to keep):

- **Ports & adapters:** `BaseUserRepository` is the port,
  `UserRepository` the adapter, bound by `UserPersistenceModule`. The
  service depends on the abstract.
- **Mapper at the seam:** `UserMapper.toDomain` keeps the TypeORM
  entity out of the service.
- **Pure-TS domain:** `domain/user.ts` only carries `@nestjs/swagger`
  decorators (runtime-stripped — allowed by the project rules).

What's missing if you wanted DDD (and why we are deliberately not
adding it):

- **Anemic domain model.** `User` is a public-field data bag with zero
  behaviour. No `User.changeEmail()`, no `User.activate()`, no
  invariants enforced inside the entity.
- **No value objects.** `Email`, `PasswordHash`, `RoleId` would be
  classic candidates — each is currently a primitive validated ad-hoc.
- **No aggregates / aggregate roots / domain events.** Business
  invariants (email uniqueness, role existence) live in the service,
  not the aggregate.
- **No ubiquitous-language methods.** `service.update(id, patch)` is
  CRUD vocabulary, not domain vocabulary like `promoteToHrAdmin`.

**Decision:** stay hexagonal. The product is CRUD-heavy identity
management; a rich domain model would be overhead with no payoff.
Resist `@Injectable()` or behaviour on `User`. If the leave/approval
module later carries genuine business rules (e.g. *"a leave request may
be approved only by an approver in the chain whose level ≤ the request
days"*), **that** is where a small dose of DDD (value objects,
aggregate invariants) pays rent. Not here.

---

## Findings & resolutions

Each finding is labelled `Critical / Important / Suggestion`. Critical
items block production; Important items should land before the module
sees real users; Suggestions are quality-of-life. All items below were
addressed in this pass.

### Critical

#### C1. `existsByEmail` ignored soft-deleted rows
`persistence/repositories/user.repository.ts` `existsByEmail` had no
`deleted_at IS NULL` predicate, but the entity-level unique index
covered all rows including soft-deleted. Soft-deleting `jane@asima.inc`
and then re-creating with the same email surfaces a raw 500 from
`QueryFailedFilter` instead of the friendly 422 the service intends.

**Resolution:** `existsByEmail` now filters `deleted_at IS NULL`.
Pairs with C2 below — service, repo, and index now agree.

#### C2. No DB-level case-insensitive uniqueness
Column-level `unique: true` treats `'Jane@…'` and `'jane@…'` as
distinct. The service normalises before save, but seeds / hand-edits /
direct migrations can bypass.

**Resolution:** added migration
`AlterUsersTableAddEmailLowerUniqueIndex` that drops the column-level
unique + naive `IDX_users_email` and creates
`CREATE UNIQUE INDEX users_email_lower_uq ON users (LOWER(email)) WHERE deleted_at IS NULL`.
Entity decorators updated to match (no more `unique: true`, no more
`@Index(['email'], { unique: true })`). The repo's
`LOWER(u.email) = LOWER(:email)` predicate now hits this index.

#### C3. `/users/me/password` was not rate-limited
The change-my-password flow accepts `current_password` for
re-verification — under the global 60/min throttle that is a
brute-force opportunity for a session-hijack attacker.

**Resolution:** registered a fourth throttler tier
`password { limit: 5, ttl: 60_000 }` in `app.module.ts`. Applied
`@Throttle({ password: ... })` to both
`PATCH /users/me/password` and `POST /admin/users/:id/reset-password`.

### Important

#### I1. Triplicated structural input types
The `create` and `update` shapes were declared verbatim three times
(service, base repo, concrete repo). Adding `phone_number` later would
mean editing four places.

**Resolution:** extracted to `src/users/domain/user-inputs.ts`:
- `CreateUserInput` — what the service accepts (carries `password`).
- `CreateUserPersistence` — what the repo writes (carries
  `password_hash`).
- `UpdateUserPatch` — what both layers share for partial updates.

#### I2. `UserMapper.toPersistence` was dead code
Never called — the repository builds entities directly via
`repo.create({...})`.

**Resolution:** deleted. Per CLAUDE.md guidance ("If you are certain
that something is unused, you can delete it completely"). If a second
write path ever appears, re-introduce it then.

#### I3. `UserMapper.toDomain` silently produced `undefined as never` for role
Type lie. Every current read path joins role, but the day someone
calls `findOne({ where: { id } })` without `relations: ['role']`,
downstream `user.role.permissions.map(...)` crashes at runtime.

**Resolution:** mapper now throws an explicit
`Error('UserMapper.toDomain: role relation was not loaded')` when
`raw.role` is absent. Fail-fast at the layer boundary instead of
papering it over.

#### I4. `softDelete` was non-atomic (two queries)
`repo.save(existing)` then `repo.softDelete(id)`. If the second call
fails, the row has `deleted_by` set without `deleted_at`.

**Resolution:** combined into a single QueryBuilder update setting
`deleted_at` and `deleted_by` in one statement.

#### I5. Inconsistent not-found error path
`users.service.findById` throws `NotFoundException`, but the repo's
`update` and `softDelete` independently called `findOneOrFail`, which
throws TypeORM's `EntityNotFoundError`. Two error types for the same
condition.

**Resolution:** service owns not-found. Repo `update` and `softDelete`
trust the caller; service `update` / `softDelete` already call
`findById` first, which is the sole place `NotFoundException` is
raised.

#### I6. `updated_at` was not bumped on password change / login
`repo.update(...)` does **not** trigger `@UpdateDateColumn` listeners
(TypeORM quirk — only `.save()` does). So `updated_at` was stale after
a password rotation or a login.

**Resolution:** `updatePasswordHash` and `recordLogin` now include
`updated_at: new Date()` explicitly in the update set.

#### I7. No password complexity enforcement
DTOs validated min 8 / max 128 only — `"password"` and `"12345678"`
both passed.

**Resolution:** added a shared
`PASSWORD_COMPLEXITY_REGEX` and `PASSWORD_COMPLEXITY_MESSAGE` in
`users.constants.ts`. `@Matches(PASSWORD_COMPLEXITY_REGEX, ...)`
applied to `password` (CreateUserDto) and `new_password`
(ResetUserPasswordDto, ChangeMyPasswordDto). Requires ≥1 upper, ≥1
lower, ≥1 digit, ≥1 symbol.

#### I8. Admin email change had no verification flow
`UpdateUserDto` accepted `email` and the service only checked
uniqueness. An admin could silently change someone else's login
identity. The `update-me.dto.ts` comment even acknowledged this gap.

**Resolution:** removed `email` from `UpdateUserDto`. Admin can still
set the email at create time. A verification flow can re-introduce
the field later via a dedicated `PATCH /admin/users/:id/email`
endpoint.

### Suggestions

#### S1. `/me/permissions` does an extra DB round-trip — *not actioned*
The endpoint re-fetches the user just to read permissions, even
though `JwtAuthGuard` already populates `req.user.role.permissions`
via `UsersService.findById`. Confirmed by reading the strategies —
the data is already there.

**Status:** left as-is. The re-fetch ensures the response reflects the
latest DB state (a permission revocation between token issuance and
the call is rare but possible). Revisit when a perf budget pressures
it.

#### S2. `ILIKE '%term%'` cannot use an index — *not actioned*
Leading-wildcard search on four columns is a sequential scan. Fine at
v0 user counts; will need `pg_trgm` + GIN indexes at scale.

**Status:** documented here; no change.

#### S3. `create`/`update` do a second SELECT to reload with relations
Two queries per write. Negligible at v0 scale.

**Status:** documented here; no change.

#### S4. `CreateUserDto` deliberately omits `system_admin`
Was missing a comment, easy to mistake for an oversight.

**Resolution:** added an inline comment explaining seed-only creation
of `system_admin` users.

#### S5. `recordLogin` doesn't set `updated_by`
A login has no human actor. Correct by design; documented in the
entity comment.

**Status:** no code change; documented.

#### S6. `BCRYPT_ROUNDS = 10` is low for 2026
OWASP currently recommends ≥ 12 for bcrypt.

**Resolution:** bumped to 12 in `users.constants.ts`. Existing hashes
auto-rotate on the next password change (the algorithm tolerates
mixed-cost hashes — comparison reads the cost from the hash). The
user seeder uses the same constant, so re-running `npm run seed`
produces 12-round hashes for new rows.

#### S7. `ASIMA_EMAIL_DOMAIN` was an unused constant

**Resolution:** deleted.

---

## Hexagonal hygiene — checklist for future modules

Use this when adding the next feature module (leave, schedules,
time-off):

- [ ] Domain has zero `@nestjs/*` runtime and zero `typeorm` imports
      (`@nestjs/swagger` decorators allowed).
- [ ] Service depends on `Base<Feature>Repository`, never on the
      concrete class.
- [ ] Every cross-layer hop goes through a mapper. Mapper that's not
      called is dead code — delete it.
- [ ] Persistence module binds the port:
      `{ provide: BaseFooRepository, useClass: FooRepository }`.
- [ ] Inputs to the service and the repo are **named types in
      `domain/`**, not inline structural types repeated per layer.
- [ ] Audit columns (`created_by`, `updated_by`, `deleted_by`,
      `deleted_at`) on every entity from day 1.
- [ ] Snake_case end-to-end (DB → domain → JSON).
- [ ] `findX` returns `null`; the service translates to
      `NotFoundException`. Repo never throws domain errors.
- [ ] If the resource has admin + self-service surfaces, DTOs live in
      `dto/admin/` and `dto/me/` — never share one file. Self-service
      DTOs must omit privileged fields entirely (`forbidNonWhitelisted`
      enforces).
- [ ] Privileged ops (password, email, role) get their own endpoints
      — never folded into a generic patch body.
- [ ] List endpoints return `{ data, total, page, limit, has_more }`.
- [ ] Any DTO that accepts a password applies the shared
      `PASSWORD_COMPLEXITY_REGEX` via `@Matches`.

---

## What this review intentionally did NOT do

- **Did not migrate to DDD.** Anemic domain is the chosen style; a
  rich domain model is out of scope until business rules demand it.
- **Did not add a new seeder.** The existing `UserSeedService` was
  updated in place to honour the new `BCRYPT_ROUNDS`.
- **Did not split files just to look "cleaner."** The hexagonal layout
  already mandates one home per concern; the only new file is
  `domain/user-inputs.ts` (a real deduplication), and one new
  migration (one operation per file per CLAUDE.md).
- **Did not introduce a separate `Email` value object.** Would have
  been clean DDD but would only push the same `.trim().toLowerCase()`
  logic one layer deeper without removing it. Service-layer
  normalisation stays.
