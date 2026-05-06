import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for finding and filtering departments with pagination.
 *
 * This DTO provides query parameters for searching and paginating departments.
 * It supports text-based searching across department codes, names, and department heads,
 * along with standard pagination parameters. All fields are optional to allow
 * flexible querying scenarios.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * // Search for departments with pagination
 * const query: FindAllDepartmentsDto = {
 *   search: 'IT',
 *   page: 1,
 *   limit: 20
 * };
 *
 * // Get first page with default limit
 * const query: FindAllDepartmentsDto = {
 *   page: 1
 * };
 * ```
 */
export class FindAllDepartmentsDto {
  /**
   * Search term to filter departments.
   *
   * Searches across department codes, names, and department head names.
   * The search is case-insensitive and uses partial matching.
   * If not provided, all departments are returned (subject to pagination).
   *
   * @example "IT"
   * @example "Information Technology"
   * @example "John"
   */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Page number for pagination.
   *
   * Specifies which page of results to return. Page numbers start from 1.
   * If not provided, defaults to page 1.
   *
   * @example 1
   * @example 2
   * @example 5
   */
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  /**
   * Number of items per page.
   *
   * Specifies how many departments to return per page.
   * If not provided, defaults to 10 items per page.
   * Maximum limit is typically enforced by the service layer.
   *
   * @example 10
   * @example 20
   * @example 50
   */
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;
}
