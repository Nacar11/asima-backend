import { EntityManager } from 'typeorm';
import { WorkScheduleRecord } from '@/work-schedules/domain/work-schedule';
import { WorkScheduleSearchCriteria } from '@/work-schedules/domain/work-schedule-search-criteria';
import { FindAllWorkSchedule } from '@/work-schedules/domain/find-all-work-schedule';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

/**
 * Port for the `work_schedules` aggregate. Every mutate path already holds the
 * persisted record (`update`/`endLogically` ← `findById`), so reconstitution is
 * use-case-side and there is **no `findAggregateById`** (blueprint §3.2 rule 3a).
 * Repos return records, never entities, never throw 404. The `manager?:
 * EntityManager` params let the schedule-change cascade run in one transaction.
 */
export abstract class BaseWorkScheduleRepository {
  abstract findAll(criteria: WorkScheduleSearchCriteria): Promise<FindAllWorkSchedule>;

  abstract findById(id: number): Promise<WorkScheduleRecord | null>;

  /**
   * Active schedules for one employee. Returns 0..7 rows (one per
   * weekday, at most). "Active" means `effective_to IS NULL`.
   */
  abstract findActiveForEmployee(employee_id: number): Promise<WorkScheduleRecord[]>;

  /**
   * Active row for a specific (employee, weekday), if one exists.
   * Used by the service-layer "only-one-active" guard before insert.
   */
  abstract findActiveForEmployeeDay(
    employee_id: number,
    day_of_week: DayOfWeek,
    manager?: EntityManager,
  ): Promise<WorkScheduleRecord | null>;

  abstract create(
    input: {
      employee_id: number;
      day_of_week: DayOfWeek;
      expected_in: string;
      expected_out: string;
      break_minutes: number;
      break_start?: string | null;
      effective_from: string;
      effective_to?: string | null;
      created_by?: number | null;
    },
    manager?: EntityManager,
  ): Promise<WorkScheduleRecord>;

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
    manager?: EntityManager,
  ): Promise<WorkScheduleRecord>;

  abstract softDelete(
    id: number,
    deleted_by: number | null,
    manager?: EntityManager,
  ): Promise<void>;
}
