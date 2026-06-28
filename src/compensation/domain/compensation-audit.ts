import { CompensationAuditAction } from '@/compensation/compensation.constants';

/**
 * One immutable audit row per write to a compensation record. Records the
 * before→after of the money + effective_from fields so an in-place salary
 * correction (which overwrites the row) still leaves a value-level trail —
 * the effective-dated history alone can't show what a correction changed.
 *
 * Append-only: there is no update/soft-delete of an audit row, so it carries
 * only `actor_id` (who) and `created_at` (when), not the usual
 * updated_by/deleted_by audit columns. It stays a plain **record** (not an
 * aggregate) — the use-case appends it transactionally (decision #6).
 *
 * Pure TS — no `@nestjs/*` (not even `@ApiProperty`), no `typeorm`. The
 * Swagger/HTTP shape lives in `dto/response/compensation-audit-response.dto.ts`.
 */
export class CompensationAuditRecord {
  id!: number;

  /** FK to employee_compensations.id */
  compensation_id!: number;

  /** FK to users.id (the employee), denormalized */
  employee_id!: number;

  action!: CompensationAuditAction;

  /** null on a create */
  before_monthly_salary!: number | null;

  /** null on a delete */
  after_monthly_salary!: number | null;

  before_hourly_rate!: number | null;

  after_hourly_rate!: number | null;

  before_effective_from!: string | null;

  after_effective_from!: string | null;

  /** users.id of the actor */
  actor_id!: number | null;

  created_at!: Date;
}
