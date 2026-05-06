import { BaseGetDto } from '@/devextreme/dto/base-get.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UserLookupDto extends BaseGetDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description:
      'Search expression to filter users, e.g., "first_name", "user_id", "email".',
    example: 'first_name',
  })
  searchExpr?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description:
      'Operation to perform on the search expression, e.g., "contains", "equals".',
    example: 'contains',
  })
  searchOperation?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description: 'Value to search for in users.',
    example: 'john',
  })
  searchValue?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: () => String,
    description: 'Comma-separated list of user IDs to exclude from results.',
    example: '1,2,3',
  })
  exclude_ids?: string;
}
