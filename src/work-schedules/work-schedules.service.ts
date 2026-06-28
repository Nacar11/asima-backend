import { ConflictException, Injectable } from '@nestjs/common';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { DomainEventPublisher } from '@/utils/domain/domain-event-publisher';
import { WorkSchedule } from '@/work-schedules/domain/work-schedule.aggregate';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import {
  InvalidBreakError,
  InvalidWorkWindowError,
} from '@/work-schedules/domain/work-schedule-errors';
import { WorkScheduleCreated } from '@/work-schedules/domain/events/work-schedule-events';
import { WorkScheduleSearchCriteria } from '@/work-schedules/domain/work-schedule-search-criteria';
import { FindAllWorkSchedule } from '@/work-schedules/domain/find-all-work-schedule';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { orNotFound, unprocessable } from '@/utils/helpers/http-errors';
import { isUniqueViolation } from '@/utils/helpers/pg-errors';

/**
 * Thin use-case for the `work_schedules` aggregate: validate via the aggregate
 * guard → persist → publish. The window/break invariants live on the
 * `WorkWindow` / `Break` VOs + `WorkSchedule.assertSchedule`; the I/O guards the
 * aggregate can't do (one-active-per-(employee,weekday), already-ended, the
 * `23505`→409 mapping, 404) stay here. Reconstitution is use-case-side from the
 * record `endLogically` already holds (no `findAggregateById` — §3.2 rule 3a).
 */
@Injectable()
export class WorkSchedulesService {
  constructor(
    private readonly repository: BaseWorkScheduleRepository,
    private readonly publisher: DomainEventPublisher,
  ) {}

  findAll(criteria: WorkScheduleSearchCriteria): Promise<FindAllWorkSchedule> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<WorkScheduleRecord> {
    return orNotFound(await this.repository.findById(id), 'WorkSchedule', id);
  }

  /**
   * Active rows for an employee — used by `GET /users/me/work-schedule`
   * and the admin "show me this employee's current week" view.
   */
  findActiveForEmployee(employee_id: number): Promise<WorkScheduleRecord[]> {
    return this.repository.findActiveForEmployee(employee_id);
  }

  async create(input: {
    employee_id: number;
    day_of_week: DayOfWeek;
    expected_in: string;
    expected_out: string;
    break_minutes: number;
    break_start?: string | null;
    effective_from: string;
    effective_to?: string | null;
    created_by?: number | null;
  }): Promise<WorkScheduleRecord> {
    this.validateSchedule(
      input.expected_in,
      input.expected_out,
      input.break_minutes,
      input.break_start ?? null,
    );

    // Surfaces a clearer 409 than letting the partial-unique-index violation
    // bubble up. The DB index is still the source of truth for the race.
    if (input.effective_to == null) {
      const active = await this.repository.findActiveForEmployeeDay(
        input.employee_id,
        input.day_of_week,
      );
      if (active) {
        throw new ConflictException(
          `Employee ${input.employee_id} already has an active schedule for day_of_week=${input.day_of_week} (id ${active.id}). End it first by setting effective_to.`,
        );
      }
    }

    try {
      const created = await this.repository.create(input);
      this.publisher.publish([
        new WorkScheduleCreated(
          created.id,
          created.employee_id,
          created.day_of_week,
          created.effective_from,
        ),
      ]);
      return created;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          `Active schedule already exists for employee ${input.employee_id} / day_of_week=${input.day_of_week}.`,
        );
      }
      throw err;
    }
  }

  /**
   * Admin edit. NOT an aggregate transition (decision #5): a thin use-case
   * patch — merge over the existing row, validate the merged schedule, persist.
   * Records no event. `break_start` merges with `!== undefined` (not `??`) so a
   * `break_start: null` patch clears it.
   */
  async update(
    id: number,
    patch: {
      expected_in?: string;
      expected_out?: string;
      break_minutes?: number;
      break_start?: string | null;
      effective_from?: string;
      effective_to?: string | null;
      updated_by?: number | null;
    },
  ): Promise<WorkScheduleRecord> {
    const existing = await this.findById(id);

    const expected_in = patch.expected_in ?? existing.expected_in;
    const expected_out = patch.expected_out ?? existing.expected_out;
    const break_minutes = patch.break_minutes ?? existing.break_minutes;
    const break_start = patch.break_start !== undefined ? patch.break_start : existing.break_start;

    this.validateSchedule(expected_in, expected_out, break_minutes, break_start);

    return this.repository.update(id, patch);
  }

  /**
   * Logical end: stamp `effective_to` so the row stops being "active" but stays
   * in the table for historical reference. The admin DELETE endpoint maps to
   * this — never to a physical row removal. Records `WorkScheduleEnded`.
   */
  async endLogically(
    id: number,
    effective_to: string,
    updated_by: number | null,
  ): Promise<WorkScheduleRecord> {
    const existing = await this.findById(id);
    if (existing.effective_to != null) {
      throw new ConflictException(
        `WorkSchedule ${id} is already ended (effective_to=${existing.effective_to}).`,
      );
    }

    const aggregate = WorkSchedule.reconstitute(existing);
    aggregate.endLogically(effective_to);

    const saved = await this.repository.update(id, {
      effective_to: aggregate.effective_to,
      updated_by,
    });
    this.publisher.publish(aggregate.pullEvents());
    return saved;
  }

  async softDelete(id: number, deleted_by: number | null): Promise<void> {
    await this.findById(id);
    await this.repository.softDelete(id, deleted_by);
  }

  /**
   * Validate a window + break via the aggregate's pure guard and map the domain
   * error to the same 422 the pre-DDD service emitted.
   */
  private validateSchedule(
    expected_in: string,
    expected_out: string,
    break_minutes: number,
    break_start: string | null,
  ): void {
    try {
      WorkSchedule.assertSchedule(expected_in, expected_out, break_minutes, break_start);
    } catch (err) {
      rethrowWorkScheduleDomainError(err);
    }
  }
}

/**
 * Translate a pure domain error from the `WorkSchedule` aggregate / value
 * objects into the exact HTTP exception the service threw before the DDD
 * migration (decision #8). Shared by `WorkSchedulesService` and the
 * schedule-change cascade's `validate`. Anything else is rethrown untouched.
 */
export function rethrowWorkScheduleDomainError(err: unknown): never {
  if (err instanceof InvalidWorkWindowError) throw unprocessable(err.field, err.message);
  if (err instanceof InvalidBreakError) throw unprocessable(err.field, err.message);
  throw err;
}
