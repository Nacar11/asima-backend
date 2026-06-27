import { TimeEntryRecord } from './time-entry';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllTimeEntry = PaginatedResponse<TimeEntryRecord>;
