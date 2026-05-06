import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  Max,
  Min,
  IsDateString,
  IsInt,
  IsIn,
  IsArray,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BookingStatusEnum } from '@/bookings/enums/booking-status.enum';

/**
 * DTO for querying bookings.
 *
 * Used for filtering and paginating bookings.
 * Supports both skip/take and page/limit pagination patterns.
 *
 * @version 1
 * @since 1.0.0
 */
export class QueryBookingDto {
  @ApiPropertyOptional({
    description: 'Number of items to skip (alternative to page)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    description: 'Number of items to take/return (alternative to limit)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed). If provided, converts to skip/take',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page. If provided, converts to take',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Filter by booking status. Special value "active" includes confirmed, provider_assigned, and in_progress',
    enum: [...Object.values(BookingStatusEnum), 'active'],
    example: BookingStatusEnum.PENDING,
  })
  @IsOptional()
  @IsIn([...Object.values(BookingStatusEnum), 'active'], {
    message: 'Status must be a valid booking status or "active"',
  })
  status?: BookingStatusEnum | 'active';

  @ApiPropertyOptional({
    description:
      'When used with status=pending, include bookings with status awaiting_quotation (pending + awaiting_quotation)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined
      ? undefined
      : value === true || value === 'true' || value === '1',
  )
  awaiting_quotation?: boolean;

  @ApiPropertyOptional({
    description:
      'Multiple statuses filter (array or comma-separated). If provided, overrides status/awaiting_quotation.',
    type: [String],
    enum: [...Object.values(BookingStatusEnum), 'active'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn([...Object.values(BookingStatusEnum), 'active'], { each: true })
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return value;
    return `${value}`
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  })
  statuses?: (BookingStatusEnum | 'active')[];

  @ApiPropertyOptional({
    description: 'Filter by seller ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seller_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  customer_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date (YYYY-MM-DD)',
    example: '2024-12-25',
  })
  @IsOptional()
  @IsDateString()
  scheduled_date?: string;

  @ApiPropertyOptional({
    description:
      'Filter by start date (YYYY-MM-DD) - bookings scheduled on or after this date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description:
      'Filter by end date (YYYY-MM-DD) - bookings scheduled on or before this date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'created_at',
      'updated_at',
      'scheduled_date',
      'total',
      'status',
      'booking_number',
      'id',
    ],
    default: 'created_at',
  })
  @IsOptional()
  @IsIn([
    'created_at',
    'updated_at',
    'scheduled_date',
    'total',
    'status',
    'booking_number',
    'id',
  ])
  sortBy?:
    | 'created_at'
    | 'updated_at'
    | 'scheduled_date'
    | 'total'
    | 'status'
    | 'booking_number'
    | 'id';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
