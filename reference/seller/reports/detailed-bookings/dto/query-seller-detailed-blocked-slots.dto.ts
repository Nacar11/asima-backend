import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QuerySellerDetailedBlockedSlotsDto {
  @ApiPropertyOptional({
    example: 0,
    description: 'Number of records to skip',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : parseInt(value, 10),
  )
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of records to return',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : parseInt(value, 10),
  )
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
    example: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    enum: ['unavailable_date', 'created_at', 'service_title', 'status'],
    description: 'Sort field',
    example: 'unavailable_date',
  })
  @IsOptional()
  @IsIn(['unavailable_date', 'created_at', 'service_title', 'status'])
  sortField?: 'unavailable_date' | 'created_at' | 'service_title' | 'status';

  @ApiPropertyOptional({
    description: 'Filter by slot blocked status',
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter date from (YYYY-MM-DD)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({
    description: 'Filter date to (YYYY-MM-DD)',
    example: '2026-03-31',
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiPropertyOptional({
    enum: ['unavailable_date', 'created_at'],
    description: 'Date field to filter against',
    example: 'unavailable_date',
  })
  @IsOptional()
  @IsIn(['unavailable_date', 'created_at'])
  date_field?: 'unavailable_date' | 'created_at';

  @ApiPropertyOptional({
    description:
      'Search across service title, reason, start/end time, and status',
    example: 'maintenance',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Seller ID filter for system admins. Ignored for non-admin users.',
    example: 15,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : parseInt(value, 10),
  )
  @IsInt()
  @Min(1)
  seller_id?: number;
}
