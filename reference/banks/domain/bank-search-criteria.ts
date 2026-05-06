/**
 * Search criteria for querying banks
 */
export type BankSearchCriteria = {
  search?: string;
  bankCode?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
  sortOrder?: 'ASC' | 'DESC';
};
