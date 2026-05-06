import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

export const CATEGORY_PRODUCT_COUNT_ALIAS = 'product_count';

export const CATEGORY_RELATIONS: string[] = [
  'seller',
  'created_by',
  'updated_by',
  'deleted_by',
  'parent_category',
];

export const CATEGORY_RELATIONS_WITH_MEDIA: string[] = [
  ...CATEGORY_RELATIONS,
  'media',
];

export const CATEGORY_DEFAULT_STATUS = ActiveInactiveStatusEnum.ACTIVE;

export const CATEGORY_DEFAULT_DISPLAY_ORDER = 0;

export const CATEGORY_MAX_HIERARCHY_DEPTH = 3;
