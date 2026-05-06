import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AdditionalFeeTypeEnum } from '@/service-areas/enums/additional-fee-type.enum';

export class QueryServiceAreaDto {
  /**
   * DevExtreme DataSource/DataGrid sends a number of extra query params (filter/sort/etc).
   * Our backend uses strict query validation (whitelist + forbidNonWhitelisted),
   * so we explicitly allow these fields here to prevent 422 responses.
   *
   * Note: service-areas currently only uses a subset of these params (skip/take/status/etc).
   */
  @ApiPropertyOptional({
    type: String,
    description: 'DevExtreme: Record filtering (JSON string)',
    example: '["status","=","Active"]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  filter?: any;

  @ApiPropertyOptional({
    type: String,
    description: 'DevExtreme: Record sorting (JSON string)',
    example: '[{"selector":"isDefault","desc":true}]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  sort?: any;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'DevExtreme: Whether to return total count',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  requireTotalCount?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'DevExtreme: Search operation type',
    example: 'contains',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/"/g, '') : value,
  )
  @IsString()
  searchOperation?: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'DevExtreme: Custom user data (JSON string)',
    example: {},
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  userData?: any;

  @ApiPropertyOptional({ description: 'Search by city/province/postal_code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by seller ID (through service relationship)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seller_id?: number;

  @ApiPropertyOptional({ enum: AdditionalFeeTypeEnum })
  @IsOptional()
  @IsEnum(AdditionalFeeTypeEnum)
  additional_fee_type?: AdditionalFeeTypeEnum;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  status?: string;

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
}
