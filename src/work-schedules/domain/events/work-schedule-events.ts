import { DomainEvent } from '@/utils/domain/domain-event';
import { DayOfWeek } from '@/work-schedules/work-schedules.constants';

/**
 * Domain events raised by the `WorkSchedule` aggregate (and published by the
 * use-case post-commit, with the DB-generated id for creations). Past-tense
 * names; carry IDs + scalars, never whole aggregates.
 *
 * No subscriber reacts yet — these establish the side-effect seam. The cascade
 * versioning path stays event-free (decision #7); a future `ScheduleVersioned`
 * is a separate change.
 */

export class WorkScheduleCreated extends DomainEvent {
  readonly name = 'work_schedule.created';
  constructor(
    readonly work_schedule_id: number,
    readonly employee_id: number,
    readonly day_of_week: DayOfWeek,
    readonly effective_from: string,
  ) {
    super();
  }
}

export class WorkScheduleEnded extends DomainEvent {
  readonly name = 'work_schedule.ended';
  constructor(
    readonly work_schedule_id: number,
    readonly employee_id: number,
    readonly effective_to: string,
  ) {
    super();
  }
}
