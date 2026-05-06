import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Causer } from '@/utils/domain/causer';
import { Category } from '@/categories/domain/category';
import { Exclude } from 'class-transformer';

/**
 * ProductCategory domain entity
 */
export class ProductCategory {
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
    type: Number,
    example: 1,
    description: 'Category ID',
  })
  category_id: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Is this the primary category for the product',
  })
  is_primary: boolean;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Display order of the category',
  })
  display_order: number;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: {
      id: 1,
      category_name: 'Electronics',
      description: 'Electronic products',
      slug: 'electronics',
      display_order: 1,
    },
  })
  category?: Pick<
    Category,
    'id' | 'category_name' | 'description' | 'slug' | 'display_order'
  > | null;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  created_by?: Causer | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: { id: 1, first_name: 'Admin', last_name: 'User' },
  })
  updated_by?: Causer | null;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    example: null,
  })
  deleted_by?: Causer | null;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
  })
  deleted_at?: Date | null;

  @Exclude()
  __entity?: string;
}
