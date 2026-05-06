import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

/**
 * DTO for updating a category
 */
export class UpdateCategoryDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Electronics Updated',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  category_name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Updated description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'electronics-updated',
    description:
      'URL-friendly slug (lowercase letters, numbers, and hyphens only)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must contain only lowercase letters, numbers, and hyphens (no spaces, special characters, or capital letters)',
  })
  slug?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  display_order?: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  parent_category_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  seller_id?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
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
