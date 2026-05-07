import { TimeEntry } from '@/time-entries/domain/time-entry';
import { TimeEntrySearchCriteria } from '@/time-entries/domain/time-entry-search-criteria';
import { FindAllTimeEntry } from '@/time-entries/domain/find-all-time-entry';
import { TimeEntrySource, TimeEntryStatus } from '@/time-entries/time-entries.constants';

export abstract class BaseTimeEntryRepository {
  abstract findAll(criteria: TimeEntrySearchCriteria): Promise<FindAllTimeEntry>;

  abstract findById(id: number): Promise<TimeEntry | null>;

  /**
   * Returns the caller's currently-open entry (status='open', not soft-
   * deleted) if one exists. The unique partial index guarantees there's at
   * most one — service layer relies on this for the toggle-punch flow.
   */
  abstract findOpenForEmployee(employee_id: number): Promise<TimeEntry | null>;

  abstract create(input: {
    employee_id: number;
    work_date: string;
    time_in: Date;
    time_out?: Date | null;
    source: TimeEntrySource;
    status: TimeEntryStatus;
    notes?: string | null;
    created_by?: number | null;
  }): Promise<TimeEntry>;

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
  ): Promise<TimeEntry>;

  abstract softDelete(id: number, deleted_by: number | null): Promise<void>;
}
