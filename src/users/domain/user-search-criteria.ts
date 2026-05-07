export type UserSearchCriteria = {
  search?: string;
  email?: string;
  role_id?: number;
  is_active?: boolean;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};
