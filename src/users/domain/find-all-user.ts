import { User } from './user';
import { PaginatedResponse } from '@/utils/types/paginated-response.type';

export type FindAllUser = PaginatedResponse<User>;
