import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { DevExtremeGetDto } from '@/devextreme/dto/devextreme-get.dto';
import { ActiveInactiveStatusEnum } from '@/utils/enums/status-enum';

/**
 * DTO for querying personalized categories
 * Extends DevExtremeGetDto to inherit skip, take, sort, filter parameters
 * Used by sellers to get their own categories + optionally global categories
 */
export class QueryPersonalizedCategoryDto extends DevExtremeGetDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Electronics',
    description: 'Filter by category name',
  })
  @IsOptional()
  @IsString()
  category_name?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Include global categories along with seller categories. Default: false for categories page, true for product form/filter.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  @IsBoolean()
  include_global?: boolean;

  @ApiPropertyOptional({
    enum: ActiveInactiveStatusEnum,
    example: ActiveInactiveStatusEnum.ACTIVE,
    description: 'Filter by status: Active or Inactive',
  })
  @IsOptional()
  @IsEnum(ActiveInactiveStatusEnum)
  status?: ActiveInactiveStatusEnum;
}
