import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for querying rating templates.
 */
export class QueryRatingTemplateDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;
}
