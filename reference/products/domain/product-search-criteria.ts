import { ProductStatusEnum } from '@/utils/enums/product.enum';
import { ListingTypeEnum } from '@/products/enums/listing-type.enum';
import { FeaturedSectionEnum } from '@/products/products.enum';

export type ProductSortField =
  | 'price'
  | 'created_at'
  | 'popularity'
  | 'top_rated';

export type ProductSearchSort = {
  field: ProductSortField;
  direction: 'ASC' | 'DESC';
};

export type ProductSearchCriteria = {
  skip: number;
  take: number;
  productName?: string;
  status?: ProductStatusEnum;
  sellerId?: number;
  includeInventoryStock?: boolean;
  categoryIds?: number[];
  tagIds?: number[];
  sort?: ProductSearchSort;
  priceRangeStart?: number;
  priceRangeEnd?: number;
  minRating?: number;
  featuredSection?: FeaturedSectionEnum;
  listingType?: ListingTypeEnum;
  activeSellerOnly?: boolean;
};
