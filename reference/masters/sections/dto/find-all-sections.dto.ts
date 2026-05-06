import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for finding sections with pagination and search.
 *
 * This DTO defines the optional fields for querying sections with
 * pagination and search capabilities. It includes validation rules for
 * search terms, page numbers, and result limits to ensure efficient
 * data retrieval and prevent abuse.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 *
 * @example
 * ```typescript
 * const findDto = new FindAllSectionsDto();
 * findDto.search = 'Engineering';
 * findDto.page = 1;
 * findDto.limit = 10;
 * ```
 */
export class FindAllSectionsDto {
  /**
   * Search term for filtering sections.
   *
   * This field allows searching across section names, codes, and
   * section head information. It performs case-insensitive partial
   * matching to help users find relevant sections quickly.
   *
   * @example 'Engineering'
   * @example '01'
   * @example 'John'
   */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Page number for pagination.
   *
   * This field specifies which page of results to return.
   * It defaults to 1 if not provided and must be a positive integer.
   * Used in conjunction with the limit field for pagination.
   *
   * @example 1
   * @example 2
   * @example 10
   */
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  /**
   * Number of results per page.
   *
   * This field specifies how many sections to return per page.
   * It defaults to 10 if not provided and must be a positive integer.
   * Used in conjunction with the page field for pagination.
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
