/**
 * Global pagination default values used across modules.
 */
type SortOrder = 'ASC' | 'DESC';

export const PAGINATION_DEFAULTS: {
  readonly skip: number;
  readonly take: number;
  readonly sortOrder: SortOrder;
} = {
  skip: 0,
  take: 20,
  sortOrder: 'DESC',
};
