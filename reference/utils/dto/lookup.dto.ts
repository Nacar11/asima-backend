import { BaseGetDto as GetQueryParams } from '@/devextreme/dto/base-get.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LookUpDto extends GetQueryParams {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description: 'Search expression to filter materials, e.g., "name", "code".',
  })
  searchExpr: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description:
      'Operation to perform on the search expression, e.g., "contains", "equals".',
  })
  searchOperation: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description: 'Value to search for in materials.',
  })
  searchValue: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description: 'Search value for filtering by name (alias for searchValue).',
  })
  name: string;
}
