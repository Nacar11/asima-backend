import { TimeEntryRecord } from '@/time-entries/domain/time-entry';
import { TimeEntrySearchCriteria } from '@/time-entries/domain/time-entry-search-criteria';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import { TimeEntrySource, TimeEntryStatus } from '@/time-entries/time-entries.constants';

/**
 * Port for the `time_entries` aggregate. Every mutate path already holds the
 * persisted record (punch ← `findOpenForEmployee`, correction ← `findById`),
 * so reconstitution is use-case-side and there is **no `findAggregateById`**
 * (blueprint §3.2 rule 3a, decision #10). Repos return records, never entities,
 * and never throw 404 (the service owns the 404).
 */
export abstract class BaseTimeEntryRepository {
  abstract findAll(criteria: TimeEntrySearchCriteria): Promise<FindAllTimeEntry>;

  abstract findById(id: number): Promise<TimeEntryRecord | null>;

  /**
   * Returns the caller's currently-open entry (status='open', not soft-
   * deleted) if one exists. The unique partial index guarantees there's at
   * most one — service layer relies on this for the toggle-punch flow.
   */
  abstract findOpenForEmployee(employee_id: number): Promise<TimeEntryRecord | null>;

  /**
   * The employee's most recent non-deleted entry, ordered by the latest
   * event on the row: `time_out` when present, else `time_in`. Drives the
   * punch-cooldown check. Returns null when the employee has never punched.
   */
  abstract findLatestForEmployee(employee_id: number): Promise<TimeEntryRecord | null>;

  /**
   * True if the employee already has a non-deleted entry on `work_date`.
   * Used to block a manual-add ("Add Logs") onto a day that already has a
   * timelog — both at submit (friendly 422) and at correction-approval
   * (authoritative 409, since two confirmed entries on one day are not
   * caught by the open-only partial unique index).
   */
  abstract existsForEmployeeDate(employee_id: number, work_date: string): Promise<boolean>;

  abstract create(input: {
    employee_id: number;
    work_date: string;
    time_in: Date;
    time_out?: Date | null;
    source: TimeEntrySource;
    status: TimeEntryStatus;
    notes?: string | null;
    created_by?: number | null;
  }): Promise<TimeEntryRecord>;

  abstract update(
    id: number,
    patch: {
      work_date?: string;
      time_in?: Date;
      time_out?: Date | null;
      source?: TimeEntrySource;
      status?: TimeEntryStatus;
      notes?: string | null;
      updated_by?: number | null;
    },
  ): Promise<TimeEntryRecord>;

  abstract softDelete(id: number, deleted_by: number | null): Promise<void>;
}
