import { BankAccountStatusEnum } from './bank-account';

/**
 * Search criteria for bank accounts (domain type)
 */
export interface BankAccountSearchCriteria {
  user_id: number;
  status?: BankAccountStatusEnum;
  is_default?: boolean;
  search?: string;
  skip?: number;
  take?: number;
  sortBy?: 'ASC' | 'DESC';
}
