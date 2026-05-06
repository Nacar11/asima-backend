import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsIn,
  IsDateString,
} from 'class-validator';

/**
 * DTO for querying seller earnings with filters and pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class QuerySellerEarningDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by seller ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seller_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by source type',
    example: 'booking',
    enum: ['booking', 'sales_order'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['booking', 'sales_order'])
  source_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by source ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  source_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'available',
    enum: ['pending', 'available', 'processing', 'paid', 'held'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'available', 'processing', 'paid', 'held'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by available date (from)',
    example: '2024-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  available_from?: string;

  @ApiPropertyOptional({
    description: 'Filter by available date (to)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  available_to?: string;
}
