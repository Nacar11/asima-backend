import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ServiceStatusEnum } from '@/services/enums/service-status.enum';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceTypeEnum } from '@/services/enums/service-type.enum';

export class QueryServiceDto {
  @ApiPropertyOptional({ description: 'Search by title or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by exact title match (case-insensitive partial match)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  category_id?: number;

  @ApiPropertyOptional({ enum: PricingTypeEnum })
  @IsOptional()
  @IsEnum(PricingTypeEnum)
  pricing_type?: PricingTypeEnum;

  @ApiPropertyOptional({ enum: ServiceTypeEnum })
  @IsOptional()
  @IsEnum(ServiceTypeEnum)
  service_type?: ServiceTypeEnum;

  @ApiPropertyOptional({ enum: ServiceStatusEnum })
  @IsOptional()
  @IsEnum(ServiceStatusEnum)
  status?: ServiceStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  requires_quote?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  instant_booking?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed). If provided, converts to skip/take',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page. If provided, converts to take',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Minimum price filter (filters by base_price for fixed pricing or hourly_rate for hourly pricing)',
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({
    description:
      'Maximum price filter (filters by base_price for fixed pricing or hourly_rate for hourly pricing)',
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'created_at',
    description: 'Field to sort by',
    enum: [
      'title',
      'created_at',
      'updated_at',
      'base_price',
      'hourly_rate',
      'average_rating',
      'total_bookings',
      'view_count',
      'category_id',
      'seller_id',
      'status',
      'service_type',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'title',
    'created_at',
    'updated_at',
    'base_price',
    'hourly_rate',
    'average_rating',
    'total_bookings',
    'view_count',
    'category_id',
    'seller_id',
    'status',
    'service_type',
  ])
  sortField?:
    | 'title'
    | 'created_at'
    | 'updated_at'
    | 'base_price'
    | 'hourly_rate'
    | 'average_rating'
    | 'total_bookings'
    | 'view_count'
    | 'category_id'
    | 'seller_id'
    | 'status'
    | 'service_type';

  @ApiPropertyOptional({
    type: String,
    example: 'DESC',
    description: 'Sort direction (ASC or DESC, default: DESC)',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortBy?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description:
      'Filter to only include services whose seller is active.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  active_seller_only?: boolean;
}
