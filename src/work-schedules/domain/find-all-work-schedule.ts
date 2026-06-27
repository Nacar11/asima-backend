import { WorkScheduleRecord } from './work-schedule';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllWorkSchedule = PaginatedResponse<WorkScheduleRecord>;
