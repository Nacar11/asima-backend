import { TimeCorrectionRequestListItem } from './time-correction-request-list-item';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllTimeCorrectionRequest = PaginatedResponse<TimeCorrectionRequestListItem>;
