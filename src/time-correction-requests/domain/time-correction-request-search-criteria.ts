import { TimeCorrectionStatus } from '@/time-correction-requests/time-correction-requests.constants';

export type TimeCorrectionRequestSearchCriteria = {
  employee_id?: number;
  status?: TimeCorrectionStatus[];
  /** Inclusive lower bound on work_date. */
  from?: string;
  /** Inclusive upper bound on work_date. */
  to?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};
