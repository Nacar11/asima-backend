/**
 * Employee-compensation domain **record** — the persisted shape, as pure data.
 * It is the reconstitution input for the `Compensation` aggregate and the read
 * shape the assembler serializes.
 *
 * One row = "this employee earns <monthly_salary> (and <hourly_rate> per
 * hour), effective from <effective_from> until <effective_to> (or open-ended
 * when effective_to is NULL)."
 *
 * The partial unique index
 *   (employee_id) WHERE effective_to IS NULL AND deleted_at IS NULL
 * enforces "at most one active row per employee". Because this foundation
 * disallows future-dating (`effective_from <= today`), the active row IS the
 * current rate — reads may use it directly. To change pay, the service
 * end-dates the active row and inserts a new one in one transaction; never
 * UPDATE the active row destructively (historical OT pay needs the rate that
 * was in effect at the time).
 *
 * Pure TS — no `@nestjs/*` (not even `@ApiProperty`), no `typeorm`. The
 * Swagger/HTTP shape lives in `dto/response/compensation-response.dto.ts`; the
 * pay behavior on `domain/compensation.aggregate.ts`. Field order mirrors
 * `mapper.toDomain` (which drives JSON key order — keep them in sync).
 */
export class CompensationRecord {
  id!: number;

  /** FK to users.id (the employee, not the actor). */
  employee_id!: number;

  /** Canonical monthly salary (numeric(12,2)). */
  monthly_salary!: number;

  /** Hourly rate (numeric(12,4)). Derived from monthly_salary by default; HR may override. */
  hourly_rate!: number;

  /** True when hourly_rate was set manually (diverged from the derivation). */
  hourly_rate_is_overridden!: boolean;

  /**
   * Company currency for these amounts. A single-tenant constant surfaced on
   * reads (not a DB column); the mapper fills it from COMPENSATION_CURRENCY.
   */
  currency!: string;

  /** First calendar date this rate applies (inclusive, YYYY-MM-DD). */
  effective_from!: string;

  /** NULL while active. Setting this is the "logical end" — see class docs. */
  effective_to!: string | null;

  created_by!: number | null;

  updated_by!: number | null;

  deleted_by!: number | null;

  created_at!: Date;

  updated_at!: Date;

  deleted_at!: Date | null;
}
