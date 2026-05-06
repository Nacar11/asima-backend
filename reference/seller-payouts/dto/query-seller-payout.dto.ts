import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';

/**
 * DTO for querying seller payouts with filters and pagination.
 *
 * @version 1
 * @since 1.0.0
 */
export class QuerySellerPayoutDto {
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
    description: 'Filter by status',
    example: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
  status?: string;
}
