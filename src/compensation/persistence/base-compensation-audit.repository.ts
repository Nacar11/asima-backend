import { EntityManager } from 'typeorm';
import { CompensationAuditRecord } from '@/compensation/domain/compensation-audit';
import { CompensationAuditAction } from '@/compensation/compensation.constants';

/** What the service hands the audit repo for one write. */
export interface RecordCompensationAuditInput {
  compensation_id: number;
  employee_id: number;
  action: CompensationAuditAction;
  before_monthly_salary?: number | null;
  after_monthly_salary?: number | null;
  before_hourly_rate?: number | null;
  after_hourly_rate?: number | null;
  before_effective_from?: string | null;
  after_effective_from?: string | null;
  actor_id?: number | null;
}

/**
 * Port for the append-only compensation audit trail. `record` takes an
 * optional `EntityManager` so the audit row is written inside the SAME
 * transaction as the compensation write it describes — the trail can never
 * drift from the row.
 */
export abstract class BaseCompensationAuditRepository {
  abstract record(
    input: RecordCompensationAuditInput,
    manager?: EntityManager,
  ): Promise<CompensationAuditRecord>;

  /** Full trail for one compensation row, newest first. */
  abstract findByCompensationId(compensation_id: number): Promise<CompensationAuditRecord[]>;
}
