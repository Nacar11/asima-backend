import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

export type CategorySearchCriteria = {
  categoryName?: string;
  sellerId?: number;
  isGlobal?: boolean;
  includeGlobal?: boolean;
  skip?: number;
  take?: number;
  sortOrder?: 'ASC' | 'DESC';
  status?: ActiveInactiveStatusEnum;
  activeSellerOnly?: boolean;
};
