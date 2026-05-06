import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseGetDto } from './base-get.dto';

/**
 * Extended DTO for DevExtreme DataGrid/DataSource requests
 * Includes additional DevExtreme-specific parameters
 */
export class DevExtremeGetDto extends BaseGetDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: 'DevExtreme: Whether to return total count',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  requireTotalCount?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'DevExtreme: Search operation type',
    example: 'contains',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/"/g, '') : value,
  )
  @IsString()
  searchOperation?: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'DevExtreme: Custom user data',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  userData?: any;
}
