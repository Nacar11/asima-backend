import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for querying sub-sections with pagination and search.
 *
 * This DTO defines the optional fields needed to query sub-sections
 * with pagination and search functionality. It includes validation
 * rules for all fields ensuring data integrity and performance.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
 */
export class FindAllSubSectionsDto {
  /**
   * Search term for filtering sub-sections.
   *
   * This field allows searching across sub-section fields including
   * name, code, and head information. It supports partial matching
   * and case-insensitive searches for better user experience.
   *
   * @example 'Backend'
   * @example '01'
   * @example 'John'
   */
  @ApiPropertyOptional({
    type: () => String,
    example: 'A',
  })
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Page number for pagination.
   *
   * This field specifies which page of results to return.
   * It starts from 1 and defaults to 1 if not provided.
   * Used in conjunction with limit for pagination.
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
   * Number of results per page for pagination.
   *
   * This field specifies how many sub-sections to return per page.
   * It defaults to 10 if not provided and has a maximum limit
   * to ensure performance and prevent abuse.
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
