import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Media } from '@/media/domain/media';

/**
 * Structured category response for hierarchical display
 */
export class StructuredCategory {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Electronics' })
  category_name: string;

  @ApiPropertyOptional({
    example: 'Electronic devices and gadgets',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({ example: 'electronics' })
  slug: string;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  parent_category_id?: number | null;

  @ApiProperty({ example: 'Active' })
  status: string;

  @ApiPropertyOptional({
    type: () => Media,
    nullable: true,
    description: 'Category image associated with this category',
  })
  category_image?: Media | null;

  @ApiPropertyOptional({
    type: [StructuredCategory],
    description: 'Sub-categories of this category',
    example: [],
  })
  sub_categories?: StructuredCategory[];
}

/**
 * Response type for getStructuredCategories endpoint
 */
export type StructuredCategoriesResponse = StructuredCategory[];
