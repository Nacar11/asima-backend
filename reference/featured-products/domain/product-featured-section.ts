import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeaturedSectionEnum } from '@/products/products.enum';
import { User } from '@/users/domain/user';

/**
 * Product featured section domain entity
 * Represents a product's membership in a featured section
 */
export class ProductFeaturedSection {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Product ID',
  })
  product_id: number;

  @ApiProperty({
    enum: FeaturedSectionEnum,
    example: FeaturedSectionEnum.FEATURED,
    description: 'Section where product is featured',
  })
  section: FeaturedSectionEnum;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Display order within the section',
  })
  display_order: number;

  @ApiProperty({
    type: Date,
    description: 'Timestamp when the product was added to this section',
  })
  featured_at: Date;

  @ApiPropertyOptional({
    type: () => Object,
    nullable: true,
    description: 'Admin who featured the product in this section',
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  featured_by?: Pick<User, 'id' | 'first_name' | 'last_name'> | null;

  @ApiProperty({
    type: Date,
    description: 'Record creation timestamp',
  })
  created_at: Date;
}
