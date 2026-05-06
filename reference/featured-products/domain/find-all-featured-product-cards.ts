import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeaturedSectionEnum } from '@/products/products.enum';
import { ProductCard } from '@/featured-products/domain/product-card';

/**
 * Response for paginated featured product cards (public API)
 */
export class FindAllFeaturedProductCards {
  @ApiProperty({
    type: () => [ProductCard],
    description: 'Array of featured product cards',
  })
  data: ProductCard[];

  @ApiProperty({
    type: Number,
    description: 'Total count of featured products matching the query',
    example: 15,
  })
  totalCount: number;

  @ApiProperty({
    type: Number,
    description: 'Number of items skipped',
    example: 0,
  })
  skip: number;

  @ApiProperty({
    type: Number,
    description: 'Number of items returned',
    example: 10,
  })
  take: number;

  @ApiPropertyOptional({
    enum: FeaturedSectionEnum,
    description: 'The featured section being queried (for public API)',
    example: FeaturedSectionEnum.FEATURED,
  })
  section?: FeaturedSectionEnum;
}
