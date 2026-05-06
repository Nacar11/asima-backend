import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO for retrieving cart items with pagination.
 *
 * Supports paginating cart items for edge cases where a cart
 * might contain a large number of items (>100).
 *
 * @example
 * ```typescript
 * GET /shopping-carts/my-cart?items_page=1&items_limit=20
 * ```
 */
export class GetCartItemsDto {
  @ApiPropertyOptional({
    description: 'Page number for cart items (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  items_page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 100))
  @IsInt()
  @Min(1)
  @Max(100)
  items_limit?: number = 100;
}
