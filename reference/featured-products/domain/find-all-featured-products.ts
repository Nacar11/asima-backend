import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '@/products/domain/product';
import { FeaturedSectionEnum } from '@/products/products.enum';

/**
 * Response for paginated featured products
 */
export class FindAllFeaturedProducts {
  @ApiProperty({
    type: () => [Product],
    description: 'Array of featured products',
  })
  data: Product[];

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
