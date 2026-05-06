import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
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

/**
 * Query options for seller vouchers list endpoint.
 */
export class QuerySellerVoucherDto {
  @ApiPropertyOptional({ type: String, example: 'WELCOME' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  search?: string;
  @ApiPropertyOptional({ enum: VoucherScopeEnum })
  @IsOptional()
  @IsEnum(VoucherScopeEnum)
  scope?: VoucherScopeEnum;
  @ApiPropertyOptional({ enum: VoucherStatusEnum })
  @IsOptional()
  @IsEnum(VoucherStatusEnum)
  status?: VoucherStatusEnum;
  @ApiPropertyOptional({ enum: VoucherDiscountTypeEnum })
  @IsOptional()
  @IsEnum(VoucherDiscountTypeEnum)
  discount_type?: VoucherDiscountTypeEnum;
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
  @ApiHideProperty()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  include_admin_vouchers?: boolean;
}
