import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseWorkScheduleRepository } from '@/work-schedules/persistence/base-work-schedule.repository';
import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleSearchCriteria } from '@/work-schedules/domain/work-schedule-search-criteria';
import { FindAllWorkSchedule } from '@/work-schedules/domain/find-all-work-schedule';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';
import { unprocessable } from '@/utils/helpers/http-errors';
import { isUniqueViolation } from '@/utils/helpers/pg-errors';
import { toSeconds } from '@/utils/helpers/time-of-day';

@Injectable()
export class WorkSchedulesService {
  constructor(private readonly repository: BaseWorkScheduleRepository) {}

  findAll(criteria: WorkScheduleSearchCriteria): Promise<FindAllWorkSchedule> {
    return this.repository.findAll(criteria);
  }

  async findById(id: number): Promise<WorkSchedule> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`WorkSchedule with id ${id} not found`);
    return row;
  }

  /**
   * Active rows for an employee — used by `GET /users/me/work-schedule`
   * and the admin "show me this employee's current week" view.
   */
  findActiveForEmployee(employee_id: number): Promise<WorkSchedule[]> {
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
  }): Promise<WorkSchedule> {
    assertWindowOk(input.expected_in, input.expected_out);
    assertBreakOk(
      input.break_minutes,
      input.break_start ?? null,
      input.expected_in,
      input.expected_out,
    );

    // Surfaces a clearer 409 than letting the partial-unique-index
    // violation bubble up. The DB index is still the source of truth
    // for the concurrent-write race.
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
      return await this.repository.create(input);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          `Active schedule already exists for employee ${input.employee_id} / day_of_week=${input.day_of_week}.`,
        );
      }
      throw err;
    }
  }

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
  ): Promise<WorkSchedule> {
    const existing = await this.findById(id);

    const expected_in = patch.expected_in ?? existing.expected_in;
    const expected_out = patch.expected_out ?? existing.expected_out;
    assertWindowOk(expected_in, expected_out);

    // Resolve the effective break against the patch so a change to any of
    // {break_minutes, break_start, window} is re-validated as a whole.
    const break_minutes = patch.break_minutes ?? existing.break_minutes;
    const break_start = patch.break_start !== undefined ? patch.break_start : existing.break_start;
    assertBreakOk(break_minutes, break_start, expected_in, expected_out);

    return this.repository.update(id, patch);
  }

  /**
   * Logical end: stamp `effective_to` so the row stops being "active"
   * but stays in the table for historical reference. The admin DELETE
   * endpoint maps to this — never to a physical row removal.
   */
  async endLogically(
    id: number,
    effective_to: string,
    updated_by: number | null,
  ): Promise<WorkSchedule> {
    const existing = await this.findById(id);
    if (existing.effective_to != null) {
      throw new ConflictException(
        `WorkSchedule ${id} is already ended (effective_to=${existing.effective_to}).`,
      );
    }
    return this.repository.update(id, { effective_to, updated_by });
  }

  async softDelete(id: number, deleted_by: number | null): Promise<void> {
    await this.findById(id);
    await this.repository.softDelete(id, deleted_by);
  }
}

function assertWindowOk(expected_in: string, expected_out: string): void {
  // Lexicographic comparison works for zero-padded HH:MM:SS strings.
  if (expected_out <= expected_in) {
    throw unprocessable('expected_out', 'expected_out must be strictly after expected_in');
  }
}

function assertBreakOk(
  break_minutes: number,
  break_start: string | null,
  expected_in: string,
  expected_out: string,
): void {
  if (break_minutes < 0) {
    throw unprocessable('break_minutes', 'break_minutes must be >= 0');
  }
  if (break_minutes > 0 && break_start == null) {
    throw unprocessable('break_start', 'break_start is required when break_minutes > 0');
  }
  if (break_start == null) return;

  const startSec = toSeconds(break_start);
  if (startSec < toSeconds(expected_in)) {
    throw unprocessable('break_start', 'break_start must be on or after expected_in');
  }
  if (startSec + break_minutes * 60 > toSeconds(expected_out)) {
    throw unprocessable('break_start', 'the break must end on or before expected_out');
  }
}
