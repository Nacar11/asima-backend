import { LeaveRequest } from './leave-request';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllLeaveRequest = PaginatedResponse<LeaveRequest>;
