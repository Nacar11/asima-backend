import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for finding divisions with pagination and search.
 *
 * This DTO defines the optional fields for querying divisions with
 * pagination and search capabilities. It includes validation rules for
 * search terms and pagination parameters ensuring proper data handling.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const findDto: FindAllDivisionsDto = {
 *   search: 'Engineering',
 *   page: 1,
 *   limit: 10
 * };
 * ```
 */
export class FindAllDivisionsDto {
  /**
   * Search term for filtering divisions.
   *
   * This field allows searching across division names and codes.
   * The search is case-insensitive and supports partial matches.
   *
   * @example 'Engineering'
   * @example '01'
   */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Page number for pagination.
   *
   * This field specifies which page of results to return.
   * If not provided, defaults to 1. Must be a positive integer.
   *
   * @example 1
   * @example 2
   */
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  /**
   * Number of items per page for pagination.
   *
   * This field specifies how many divisions to return per page.
   * If not provided, defaults to 10. Must be a positive integer.
   *
   * @example 10
   * @example 25
   * @example 50
   */
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;
}
