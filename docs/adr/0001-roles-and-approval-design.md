# ADR 0001: Roles, titles, and approval chains

- **Status:** Accepted
- **Date:** 2026-05-06
- **Deciders:** Dale (product), Claude (eng)
- **Scope:** authentication / authorization / approval routing across the entire `asima-backend`

## Context

asima is an Employee Time Management system. v0 ships only the identity foundation
(Auth + Users + Roles + Permissions). Future modules — leave with multi-level
approvals, schedules, time entries, workforce management — will all need to answer
two distinct questions:

1. **What is this user globally allowed to do?** (e.g. can they call the approve endpoint at all?)
2. **For this specific request, are they the right approver?** (e.g. is *this* TD the one assigned to *this* employee's chain?)

It is tempting to fold both into a single concept ("Bob is a Project Manager,
therefore Bob can approve Alice's leave"). That fold breaks down quickly:

- A company can have many PMs; only one is the right approver for a given employee.
- A TD requesting their own leave needs an approver above them, not themselves.
- An employee may report directly to a PM with no TD step.
- One person can simultaneously fill the TD and PM slot for a given employee, in
  which case the chain collapses to one step.
- People go on leave; an "acting" approver covers; the chain history must remain
  intact for past requests resolved against the original approver.

This ADR records the model we're adopting up front so future modules don't
re-invent a parallel system.

## Decision

Three orthogonal concepts:

### 1. **Role** — global capability, drives permission gates

One per user. Stored as `users.role_id → roles.id`. Drives `@Permissions(...)`
decorators via the M2M `role_permissions` table. Roles are seeded; admins can
create new roles at runtime via `/admin/roles` (Task 9).

v0 role taxonomy:

| Role name | Description |
|---|---|
| `SUPER_ADMIN` | System-level bypass. `system_admin: true` on the user record short-circuits `PermissionsGuard`. Reserved for ops/infra. |
| `HR_ADMIN` | HR back office: manages users, sees the role/permission catalog, overrides approvals when needed. |
| `PROJECT_MANAGER` | Has `LEAVE:Approve` (and similar) when the leave module lands. **Authority over a specific request** still requires being on that employee's approval chain. |
| `TECHNICAL_DIRECTOR` | Same as PROJECT_MANAGER w.r.t. permissions. The distinction between PM and TD lives in the approval chain (which user is the step-1 vs step-2 approver), not in their permission sets. |
| `EMPLOYEE` | Default for new registrations. Self-service routes only. |

PM and TD roles ship in v0 with **empty permission lists**. The `LEAVE:*`
permissions land alongside the leave module; until then PM and TD users
functionally equal EMPLOYEE except by `role.name`. Frontend may already gate
UI on `role.name`.

### 2. **Title** — display string, never drives auth

`users.title` is a freeform `VARCHAR(100)` (nullable). It carries the user's
job-description text — "Senior Project Manager", "Acting Technical Director",
"Head of Operations" — for HR display only. **Auth and approval routing must
never read this column.**

Rationale for freeform over enum:
- Orgs grow titles fast (Senior PM, Acting PM, Lead PM…). An enum becomes a
  perpetual migration backlog.
- Most employees have no executive title; making the column nullable + freeform
  matches reality.
- If guardrails are needed later, a separate `titles` lookup table can be
  added without rewriting any other code.

### 3. **Approval chain** — per-employee assignment table, drives routing

Lands with the leave module (NOT in v0). Schema preview:

```sql
CREATE TABLE approval_chains (
  id           SERIAL PRIMARY KEY,
  employee_id  INT NOT NULL REFERENCES users(id),
  step         INT NOT NULL,             -- 1, 2, 3...
  approver_id  INT NOT NULL REFERENCES users(id),
  effective_at TIMESTAMP NOT NULL DEFAULT now(),
  ended_at     TIMESTAMP NULL,
  UNIQUE (employee_id, step, effective_at)
);
```

A chain is an ordered list of approver user-ids of length 0..N, deduplicated.
Different employee scenarios all map cleanly:

| Scenario | Rows |
|---|---|
| Standard employee with TD + PM | `(emp, 1, td)`, `(emp, 2, pm)` |
| Employee directly under PM | `(emp, 1, pm)` |
| TD requesting leave | `(td, 1, pm)` |
| One person fills both slots | `(emp, 1, that_person)` (collapse to one step) |
| Top of chain (no approver) | empty → service falls back to HR_ADMIN |

The `effective_at` / `ended_at` columns version assignments so historical
requests retain the original approver even if reporting lines later change.

### Auth flow at request time

For a leave-approval request:

1. **Permission gate** (declarative): `@Permissions({ LEAVE: 'Approve' })` —
   does the caller's role grant `LEAVE:Approve`? If not, 403.
2. **Business gate** (in service): is the caller's user-id `===
   request.current_approver_id` AND is `request.state` consistent with
   advancing? If not, 403 (or 422).
3. State machine advances: look up next step in `approval_chains` for the
   employee; if no next step, mark approved.

`HR_ADMIN` carries override permissions (e.g. `LEAVE:ApproveAny`,
`LEAVE:Cancel`) and skips the business gate.

## Consequences

**Positive:**

- New modules with multi-level approvals (OT, expense claims, project
  transfers) can re-use `approval_chains` unchanged.
- Acting/interim approvers are a one-row insert with `effective_at` — no code
  change.
- Adding more approval steps (e.g. CEO sign-off for >7-day leaves) is a data
  change, not a schema change.
- Roles stay small (~5 entries). The taxonomy is stable; permissions evolve.

**Negative / accepted trade-offs:**

- One extra table when leave module lands (`approval_chains`).
- Two columns/concepts to keep separate (role and title) means HR has to
  understand the distinction. Mitigation: admin UI labels each clearly.
- An approver who hasn't been placed on any chain effectively can't approve
  anything despite having the role — by design, but easy to misdiagnose as a
  permissions bug. Mitigation: `/admin/users/:id/approval-chain` introspection
  endpoint when the leave module lands.

**Out of scope for v0:**

- The `approval_chains` table (lands with leave).
- The `LEAVE:*` permission codes (land with leave).
- The `users.title` column (lands in Task 4 alongside the rest of the user schema).

## References

- `tasks/plan.md` — implementation plan
- `src/database/seeds/data/roles.json` — current role + permission seed
- `module-architecture.md` — hexagonal architecture rules
