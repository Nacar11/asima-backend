import { DayPortion, LeaveType } from '@/leave-requests/leave-requests.constants';

/** Self-service submit payload (employee submits for themselves). */
export type SubmitLeaveInput = {
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  day_portion?: DayPortion;
  reason?: string | null;
};

/** HR pending-only edit (plan Q3). Does not touch the chain snapshot. */
export type UpdateLeaveInput = {
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  day_portion?: DayPortion;
  reason?: string | null;
};
