import { DomainEvent } from '@/utils/domain/domain-event';

/**
 * Domain events raised by the `TimeEntry` aggregate (and published by the
 * use-case post-commit, with the DB-generated id for creations). Past-tense
 * names; carry IDs + scalars, never whole aggregates.
 *
 * No subscriber reacts yet (decision #6) — these establish the side-effect
 * seam (DTR aggregation / tardiness are the named future consumers). The set
 * is deliberate: a segment opened, closed, or was corrected. An admin edit is
 * a back-office correction of an existing fact, not a new one, so `update`
 * emits nothing (decision #5/#6) — there is intentionally no `TimeEntryRevised`.
 */

export class TimeEntryOpened extends DomainEvent {
  readonly name = 'time_entry.opened';
  constructor(
    readonly time_entry_id: number,
    readonly employee_id: number,
    readonly work_date: string,
  ) {
    super();
  }
}

export class TimeEntryClosed extends DomainEvent {
  readonly name = 'time_entry.closed';
  constructor(
    readonly time_entry_id: number,
    readonly employee_id: number,
  ) {
    super();
  }
}

export class TimeEntryCorrected extends DomainEvent {
  readonly name = 'time_entry.corrected';
  constructor(
    readonly time_entry_id: number,
    readonly employee_id: number,
  ) {
    super();
  }
}
