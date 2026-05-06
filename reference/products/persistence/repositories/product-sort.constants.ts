export const ProductSortConfig = {
  DEFAULT_ORDER: 'DESC' as const,
  FIELD: {
    PRICE: 'price',
    CREATED_AT: 'created_at',
    POPULARITY: 'popularity',
    TOP_RATED: 'top_rated',
  } as const,
  ALIAS: {
    MIN_PRICE: 'min_price',
    POPULARITY: 'popularity_score',
    AVERAGE_RATING: 'average_rating_score',
  } as const,
} as const;
