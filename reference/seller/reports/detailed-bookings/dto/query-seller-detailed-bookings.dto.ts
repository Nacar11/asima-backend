import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';

export class QuerySellerDetailedBookingsDto {
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
    enum: [
      'awaiting_confirmation_priority',
      'created_at',
      'scheduled_date',
      'booking_number',
      'sales_order_number',
      'status',
      'gross_amount',
      'total_amount',
      'net_amount',
      'released_amount',
    ],
    description: 'Sort field',
    example: 'created_at',
  })
  @IsOptional()
  @IsIn([
    'awaiting_confirmation_priority',
    'created_at',
    'scheduled_date',
    'booking_number',
    'sales_order_number',
    'status',
    'gross_amount',
    'total_amount',
    'net_amount',
    'released_amount',
  ])
  sortField?:
    | 'awaiting_confirmation_priority'
    | 'created_at'
    | 'scheduled_date'
    | 'booking_number'
    | 'sales_order_number'
    | 'status'
    | 'gross_amount'
    | 'total_amount'
    | 'net_amount'
    | 'released_amount';

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    example: 'completed',
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
    enum: ['created_at', 'scheduled_date', 'completed_at'],
    description: 'Date field to filter against',
    example: 'created_at',
  })
  @IsOptional()
  @IsIn(['created_at', 'scheduled_date', 'completed_at'])
  date_field?: 'created_at' | 'scheduled_date' | 'completed_at';

  @ApiPropertyOptional({
    description:
      'Search across booking number, sales order number, customer name, and service title',
    example: 'BK-2026',
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

  @ApiPropertyOptional({
    enum: ServiceTypeEnum,
    description: 'Filter by service type',
    example: ServiceTypeEnum.GENERAL,
  })
  @IsOptional()
  @IsIn(Object.values(ServiceTypeEnum))
  service_type?: ServiceTypeEnum;
}
