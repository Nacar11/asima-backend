import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';

const SCOPE_VALUES = Object.values(VoucherScopeEnum) as string[];

/** Parse scope query param (e.g. "services" or "global,services") into enum array. */
export function parseScopeParam(scope: string | undefined): VoucherScopeEnum[] {
  if (scope == null || scope === '') return [];
  const raw = String(scope).trim();
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => SCOPE_VALUES.includes(s)) as VoucherScopeEnum[];
}

/**
 * Query options for voucher list endpoint.
 * scope: single value or comma-separated (e.g. "global,services"). Use parseScopeParam() when building queries.
 */
export class QueryVoucherDto {
  @ApiPropertyOptional({ type: String, example: 'WELCOME' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  search?: string;
  @ApiPropertyOptional({
    description:
      'Filter by scope; single value or comma-separated (e.g. global,services)',
    example: 'global,services',
  })
  @IsOptional()
  @IsString()
  scope?: string;
  @ApiPropertyOptional({ enum: VoucherStatusEnum })
  @IsOptional()
  @IsEnum(VoucherStatusEnum)
  status?: VoucherStatusEnum;
  @ApiPropertyOptional({ enum: VoucherDiscountTypeEnum })
  @IsOptional()
  @IsEnum(VoucherDiscountTypeEnum)
  discount_type?: VoucherDiscountTypeEnum;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filter vouchers by seller_id',
    example: 15,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  })
  @IsInt()
  @Min(1)
  seller_id?: number;

  @ApiHideProperty()
  @IsOptional()
  sellerId?: number | null;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'If true, include global/admin vouchers (seller_id is null) together with seller vouchers',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  include_admin_vouchers?: boolean;
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description:
      'Lower bound of the validity window. Vouchers whose `expires_at` is before this date are excluded. Date-only format (YYYY-MM-DD).',
    example: '2026-05-01',
  })
  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description:
      'Upper bound of the validity window. Vouchers whose `starts_at` is after this date are excluded. Date-only format (YYYY-MM-DD).',
    example: '2026-05-31',
  })
  @IsOptional()
  @IsDateString()
  ends_at?: string;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  })
  @IsInt()
  @Min(0)
  skip?: number;
  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  })
  @IsInt()
  @Min(1)
  take?: number;
}
