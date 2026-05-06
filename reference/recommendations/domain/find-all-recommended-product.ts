import { ProductCard } from '@/featured-products/domain/product-card';

export type FindAllRecommendedProduct = {
  data: ProductCard[];
  totalCount: number;
  skip: number;
  take: number;
  recommendation_type: 'similar' | 'same_category' | 'same_seller';
  source_product_id: number;
};
