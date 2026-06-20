import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseCompensationRepository } from '@/compensation/persistence/base-compensation.repository';
import { Compensation } from '@/compensation/domain/compensation';
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
}

/** Reject a future-dated rate — this foundation keeps "active row = current rate". */
function assertNotFutureDated(effective_from: string): void {
  // Lexicographic comparison works for zero-padded YYYY-MM-DD strings.
  if (effective_from > businessDateString()) {
    throw unprocessable('effective_from', 'effective_from cannot be in the future');
  }
}
