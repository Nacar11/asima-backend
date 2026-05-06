import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

export const TAG_PRODUCT_COUNT_ALIAS = 'product_count';

export const TAG_PRODUCT_COUNT_SUBQUERY =
  '(SELECT COUNT(*) FROM product_tags pt INNER JOIN products p ON p.id = pt.product_id AND p.deleted_at IS NULL WHERE pt.tag_id = tags.id)';

export const TAG_PRODUCT_COUNT_SUBQUERY_ALIAS = 'tag';

export const TAG_PRODUCT_COUNT_SUBQUERY_FOR_ALIAS = (alias: string) =>
  `(SELECT COUNT(*) FROM product_tags pt INNER JOIN products p ON p.id = pt.product_id AND p.deleted_at IS NULL WHERE pt.tag_id = ${alias}.id)`;

export const TAG_DEFAULT_STATUS = ActiveInactiveStatusEnum.ACTIVE;

export const TAG_DEFAULT_DISPLAY_ORDER = 0;
