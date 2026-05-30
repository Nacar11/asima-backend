import { TimeCorrectionRequest } from './time-correction-request';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllTimeCorrectionRequest = PaginatedResponse<TimeCorrectionRequest>;
