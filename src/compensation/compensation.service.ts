import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseCompensationRepository } from '@/compensation/persistence/base-compensation.repository';
import { Compensation } from '@/compensation/domain/compensation';
import { CompensationSearchCriteria } from '@/compensation/domain/compensation-search-criteria';
import { FindAllCompensation } from '@/compensation/domain/find-all-compensation';
import { deriveHourlyRate } from '@/compensation/compensation.constants';
import { conflict, unprocessable } from '@/utils/helpers/http-errors';
import { isUniqueViolation } from '@/utils/helpers/pg-errors';
import { businessDateString, dayBefore } from '@/utils/helpers/dates';

@Injectable()
export class CompensationService {
  constructor(
    private readonly repository: BaseCompensationRepository,
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
  async create(input: {
    employee_id: number;
    monthly_salary: number;
    hourly_rate?: number | null;
    effective_from: string;
    created_by?: number | null;
  }): Promise<Compensation> {
    assertNotFutureDated(input.effective_from);

    const overridden = input.hourly_rate != null;
    const hourly_rate = overridden ? input.hourly_rate! : deriveHourlyRate(input.monthly_salary);

    try {
      return await this.dataSource.transaction(async (manager) => {
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

        return this.repository.create(
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
      });
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

  findAll(criteria: CompensationSearchCriteria): Promise<FindAllCompensation> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<Compensation> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Compensation with id ${id} not found`);
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
   * The employee's current compensation (the active row). Backs `/me`.
   * Null for a new hire with no rate yet — the caller returns 200 + null.
   */
  findCurrentForEmployee(employee_id: number): Promise<Compensation | null> {
    return this.repository.findActiveForEmployee(employee_id);
  }

  /**
   * Correct an erroneous row IN PLACE (no new history row). Recomputes the
   * hourly rate when monthly_salary changes on a non-overridden row; an
   * explicit hourly_rate is treated as an override.
   */
  async update(
    id: number,
    patch: { monthly_salary?: number; hourly_rate?: number; effective_from?: string },
    updated_by: number | null,
  ): Promise<Compensation> {
    const existing = await this.findById(id);
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
    } else if (patch.monthly_salary !== undefined && !existing.hourly_rate_is_overridden) {
      next.hourly_rate = deriveHourlyRate(patch.monthly_salary);
    }

    return this.repository.update(id, next);
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
    });
  }
}

/** Reject a future-dated rate — this foundation keeps "active row = current rate". */
function assertNotFutureDated(effective_from: string): void {
  // Lexicographic comparison works for zero-padded YYYY-MM-DD strings.
  if (effective_from > businessDateString()) {
    throw unprocessable('effective_from', 'effective_from cannot be in the future');
  }
}
