import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Cost Center Lookup Data Transfer Object
 *
 * DTO for cost center lookup operations with advanced search capabilities.
 * Extends DevExtreme base query parameters and adds specific search functionality
 * for cost center lookups in UI components like dropdowns and autocomplete fields.
 *
 * Supports flexible search expressions and operations for dynamic filtering.
 *
 * @example
 * ```typescript
 * const lookupDto: CostCenterLookupDto = {
 *   searchExpr: 'code',
 *   searchOperation: 'contains',
 *   searchValue: '01',
 *   skip: 0,
 *   take: 10
 * };
 * ```
 *
 * @author Cody Inc Development Team
 * @since 1.0.0
 */
export class CostCenterLookupDto extends GetQueryParams {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description:
      'Search expression to filter cost centers, e.g., "name", "code".',
    example: 'code',
  })
  searchExpr: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description:
      'Operation to perform on the search expression, e.g., "contains", "equals".',
    example: 'contains',
  })
  searchOperation: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description: 'Value to search for in cost centers.',
    example: 'laser',
  })
  searchValue: string;
}
