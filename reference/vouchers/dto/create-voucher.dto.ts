import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { VoucherDiscountTypeEnum } from '@/vouchers/enums/voucher-discount-type.enum';
import { VoucherScopeEnum } from '@/vouchers/enums/voucher-scope.enum';
import { VoucherStatusEnum } from '@/vouchers/enums/voucher-status.enum';

/**
 * DTO for creating a voucher.
 */
export class CreateVoucherDto {
  @ApiProperty({ type: String, example: 'WELCOME100' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9-]{6,20}$/)
  code: string;
  @ApiPropertyOptional({
    enum: VoucherScopeEnum,
    example: VoucherScopeEnum.CATEGORIES,
    description:
      'Scope determines the type of eligible items. Must be one of: categories, products, service-categories, services.',
  })
  @IsOptional()
  @IsEnum(VoucherScopeEnum)
  scope?: VoucherScopeEnum;
  @ApiProperty({
    enum: VoucherDiscountTypeEnum,
    example: VoucherDiscountTypeEnum.PERCENTAGE,
    description:
      'Allowed values: shipping, fixed, percentage, b1t1, per_hours. max_discount_cap is required for percentage.',
  })
  @IsEnum(VoucherDiscountTypeEnum)
  discount_type: VoucherDiscountTypeEnum;
  @ApiProperty({ type: Number, example: 100 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Discount Value must be a number' },
  )
  @Min(0.01, { message: 'Discount Value should be more than 0' })
  discount_value: number;
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 50,
    description:
      'Maximum discount cap, crucial for percentage discounts (e.g. 50 = max $50 off).',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  max_discount_cap?: number | null;
  @ApiPropertyOptional({ type: Number, example: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  min_order_amount?: number;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  total_limit?: number | null;
  @ApiPropertyOptional({ type: Number, nullable: true, example: 1 })
  @ValidateIf((o: CreateVoucherDto) => o.is_claimable === true)
  @IsOptional()
  @IsInt()
  @Min(1)
  per_user_limit?: number | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @ValidateIf((o: CreateVoucherDto) => o.is_claimable === true)
  @IsDateString()
  starts_at?: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @ValidateIf((o: CreateVoucherDto) => o.is_claimable === true)
  @IsDateString()
  expires_at?: string | null;
  @ApiPropertyOptional({ enum: VoucherStatusEnum })
  @IsOptional()
  @IsEnum(VoucherStatusEnum)
  status?: VoucherStatusEnum;
  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  is_claimable?: boolean;
  @ApiPropertyOptional({ type: String, maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  terms_and_conditions?: string | null;
  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  include_addons_flag?: boolean | null;
}
