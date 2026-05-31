export type ApprovalChainSearchCriteria = {
  /** Free-text match on employee name / email (the admin list search box). */
  search?: string;
  page?: number;
  limit?: number;
};
