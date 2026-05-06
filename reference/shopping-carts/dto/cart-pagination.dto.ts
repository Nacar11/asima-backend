import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO for paginating shopping cart items per PRD Section 5.5.
 *
 * PRD Specification (Line 343):
 * "Query parameters: page (optional, default 1), limit (optional, default 20, max 100)."
 *
 * @example
 * ```typescript
 * GET /shopping-carts/:cartId?page=1&limit=20
 * ```
 */
export class CartPaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (default 20, max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
