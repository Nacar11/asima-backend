export type ApprovalChainSearchCriteria = {
  /** Free-text match on employee name / email (the admin list search box). */
  search?: string;
  /** When true, restrict to employees with no active L1 approver. */
  unassigned?: boolean;
  page?: number;
  limit?: number;
};
