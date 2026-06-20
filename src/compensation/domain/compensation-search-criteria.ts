export type CompensationSearchCriteria = {
  employee_id?: number;
  /** When true (default for the admin list), return only rows where effective_to IS NULL. */
  activeOnly?: boolean;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};
