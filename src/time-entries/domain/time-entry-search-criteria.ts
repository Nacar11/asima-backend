import { TimeEntryStatus } from '@/time-entries/time-entries.constants';

export type TimeEntrySearchCriteria = {
  employee_id?: number;
  /** Inclusive lower bound on `work_date` (YYYY-MM-DD). */
  from?: string;
  /** Inclusive upper bound on `work_date` (YYYY-MM-DD). */
  to?: string;
  status?: TimeEntryStatus;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};
