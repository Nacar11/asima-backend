import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive, Min } from 'class-validator';

/**
 * DTO for querying shipping providers
 */
export class QueryShippingProviderDto {
  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Number of records to skip',
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    description: 'Number of records to take',
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  take?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;
}

/**
 * DTO for querying shipping methods
 */
export class QueryShippingMethodDto {
  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Number of records to skip',
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    description: 'Number of records to take',
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  take?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Filter by provider ID',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsPositive()
  provider_id?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;
}
