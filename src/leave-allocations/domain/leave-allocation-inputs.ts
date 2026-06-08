import { LeaveType } from '@/leave-requests/leave-requests.constants';
import { AllocationSource } from '@/leave-allocations/leave-allocations.constants';

/** Append a grant to the ledger. `amount` must be > 0 (DB CHECK enforces it). */
export type CreateAllocationInput = {
  employee_id: number;
  leave_type: LeaveType;
  amount: number;
  source: AllocationSource;
  reason?: string | null;
  granted_by?: number | null;
  created_by?: number | null;
};
