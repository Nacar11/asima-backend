import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BaseCompensationRepository } from '@/compensation/persistence/base-compensation.repository';
import { BaseCompensationAuditRepository } from '@/compensation/persistence/base-compensation-audit.repository';
import { Compensation } from '@/compensation/domain/compensation';
import { CompensationAudit } from '@/compensation/domain/compensation-audit';
import { CompensationSearchCriteria } from '@/compensation/domain/compensation-search-criteria';
import { FindAllCompensation } from '@/compensation/domain/find-all-compensation';
import { COMPENSATION_AUDIT_ACTION, deriveHourlyRate } from '@/compensation/compensation.constants';
import { conflict, notFound, unprocessable } from '@/utils/helpers/http-errors';
import { isUniqueViolation } from '@/utils/helpers/pg-errors';
import { businessDateString, dayBefore } from '@/utils/helpers/dates';

/** One set-pay item — shared by single `create` and `createBulk`. */
export interface SetPayInput {
  employee_id: number;
  monthly_salary: number;
  hourly_rate?: number | null;
  effective_from: string;
  created_by?: number | null;
}

@Injectable()
export class CompensationService {
  constructor(
    private readonly repository: BaseCompensationRepository,
    private readonly auditRepo: BaseCompensationAuditRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Set / change an employee's pay. Effective-dated and one-step: the
   * prior active row is end-dated and the new row inserted inside one
   * transaction (a deliberate divergence from work_schedules' two-step —
   * a pay change is a single HR action). The partial unique index is the
   * source of truth for the concurrent-write race; a loser is mapped to
   * a clean 409.
   *
   * `hourly_rate` is derived from `monthly_salary` unless the caller
   * supplies one (an override, flagged on the row).
   */
  async create(input: SetPayInput): Promise<Compensation> {
    assertNotFutureDated(input.effective_from);
    try {
      return await this.dataSource.transaction((manager) => this.insertWithin(input, manager));
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          'employee_id',
          `An active compensation row already exists for employee ${input.employee_id}.`,
        );
      }
      throw err;
    }
  }

  /**
   * Set pay for several employees in ONE all-or-nothing transaction — any
   * item failing rolls back the whole batch. Used for onboarding/import.
   * Duplicate `employee_id`s in the payload are rejected up front (one set-pay
   * per employee per call); future dates are rejected per item.
   */
  async createBulk(items: SetPayInput[], actorId: number | null): Promise<Compensation[]> {
    const ids = items.map((i) => i.employee_id);
    const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
    if (duplicate !== undefined) {
      throw unprocessable(
        'employee_id',
        `employee_id ${duplicate} appears more than once in the bulk payload`,
      );
    }
    items.forEach((item) => assertNotFutureDated(item.effective_from));

    try {
      return await this.dataSource.transaction(async (manager) => {
        const created: Compensation[] = [];
        for (const item of items) {
          created.push(await this.insertWithin({ ...item, created_by: actorId }, manager));
        }
        return created;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict(
          'employee_id',
          'A concurrent active compensation row already exists for one of the employees.',
        );
      }
      throw err;
    }
  }

  /**
   * The shared set-pay body: end-date the prior active row (if any) and insert
   * the new one, recording a `created` audit row — all on the given manager so
   * a caller can compose it into a larger transaction (single or bulk).
   */
  private async insertWithin(input: SetPayInput, manager: EntityManager): Promise<Compensation> {
    const overridden = input.hourly_rate != null;
    const hourly_rate = overridden ? input.hourly_rate! : deriveHourlyRate(input.monthly_salary);

    const prior = await this.repository.findActiveForEmployee(input.employee_id, manager);
    if (prior) {
      if (input.effective_from <= prior.effective_from) {
        throw unprocessable(
          'effective_from',
          `effective_from must be after the current rate's effective_from (${prior.effective_from})`,
        );
      }
      await this.repository.update(
        prior.id,
        { effective_to: dayBefore(input.effective_from), updated_by: input.created_by ?? null },
        manager,
      );
    }

    const created = await this.repository.create(
      {
        employee_id: input.employee_id,
        monthly_salary: input.monthly_salary,
        hourly_rate,
        hourly_rate_is_overridden: overridden,
        effective_from: input.effective_from,
        created_by: input.created_by ?? null,
      },
      manager,
    );

    await this.auditRepo.record(
      {
        compensation_id: created.id,
        employee_id: created.employee_id,
        action: COMPENSATION_AUDIT_ACTION.CREATED,
        after_monthly_salary: created.monthly_salary,
        after_hourly_rate: created.hourly_rate,
        after_effective_from: created.effective_from,
        actor_id: input.created_by ?? null,
      },
      manager,
    );

    return created;
  }

  findAll(criteria: CompensationSearchCriteria): Promise<FindAllCompensation> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<Compensation> {
    const row = await this.repository.findById(id);
    if (!row) throw notFound('Compensation', id);
    return row;
  }

  findHistoryForEmployee(employee_id: number): Promise<Compensation[]> {
    return this.repository.findHistoryForEmployee(employee_id);
  }

  /** The rate in effect on `date` (YYYY-MM-DD) — the OT-facing seam. Null when none. */
  findRateOnDate(employee_id: number, date: string): Promise<Compensation | null> {
    return this.repository.findRateOnDate(employee_id, date);
  }

  /**
   * Batched OT/DTR seam: the rate in effect on `date` for each employee,
   * keyed by `employee_id`. Employees with no rate on that date are absent
   * from the map. One query, no N+1.
   */
  async findRatesOnDate(employee_ids: number[], date: string): Promise<Map<number, Compensation>> {
    const rows = await this.repository.findRatesOnDate(employee_ids, date);
    return new Map(rows.map((row) => [row.employee_id, row]));
  }

  /**
   * The employee's current compensation (the active row). Backs `/me`.
   * Null for a new hire with no rate yet — the caller returns 200 + null.
   */
  findCurrentForEmployee(employee_id: number): Promise<Compensation | null> {
    return this.repository.findActiveForEmployee(employee_id);
  }

  /**
   * Correct an erroneous row IN PLACE (no new history row). A monthly_salary
   * change always re-derives the hourly rate and clears the override flag
   * (open-question #3, resolved 2026-06-21); an explicit hourly_rate in the
   * same patch wins and (re)sets the override.
   */
  async update(
    id: number,
    patch: { monthly_salary?: number; hourly_rate?: number; effective_from?: string },
    updated_by: number | null,
  ): Promise<Compensation> {
    const existing = await this.findById(id); // 404 if the row doesn't exist
    if (patch.effective_from !== undefined) assertNotFutureDated(patch.effective_from);

    const next: {
      monthly_salary?: number;
      hourly_rate?: number;
      hourly_rate_is_overridden?: boolean;
      effective_from?: string;
      updated_by: number | null;
    } = { updated_by };

    if (patch.monthly_salary !== undefined) next.monthly_salary = patch.monthly_salary;
    if (patch.effective_from !== undefined) next.effective_from = patch.effective_from;

    if (patch.hourly_rate !== undefined) {
      next.hourly_rate = patch.hourly_rate;
      next.hourly_rate_is_overridden = true;
    } else if (patch.monthly_salary !== undefined) {
      // A salary correction always re-derives hourly and discards any prior
      // manual override — the new salary is the fresh basis.
      next.hourly_rate = deriveHourlyRate(patch.monthly_salary);
      next.hourly_rate_is_overridden = false;
    }

    // The correction and its audit row land atomically — the trail can't drift.
    return this.dataSource.transaction(async (manager) => {
      const updated = await this.repository.update(id, next, manager);
      await this.auditRepo.record(
        {
          compensation_id: id,
          employee_id: existing.employee_id,
          action: COMPENSATION_AUDIT_ACTION.UPDATED,
          before_monthly_salary: existing.monthly_salary,
          after_monthly_salary: updated.monthly_salary,
          before_hourly_rate: existing.hourly_rate,
          after_hourly_rate: updated.hourly_rate,
          before_effective_from: existing.effective_from,
          after_effective_from: updated.effective_from,
          actor_id: updated_by,
        },
        manager,
      );
      return updated;
    });
  }

  /**
   * Soft-delete an erroneous row. Only the ACTIVE row is deletable; deleting
   * it reactivates the immediately-prior row so the employee isn't left with
   * a gap. A historical row is rejected — deleting it would punch a hole in
   * findRateOnDate. Runs in a transaction: the active row is soft-deleted
   * (leaving the partial unique index free) before the prior row is
   * reactivated.
   */
  async softDelete(id: number, deleted_by: number | null): Promise<void> {
    const existing = await this.findById(id);
    if (existing.effective_to != null) {
      throw conflict(
        'id',
        'Only the active compensation row can be deleted; this row is already ended.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await this.repository.softDelete(id, deleted_by, manager);
      const prior = await this.repository.findPreviousForEmployee(
        existing.employee_id,
        existing.effective_from,
        manager,
      );
      if (prior) {
        await this.repository.update(
          prior.id,
          { effective_to: null, updated_by: deleted_by },
          manager,
        );
      }

      await this.auditRepo.record(
        {
          compensation_id: id,
          employee_id: existing.employee_id,
          action: COMPENSATION_AUDIT_ACTION.DELETED,
          before_monthly_salary: existing.monthly_salary,
          before_hourly_rate: existing.hourly_rate,
          before_effective_from: existing.effective_from,
          actor_id: deleted_by,
        },
        manager,
      );
    });
  }

  /**
   * The audit trail for one compensation row (newest first). 404s if the row
   * doesn't exist so the route can't be used to probe for ids.
   */
  async findAuditTrail(compensation_id: number): Promise<CompensationAudit[]> {
    await this.findById(compensation_id); // 404 if the row doesn't exist
    return this.auditRepo.findByCompensationId(compensation_id);
  }
}

/** Reject a future-dated rate — this foundation keeps "active row = current rate". */
function assertNotFutureDated(effective_from: string): void {
  // Lexicographic comparison works for zero-padded YYYY-MM-DD strings.
  if (effective_from > businessDateString()) {
    throw unprocessable('effective_from', 'effective_from cannot be in the future');
  }
}
