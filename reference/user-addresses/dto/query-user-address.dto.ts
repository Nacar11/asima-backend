import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryUserAddressDto {
  @ApiPropertyOptional({
    example: 'Home',
    description: 'Filter by address label (partial match)',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    example: 'Juan',
    description: 'Filter by recipient name (partial match)',
  })
  @IsString()
  @IsOptional()
  recipient_name?: string;

  @ApiPropertyOptional({
    example: 'Makati',
    description: 'Filter by city (partial match)',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    example: 'Metro Manila',
    description: 'Filter by state/province (partial match)',
  })
  @IsString()
  @IsOptional()
  state_province?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by default address status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Number of items to skip (default: 0)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items to take/return (default: 20)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'DESC',
    description: 'Sort by created_at (ASC or DESC, default: DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    example: 'Rizal',
    description:
      'Search across label, recipient_name, address_line1, city (partial match)',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
