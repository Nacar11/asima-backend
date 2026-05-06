import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PricingTypeEnum } from '@/services/enums/pricing-type.enum';
import { ServiceLocationTypeEnum } from '@/services/enums/service-location-type.enum';

export class SearchServicesDto {
  @ApiPropertyOptional({ description: 'Free-text search on title/code' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by seller ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  seller_id?: number;

  @ApiPropertyOptional({ type: [Number], description: 'Category IDs filter' })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v) => Number(v));
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => Number(v));
    }
    return undefined;
  })
  category_ids?: number[];

  @ApiPropertyOptional({ description: 'Minimum base price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_price?: number;

  @ApiPropertyOptional({ description: 'Maximum base price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_price?: number;

  @ApiPropertyOptional({ description: 'Minimum average rating (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({ description: 'Latitude for nearby search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for nearby search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Radius in km for nearby search',
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius_km?: number = 25;

  @ApiPropertyOptional({ enum: PricingTypeEnum })
  @IsOptional()
  @IsEnum(PricingTypeEnum)
  pricing_type?: PricingTypeEnum;

  @ApiPropertyOptional({ description: 'Only featured services' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false'
        ? false
        : undefined,
  )
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ description: 'Only instant booking services' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false'
        ? false
        : undefined,
  )
  @IsBoolean()
  instant_booking?: boolean;

  /** @deprecated Use service_location_type filter instead */
  @ApiPropertyOptional({ description: 'Only remote-available services' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false'
        ? false
        : undefined,
  )
  @IsBoolean()
  is_remote_available?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by service location type',
    enum: ServiceLocationTypeEnum,
  })
  @IsOptional()
  @IsEnum(ServiceLocationTypeEnum)
  service_location_type?: ServiceLocationTypeEnum;

  @ApiPropertyOptional({
    description: 'City for location-based filtering',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Province/State for location-based filtering',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by',
    default: 'relevance',
    enum: [
      'relevance',
      'price_asc',
      'price_desc',
      'rating',
      'distance',
      'recent',
    ],
  })
  @IsOptional()
  @IsString()
  sort_by?:
    | 'relevance'
    | 'price_asc'
    | 'price_desc'
    | 'rating'
    | 'distance'
    | 'recent' = 'relevance';
}
