import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for querying shopping carts with pagination.
 *
 * Supports filtering by search term and standard pagination parameters.
 * Used for admin/reporting endpoints that list all carts.
 *
 * @version 1
 * @since 1.0.0
 */
export class FindAllShoppingCartsDto {
  @ApiPropertyOptional({
    type: String,
    example: 'john@example.com',
    description: 'Search by user email or cart ID',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Page number (default: 1)',
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    description: 'Items per page (default: 50, max: 50)',
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number;
}
