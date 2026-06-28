import { CompensationRecord } from './compensation';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllCompensation = PaginatedResponse<CompensationRecord>;
