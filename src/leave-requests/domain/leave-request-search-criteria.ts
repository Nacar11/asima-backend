import { LeaveRequestStatus, LeaveType } from '@/leave-requests/leave-requests.constants';

export type LeaveRequestSearchCriteria = {
  employee_id?: number;
  status?: LeaveRequestStatus[];
  leave_type?: LeaveType;
  /** Inclusive lower bound on end_date (request overlaps on/after this). */
  from?: string;
  /** Inclusive upper bound on start_date (request overlaps on/before this). */
  to?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};
