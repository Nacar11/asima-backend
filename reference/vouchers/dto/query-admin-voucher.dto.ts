import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
 * Query options for admin vouchers list endpoint.
 */
export class QueryAdminVoucherDto {
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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
