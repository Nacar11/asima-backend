import { LeaveRequestListItem } from './leave-request-list-item';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllLeaveRequest = PaginatedResponse<LeaveRequestListItem>;
