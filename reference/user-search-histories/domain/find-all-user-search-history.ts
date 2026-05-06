import { UserSearchHistory } from '@/user-search-histories/domain/user-search-history';

export type FindAllUserSearchHistory = {
  data: UserSearchHistory[];
  totalCount: number;
  skip: number;
  take: number;
};
