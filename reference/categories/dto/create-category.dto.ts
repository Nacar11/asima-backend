import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

/**
 * DTO for creating a category
 */
export class CreateCategoryDto {
  @ApiProperty({
    type: String,
    example: 'Electronics',
    description: 'Category name',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  category_name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Electronic devices and gadgets',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({
    type: String,
    example: 'electronics',
    description:
      'URL-friendly slug (lowercase letters, numbers, and hyphens only)',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must contain only lowercase letters, numbers, and hyphens (no spaces, special characters, or capital letters)',
  })
  slug: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Display order for sorting',
  })
  @IsOptional()
  @IsInt()
  display_order?: number;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    nullable: true,
    description: 'Parent category ID for hierarchical categories',
  })
  @IsOptional()
  @IsInt()
  parent_category_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    nullable: true,
    description: 'Seller ID for seller-specific categories (NULL for global)',
  })
  @IsOptional()
  @IsInt()
  seller_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: null,
    nullable: true,
    description: 'Media ID for the category image',
  })
  @IsOptional()
  @IsInt()
  media_id?: number | null;

  @ApiPropertyOptional({
    enum: ActiveInactiveStatusEnum,
    example: ActiveInactiveStatusEnum.ACTIVE,
    description: 'Category status: Active or Inactive',
  })
  @IsOptional()
  @IsEnum(ActiveInactiveStatusEnum)
  status?: ActiveInactiveStatusEnum;
}
