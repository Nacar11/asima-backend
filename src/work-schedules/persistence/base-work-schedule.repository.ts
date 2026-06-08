import { WorkSchedule } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleSearchCriteria } from '@/work-schedules/domain/work-schedule-search-criteria';
import { FindAllWorkSchedule } from '@/work-schedules/domain/find-all-work-schedule';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

export abstract class BaseWorkScheduleRepository {
  abstract findAll(criteria: WorkScheduleSearchCriteria): Promise<FindAllWorkSchedule>;

  abstract findById(id: number): Promise<WorkSchedule | null>;

  /**
   * Active schedules for one employee. Returns 0..7 rows (one per
   * weekday, at most). "Active" means `effective_to IS NULL`.
   */
  abstract findActiveForEmployee(employee_id: number): Promise<WorkSchedule[]>;

  /**
   * Active row for a specific (employee, weekday), if one exists.
   * Used by the service-layer "only-one-active" guard before insert.
   */
  abstract findActiveForEmployeeDay(
    employee_id: number,
    day_of_week: DayOfWeek,
  ): Promise<WorkSchedule | null>;

  abstract create(input: {
    employee_id: number;
    day_of_week: DayOfWeek;
    expected_in: string;
    expected_out: string;
    break_minutes: number;
    break_start?: string | null;
    effective_from: string;
    effective_to?: string | null;
    created_by?: number | null;
  }): Promise<WorkSchedule>;

  abstract update(
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
  ): Promise<WorkSchedule>;

  abstract softDelete(id: number, deleted_by: number | null): Promise<void>;
}
