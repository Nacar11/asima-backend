import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { UserVoucherStatusEnum } from '@/vouchers/enums/user-voucher-status.enum';

/**
 * Query options for customer voucher list endpoint.
 */
export class QueryMyVouchersDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserVoucherStatusEnum })
  @IsOptional()
  @IsEnum(UserVoucherStatusEnum)
  status?: UserVoucherStatusEnum;

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

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1' || value === true)
  @IsBoolean()
  group_vouchers?: boolean;
}
