import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Data Transfer Object for cost center lookup operations.
 *
 * This DTO extends the base DevExtreme query parameters and provides
 * specialized fields for cost center lookup operations. It supports
 * advanced search capabilities with expression-based filtering and
 * operation-based search logic.
 *
 * The lookup functionality is designed for autocomplete, search suggestions,
 * and advanced filtering operations where users need to find cost centers
 * based on specific criteria and search patterns.
 *
 * @version 3
 * @since 1.0.0
 * @author Masters Module Team
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
 */
export class CostCenterLookupDto extends GetQueryParams {
  /** Field to search in (e.g., 'name', 'code') */
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description:
      'Search expression to filter cost centers, e.g., "name", "code".',
    example: 'code',
  })
  searchExpr: string;

  /** Search operation to perform (e.g., 'contains', 'equals') */
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description:
      'Operation to perform on the search expression, e.g., "contains", "equals".',
    example: 'contains',
  })
  searchOperation: string;

  /** Value to search for in cost centers */
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description: 'Value to search for in cost centers.',
    example: 'laser',
  })
  searchValue: string;
}
