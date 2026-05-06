import { ProductVariant } from './product-variant';

export type FindAllProductVariant = {
  data: ProductVariant[];
  totalCount: number;
  skip: number;
  take: number;
};
